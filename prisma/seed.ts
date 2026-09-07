import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu gieo mầm dữ liệu (Seed Data)...");

  // Clear existing records in correct relation order
  await prisma.examAnswer.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.examClassAssignment.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.examSection.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.submissionVersion.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.questionBank.deleteMany();
  await prisma.classMember.deleteMany();
  await prisma.class.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("123456", salt);

  // 1. Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@edutech.vn",
      fullName: "Quản Trị Viên Hệ Thống",
      role: "SUPER_ADMIN",
      passwordHash,
      phone: "0900000001",
    },
  });

  const teacher = await prisma.user.create({
    data: {
      email: "teacher@edutech.vn",
      fullName: "Thầy Nguyễn Văn An",
      role: "TEACHER",
      passwordHash,
      phone: "0901234567",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: "student1@edutech.vn",
      fullName: "Trần Minh Anh",
      role: "STUDENT",
      passwordHash,
      phone: "0912345678",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: "student2@edutech.vn",
      fullName: "Lê Hoàng Long",
      role: "STUDENT",
      passwordHash,
      phone: "0923456789",
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: "student3@edutech.vn",
      fullName: "Phạm Thu Thảo",
      role: "STUDENT",
      passwordHash,
      phone: "0934567890",
    },
  });

  // 2. Organization
  const org = await prisma.organization.create({
    data: {
      name: "Trường THPT Chuyên Nguyễn Huệ",
      code: "THPT-NH-HN",
    },
  });

  await prisma.organizationMember.createMany({
    data: [
      { organizationId: org.id, userId: admin.id, role: "ADMIN" },
      { organizationId: org.id, userId: teacher.id, role: "TEACHER" },
      { organizationId: org.id, userId: student1.id, role: "STUDENT" },
    ],
  });

  // 3. Classes
  const class12A1 = await prisma.class.create({
    data: {
      name: "12A1 - Toán Chuyên 2026-2027",
      code: "12A1-TOAN",
      subject: "Toán",
      grade: 12,
      schoolYear: "2026-2027",
      description: "Lớp Toán Nâng Cao luyện thi Đại học & Tốt nghiệp THPT",
      teacherId: teacher.id,
      orgId: org.id,
    },
  });

  const class12A2 = await prisma.class.create({
    data: {
      name: "12A2 - Toán Cơ Bản 2026-2027",
      code: "12A2-TOAN",
      subject: "Toán",
      grade: 12,
      schoolYear: "2026-2027",
      description: "Chương trình bám sát SGK Kết nối tri thức",
      teacherId: teacher.id,
      orgId: org.id,
    },
  });

  const class11B1 = await prisma.class.create({
    data: {
      name: "11B1 - Vật Lý 2026-2027",
      code: "11B1-LY",
      subject: "Vật Lý",
      grade: 11,
      schoolYear: "2026-2027",
      teacherId: teacher.id,
      orgId: org.id,
    },
  });

  // Enroll students into 12A1
  await prisma.classMember.createMany({
    data: [
      { classId: class12A1.id, studentId: student1.id, studentCode: "HS001" },
      { classId: class12A1.id, studentId: student2.id, studentCode: "HS002" },
      { classId: class12A1.id, studentId: student3.id, studentCode: "HS003" },
      { classId: class12A2.id, studentId: student2.id, studentCode: "HS002" },
    ],
  });

  // 4. Question Bank
  const qBank = await prisma.questionBank.create({
    data: {
      title: "Ngân hàng câu hỏi Toán 12: Hàm số & Tọa độ Oxyz",
      description: "Tổng hợp các dạng bài khảo sát hàm số, mũ - logarit và hình học không gian Oxyz",
      subject: "Toán",
      grade: 12,
      teacherId: teacher.id,
    },
  });

  // 5. Questions with Options
  const q1 = await prisma.question.create({
    data: {
      bankId: qBank.id,
      createdById: teacher.id,
      type: "single_choice",
      content: "Cho hàm số $y = f(x)$ có bảng biến thiên trên đoạn $[-3; 3]$. Điểm cực đại của hàm số đã cho là:",
      subject: "Toán",
      grade: 12,
      chapter: "Chương 1: Ứng dụng đạo hàm",
      topic: "Cực trị của hàm số",
      difficulty: "recognition",
      points: 0.5,
      correctAnswer: "A",
      explanation: "Dựa vào bảng biến thiên, đạo hàm đổi dấu từ dương sang âm khi qua $x = 1$, do đó điểm cực đại là $x = 1$.",
      options: {
        create: [
          { label: "A", content: "$x = 1$", isCorrect: true, order: 0 },
          { label: "B", content: "$x = -1$", isCorrect: false, order: 1 },
          { label: "C", content: "$y = 2$", isCorrect: false, order: 2 },
          { label: "D", content: "$x = 3$", isCorrect: false, order: 3 },
        ],
      },
    },
  });

  const q2 = await prisma.question.create({
    data: {
      bankId: qBank.id,
      createdById: teacher.id,
      type: "single_choice",
      content: "Đường tiệm cận ngang của đồ thị hàm số $y = \\frac{2x - 1}{x + 1}$ là đường thẳng:",
      subject: "Toán",
      grade: 12,
      chapter: "Chương 1: Ứng dụng đạo hàm",
      topic: "Tiệm cận đồ thị hàm số",
      difficulty: "comprehension",
      points: 0.5,
      correctAnswer: "B",
      explanation: "Ta có $\\lim_{x \\to \\pm\\infty} \\frac{2x - 1}{x + 1} = 2$. Vậy tiệm cận ngang là đường thẳng $y = 2$.",
      options: {
        create: [
          { label: "A", content: "$y = -1$", isCorrect: false, order: 0 },
          { label: "B", content: "$y = 2$", isCorrect: true, order: 1 },
          { label: "C", content: "$x = 2$", isCorrect: false, order: 2 },
          { label: "D", content: "$x = -1$", isCorrect: false, order: 3 },
        ],
      },
    },
  });

  const q3 = await prisma.question.create({
    data: {
      bankId: qBank.id,
      createdById: teacher.id,
      type: "single_choice",
      content: "Tập nghiệm của bất phương trình $\\log_2(x - 1) < 3$ là:",
      subject: "Toán",
      grade: 12,
      chapter: "Chương 2: Hàm số mũ và logarit",
      topic: "Bất phương trình logarit",
      difficulty: "comprehension",
      points: 0.5,
      correctAnswer: "C",
      explanation: "Điều kiện: $x - 1 > 0 \\Leftrightarrow x > 1$. BPT $\\Leftrightarrow x - 1 < 2^3 = 8 \\Leftrightarrow x < 9$. Vậy nghiệm là $(1; 9)$.",
      options: {
        create: [
          { label: "A", content: "$( -\\infty; 9 )$", isCorrect: false, order: 0 },
          { label: "B", content: "$( 1; 7 )$", isCorrect: false, order: 1 },
          { label: "C", content: "$( 1; 9 )$", isCorrect: true, order: 2 },
          { label: "D", content: "$( 2; 9 )$", isCorrect: false, order: 3 },
        ],
      },
    },
  });

  const q4 = await prisma.question.create({
    data: {
      bankId: qBank.id,
      createdById: teacher.id,
      type: "single_choice",
      content: "Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 16$. Tọa độ tâm $I$ và bán kính $R$ của mặt cầu là:",
      subject: "Toán",
      grade: 12,
      chapter: "Chương 3: Phương pháp tọa độ trong không gian",
      topic: "Phương trình mặt cầu",
      difficulty: "recognition",
      points: 0.5,
      correctAnswer: "D",
      explanation: "Mặt cầu có tâm $I(1; -2; 3)$ và bán kính $R = \\sqrt{16} = 4$.",
      options: {
        create: [
          { label: "A", content: "$I(-1; 2; -3), R = 16$", isCorrect: false, order: 0 },
          { label: "B", content: "$I(1; -2; 3), R = 16$", isCorrect: false, order: 1 },
          { label: "C", content: "$I(-1; 2; -3), R = 4$", isCorrect: false, order: 2 },
          { label: "D", content: "$I(1; -2; 3), R = 4$", isCorrect: true, order: 3 },
        ],
      },
    },
  });

  const q5 = await prisma.question.create({
    data: {
      bankId: qBank.id,
      createdById: teacher.id,
      type: "single_choice",
      content: "Giá trị lớn nhất của hàm số $f(x) = x^3 - 3x + 2$ trên đoạn $[0; 2]$ bằng:",
      subject: "Toán",
      grade: 12,
      chapter: "Chương 1: Ứng dụng đạo hàm",
      topic: "Giá trị lớn nhất, nhỏ nhất",
      difficulty: "application",
      points: 0.5,
      correctAnswer: "A",
      explanation: "$f'(x) = 3x^2 - 3 = 0 \\Leftrightarrow x = 1$ (do $x \\in [0; 2]$). Ta có $f(0) = 2, f(1) = 0, f(2) = 4$. Vậy GTLN là 4.",
      options: {
        create: [
          { label: "A", content: "$4$", isCorrect: true, order: 0 },
          { label: "B", content: "$2$", isCorrect: false, order: 1 },
          { label: "C", content: "$0$", isCorrect: false, order: 2 },
          { label: "D", content: "$-2$", isCorrect: false, order: 3 },
        ],
      },
    },
  });

  const q6 = await prisma.question.create({
    data: {
      bankId: qBank.id,
      createdById: teacher.id,
      type: "essay",
      content: "Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác vuông tại $B$, $AB = a, BC = a\\sqrt{3}$. Cạnh bên $SA$ vuông góc với đáy và $SA = 2a$. Tính thể tích khối chóp $S.ABC$ theo $a$.",
      subject: "Toán",
      grade: 12,
      chapter: "Chương 1: Khối đa diện",
      topic: "Thể tích khối chóp",
      difficulty: "application",
      points: 2.0,
      explanation: "Diện tích đáy $S_{\\Delta ABC} = \\frac{1}{2} AB \\cdot BC = \\frac{1}{2} a \\cdot a\\sqrt{3} = \\frac{a^2\\sqrt{3}}{2}$. Chiều cao $h = SA = 2a$. Thể tích $V = \\frac{1}{3} S_{ABC} \\cdot h = \\frac{1}{3} \\frac{a^2\\sqrt{3}}{2} \\cdot 2a = \\frac{a^3\\sqrt{3}}{3}$.",
    },
  });

  // 6. Exam: Giữa Kỳ 1
  const exam = await prisma.exam.create({
    data: {
      title: "Kiểm tra Giữa kỳ I - Môn Toán 12 (Năm học 2026-2027)",
      code: "8F3K2A",
      description: "Đề kiểm tra đánh giá định kỳ 45 phút - Bao gồm trắc nghiệm và tự luận",
      durationMinutes: 45,
      maxAttempts: 1,
      randomizeQuestions: true,
      randomizeOptions: true,
      showScore: true,
      showAnswers: true,
      showExplanation: true,
      requireLogin: false,
      antiCheatLevel: 1,
      passScore: 5.0,
      status: "PUBLISHED",
      teacherId: teacher.id,
      classAssignments: {
        create: [
          { classId: class12A1.id },
          { classId: class12A2.id },
        ],
      },
      sections: {
        create: [
          {
            title: "Phần I: Câu hỏi trắc nghiệm nhiều phương án lựa chọn",
            order: 1,
            points: 2.5,
          },
          {
            title: "Phần II: Câu hỏi tự luận hình học không gian",
            order: 2,
            points: 2.0,
          },
        ],
      },
    },
    include: {
      sections: true,
    },
  });

  const sec1 = exam.sections[0];
  const sec2 = exam.sections[1];

  await prisma.examQuestion.createMany({
    data: [
      { examId: exam.id, sectionId: sec1.id, questionId: q1.id, order: 1, points: 0.5 },
      { examId: exam.id, sectionId: sec1.id, questionId: q2.id, order: 2, points: 0.5 },
      { examId: exam.id, sectionId: sec1.id, questionId: q3.id, order: 3, points: 0.5 },
      { examId: exam.id, sectionId: sec1.id, questionId: q4.id, order: 4, points: 0.5 },
      { examId: exam.id, sectionId: sec1.id, questionId: q5.id, order: 5, points: 0.5 },
      { examId: exam.id, sectionId: sec2.id, questionId: q6.id, order: 6, points: 2.0 },
    ],
  });

  // 7. Completed Attempt Sample (Student 1)
  const snapshotData = [
    { id: q1.id, type: q1.type, content: q1.content, points: 0.5, options: [{ id: "opt1", label: "A", content: "$x = 1$" }, { id: "opt2", label: "B", content: "$x = -1$" }, { id: "opt3", label: "C", content: "$y = 2$" }, { id: "opt4", label: "D", content: "$x = 3$" }] },
    { id: q2.id, type: q2.type, content: q2.content, points: 0.5, options: [{ id: "opt5", label: "A", content: "$y = -1$" }, { id: "opt6", label: "B", content: "$y = 2$" }, { id: "opt7", label: "C", content: "$x = 2$" }, { id: "opt8", label: "D", content: "$x = -1$" }] },
    { id: q3.id, type: q3.type, content: q3.content, points: 0.5, options: [{ id: "opt9", label: "A", content: "$( -\\infty; 9 )$" }, { id: "opt10", label: "B", content: "$( 1; 7 )$" }, { id: "opt11", label: "C", content: "$( 1; 9 )$" }, { id: "opt12", label: "D", content: "$( 2; 9 )$" }] },
    { id: q4.id, type: q4.type, content: q4.content, points: 0.5, options: [{ id: "opt13", label: "A", content: "$I(-1; 2; -3), R = 16$" }, { id: "opt14", label: "B", content: "$I(1; -2; 3), R = 16$" }, { id: "opt15", label: "C", content: "$I(-1; 2; -3), R = 4$" }, { id: "opt16", label: "D", content: "$I(1; -2; 3), R = 4$" }] },
    { id: q5.id, type: q5.type, content: q5.content, points: 0.5, options: [{ id: "opt17", label: "A", content: "$4$" }, { id: "opt18", label: "B", content: "$2$" }, { id: "opt19", label: "C", content: "$0$" }, { id: "opt20", label: "D", content: "$-2$" }] },
  ];

  const attempt1 = await prisma.examAttempt.create({
    data: {
      examId: exam.id,
      studentId: student1.id,
      studentName: "Trần Minh Anh",
      studentCode: "HS001",
      startedAt: new Date(Date.now() - 36 * 60 * 1000),
      expiresAt: new Date(Date.now() + 9 * 60 * 1000),
      submittedAt: new Date(Date.now() - 5 * 60 * 1000),
      score: 8.5,
      totalPoints: 10.0,
      status: "GRADED",
      snapshot: JSON.stringify(snapshotData),
    },
  });

  await prisma.examAnswer.createMany({
    data: [
      { attemptId: attempt1.id, questionId: q1.id, selectedOptionIds: "A", isCorrect: true, score: 0.5 },
      { attemptId: attempt1.id, questionId: q2.id, selectedOptionIds: "B", isCorrect: true, score: 0.5 },
      { attemptId: attempt1.id, questionId: q3.id, selectedOptionIds: "C", isCorrect: true, score: 0.5 },
      { attemptId: attempt1.id, questionId: q4.id, selectedOptionIds: "D", isCorrect: true, score: 0.5 },
      { attemptId: attempt1.id, questionId: q5.id, selectedOptionIds: "A", isCorrect: true, score: 0.5 },
    ],
  });

  // Attempt 2 (Student 2)
  const attempt2 = await prisma.examAttempt.create({
    data: {
      examId: exam.id,
      studentId: student2.id,
      studentName: "Lê Hoàng Long",
      studentCode: "HS002",
      startedAt: new Date(Date.now() - 40 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      submittedAt: new Date(Date.now() - 10 * 60 * 1000),
      score: 7.0,
      totalPoints: 10.0,
      status: "GRADED",
      snapshot: JSON.stringify(snapshotData),
    },
  });

  await prisma.examAnswer.createMany({
    data: [
      { attemptId: attempt2.id, questionId: q1.id, selectedOptionIds: "A", isCorrect: true, score: 0.5 },
      { attemptId: attempt2.id, questionId: q2.id, selectedOptionIds: "A", isCorrect: false, score: 0.0 }, // Sai
      { attemptId: attempt2.id, questionId: q3.id, selectedOptionIds: "C", isCorrect: true, score: 0.5 },
      { attemptId: attempt2.id, questionId: q4.id, selectedOptionIds: "D", isCorrect: true, score: 0.5 },
      { attemptId: attempt2.id, questionId: q5.id, selectedOptionIds: "A", isCorrect: true, score: 0.5 },
    ],
  });

  // 8. Assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      title: "Bài tập tuần 3: Đơn điệu và Cực trị hàm số chứa tham số m",
      description: "Học sinh làm bài tập tự luận ra giấy, chụp ảnh hoặc scan file PDF rõ nét để nộp bài.",
      teacherId: teacher.id,
      classId: class12A1.id,
      startDate: new Date(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      allowLateSubmission: true,
      maxAttempts: 3,
      showScore: true,
      showFeedback: true,
    },
  });

  await prisma.assignment.create({
    data: {
      title: "Vật lý 11: Bài tập Dao động điều hòa và Con lắc lò xo",
      description: "Giải bài tập trang 24 SGK Vật lý 11 và nộp file PDF trước thứ 6.",
      teacherId: teacher.id,
      classId: class11B1.id,
      startDate: new Date(),
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      allowLateSubmission: false,
    },
  });

  // Submission sample
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student1.id,
      status: "GRADED",
      currentVersion: 1,
      versions: {
        create: [
          {
            version: 1,
            textContent: "Em gửi thầy bài làm chi tiết 5 câu tìm tham số m để hàm số đơn điệu ạ.",
            submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            score: 9.0,
            feedback: "Trình bày rất rõ ràng, logic lập luận chặt chẽ. Cần chú ý điều kiện m khác 0 ở câu 3.",
            gradedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
            gradedById: teacher.id,
          },
        ],
      },
    },
  });

  console.log("✅ Seed Data hoàn tất thành công!");
  console.log("-----------------------------------------");
  console.log("Tài khoản demo sẵn sàng:");
  console.log("👑 Quản trị viên: admin@edutech.vn / 123456");
  console.log("👨‍🏫 Giáo viên:     teacher@edutech.vn / 123456");
  console.log("👨‍🎓 Học sinh 1:    student1@edutech.vn / 123456 (Trần Minh Anh - 12A1)");
  console.log("👨‍🎓 Học sinh 2:    student2@edutech.vn / 123456 (Lê Hoàng Long - 12A1)");
  console.log("Mã đề thi online: 8F3K2A");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
