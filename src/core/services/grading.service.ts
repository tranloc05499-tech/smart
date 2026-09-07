export interface QuestionGradingItem {
  questionId: string;
  type: string; // single_choice, multiple_choice, true_false, short_answer, essay
  correctAnswer: string | null;
  points: number;
}

export interface StudentAnswerItem {
  questionId: string;
  selectedOptionIds?: string | null;
  textAnswer?: string | null;
}

export interface QuestionGradingResult {
  questionId: string;
  isCorrect: boolean;
  score: number;
  studentAnswer: string;
  correctAnswer: string;
}

export interface ExamGradingSummary {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  details: QuestionGradingResult[];
}

export class GradingEngine {
  /**
   * Evaluates student answers against question key for auto-gradable questions.
   */
  public static evaluateExam(
    questions: QuestionGradingItem[],
    answers: StudentAnswerItem[]
  ): ExamGradingSummary {
    const answerMap = new Map<string, StudentAnswerItem>();
    for (const ans of answers) {
      answerMap.set(ans.questionId, ans);
    }

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const details: QuestionGradingResult[] = [];

    for (const q of questions) {
      maxScore += q.points;
      const studentAns = answerMap.get(q.questionId);

      if (!studentAns || (!studentAns.selectedOptionIds && !studentAns.textAnswer)) {
        skippedCount++;
        details.push({
          questionId: q.questionId,
          isCorrect: false,
          score: 0,
          studentAnswer: "",
          correctAnswer: q.correctAnswer || "",
        });
        continue;
      }

      let isCorrect = false;
      const given = (studentAns.selectedOptionIds || studentAns.textAnswer || "").trim();
      const expected = (q.correctAnswer || "").trim();

      if (q.type === "single_choice" || q.type === "true_false") {
        isCorrect = given.toUpperCase() === expected.toUpperCase();
      } else if (q.type === "multiple_choice") {
        // e.g. "A,B" vs "B,A"
        const givenSet = new Set(given.split(",").map((s) => s.trim().toUpperCase()));
        const expectedSet = new Set(expected.split(",").map((s) => s.trim().toUpperCase()));
        isCorrect =
          givenSet.size === expectedSet.size &&
          [...givenSet].every((item) => expectedSet.has(item));
      } else if (q.type === "short_answer" || q.type === "fill_blank") {
        // Case-insensitive, trimmed comparison
        isCorrect = given.toLowerCase() === expected.toLowerCase();
      } else {
        // Essay or manual question: left for manual / AI grading
        isCorrect = false;
      }

      const score = isCorrect ? q.points : 0;
      if (isCorrect) {
        correctCount++;
        totalScore += score;
      } else {
        wrongCount++;
      }

      details.push({
        questionId: q.questionId,
        isCorrect,
        score,
        studentAnswer: given,
        correctAnswer: expected,
      });
    }

    return {
      totalScore: Number(totalScore.toFixed(2)),
      maxScore: Number(maxScore.toFixed(2)),
      correctCount,
      wrongCount,
      skippedCount,
      details,
    };
  }
}
