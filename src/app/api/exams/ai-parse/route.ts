import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import mammoth from "mammoth";

// Robust parsing of text into Questions
export function parseExamText(rawText: string) {
  const questions: Array<{
    content: string;
    type: "single_choice" | "multiple_choice" | "essay";
    points: number;
    explanation?: string;
    options: { label: string; content: string; isCorrect: boolean }[];
  }> = [];

  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Split by question markers
  const parts = normalized.split(/(?=(?:Câu|Bài|Question)\s+\d+[\s:.-])/i);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const qMatch = trimmed.match(/^(?:Câu|Bài|Question)\s+\d+[\s:.-]*(.*)/i);
    if (!qMatch) continue;

    const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Detect Answer key
    const ansMatch = trimmed.match(/(?:Đáp án|Đáp án đúng|Key|Ans)[:\s]*([A-D])/i);
    const correctLetter = ansMatch ? ansMatch[1].toUpperCase() : null;

    // Detect explanation
    const expMatch = trimmed.match(/(?:Lời giải|Giải thích|Hướng dẫn giải)[:\s]*([\s\S]*)$/i);
    const explanation = expMatch ? expMatch[1].trim() : undefined;

    const contentLines: string[] = [];
    const options: { label: string; content: string; isCorrect: boolean }[] = [];
    let parsingOptions = false;

    for (const line of lines) {
      const optMatch = line.match(/^([A-D])[\.\)\/\s]+(.*)/i);
      if (optMatch) {
        parsingOptions = true;
        const label = optMatch[1].toUpperCase();
        const optText = optMatch[2].replace(/(?:Đáp án|Key)[:\s]*[A-D].*/i, "").trim();
        const isCorrect = correctLetter ? label === correctLetter : label === "A";

        options.push({
          label,
          content: optText || `Lựa chọn ${label}`,
          isCorrect,
        });
      } else if (!parsingOptions) {
        if (!line.match(/^(?:Đáp án|Key|Lời giải|Giải thích)/i)) {
          contentLines.push(line);
        }
      }
    }

    const content = contentLines.join("\n").replace(/^(?:Câu|Bài|Question)\s+\d+[\s:.-]*/i, "").trim() || trimmed.slice(0, 100);
    const isEssay = options.length < 2;

    questions.push({
      content,
      type: isEssay ? "essay" : "single_choice",
      points: 1.0,
      explanation,
      options: isEssay ? [] : options,
    });
  }

  return questions;
}

// Generate unique 6-char code
async function generateUniqueCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  let attempts = 0;
  while (attempts < 10) {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const existing = await prisma.exam.findUnique({ where: { code } });
    if (!existing) return code;
    attempts++;
  }
  return code + Math.floor(Math.random() * 100);
}

// POST: AI Document Parser & Online Exam Generator
export async function POST(request: NextRequest) {
  const session = await getAuthUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const textPrompt = formData.get("text") as string | null;
    const title = (formData.get("title") as string | null) || "Đề thi số hoá AI";
    const durationMinutes = Number(formData.get("durationMinutes")) || 45;
    const passScore = Number(formData.get("passScore")) || 5.0;
    const antiCheatLevel = Number(formData.get("antiCheatLevel")) || 1;

    let extractedText = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        // Use mammoth to extract clean text from Word docx
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (fileName.endsWith(".pdf")) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParse = require("pdf-parse");
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text;
        } catch (pdfErr) {
          console.error("PDF parse error:", pdfErr);
          // Fallback: decode text
          extractedText = buffer.toString("utf-8");
        }
      } else {
        // Plain text / Markdown
        extractedText = buffer.toString("utf-8");
      }
    } else if (textPrompt) {
      extractedText = textPrompt;
    } else {
      return NextResponse.json({ error: "Vui lòng tải lên file đề thi hoặc dán văn bản câu hỏi" }, { status: 400 });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "Không thể đọc được nội dung văn bản từ file tải lên" }, { status: 400 });
    }

    // Parse questions from extracted text
    let parsedQuestions = parseExamText(extractedText);

    // Fallback: If no "Câu X:" markers found, split by paragraphs
    if (parsedQuestions.length === 0) {
      const cleanLines = extractedText
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 5 && !l.startsWith("%PDF") && !l.includes("FlateDecode"));

      if (cleanLines.length > 0) {
        const chunks: string[] = [];
        let currentChunk: string[] = [];

        for (const line of cleanLines) {
          if (line.match(/^\d+[\.\)\:]/) && currentChunk.length > 0) {
            chunks.push(currentChunk.join("\n"));
            currentChunk = [line];
          } else {
            currentChunk.push(line);
          }
        }
        if (currentChunk.length > 0) chunks.push(currentChunk.join("\n"));

        parsedQuestions = chunks.slice(0, 50).map((chunk, idx) => {
          const lines = chunk.split("\n");
          return {
            content: lines[0] || `Câu hỏi số ${idx + 1}`,
            type: "single_choice" as const,
            points: 1.0,
            options: [
              { label: "A", content: lines[1]?.replace(/^[A-D][\.\)]\s*/, "") || "Phương án A", isCorrect: true },
              { label: "B", content: lines[2]?.replace(/^[A-D][\.\)]\s*/, "") || "Phương án B", isCorrect: false },
              { label: "C", content: lines[3]?.replace(/^[A-D][\.\)]\s*/, "") || "Phương án C", isCorrect: false },
              { label: "D", content: lines[4]?.replace(/^[A-D][\.\)]\s*/, "") || "Phương án D", isCorrect: false },
            ],
          };
        });
      }
    }

    if (parsedQuestions.length === 0) {
      return NextResponse.json({
        error: "Không nhận diện được câu hỏi nào từ tài liệu. Vui lòng định dạng file dạng: Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: A",
      }, { status: 400 });
    }

    // 1. Create the Exam
    const code = await generateUniqueCode();
    const exam = await prisma.exam.create({
      data: {
        title: title.trim(),
        code,
        durationMinutes,
        passScore,
        antiCheatLevel,
        status: "PUBLISHED",
        teacherId: session.userId,
      },
    });

    // 2. Create Questions & link to Exam
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];

      const question = await prisma.question.create({
        data: {
          content: q.content,
          type: q.type,
          points: q.points,
          explanation: q.explanation || null,
          createdById: session.userId,
          options: q.options && q.options.length > 0
            ? {
                createMany: {
                  data: q.options.map((opt, optIdx) => ({
                    label: opt.label,
                    content: opt.content,
                    isCorrect: opt.isCorrect,
                    order: optIdx,
                  })),
                },
              }
            : undefined,
        },
      });

      await prisma.examQuestion.create({
        data: {
          examId: exam.id,
          questionId: question.id,
          order: i + 1,
          points: q.points,
        },
      });
    }

    return NextResponse.json({
      success: true,
      examId: exam.id,
      code: exam.code,
      title: exam.title,
      questionsCount: parsedQuestions.length,
      durationMinutes: exam.durationMinutes,
      message: `Đã số hoá và tạo thành công đề thi với ${parsedQuestions.length} câu hỏi!`,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/exams/ai-parse error:", error);
    return NextResponse.json({ error: "Lỗi xử lý file đề thi bằng AI" }, { status: 500 });
  }
}
