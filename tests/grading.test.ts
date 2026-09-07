import { test, describe } from "node:test";
import assert from "node:assert";
import { GradingEngine, QuestionGradingItem, StudentAnswerItem } from "../src/core/services/grading.service";

describe("GradingEngine Unit Tests", () => {
  const sampleQuestions: QuestionGradingItem[] = [
    { questionId: "q1", type: "single_choice", correctAnswer: "A", points: 1.0 },
    { questionId: "q2", type: "single_choice", correctAnswer: "C", points: 1.0 },
    { questionId: "q3", type: "multiple_choice", correctAnswer: "A,B", points: 2.0 },
    { questionId: "q4", type: "short_answer", correctAnswer: "12", points: 1.0 },
    { questionId: "q5", type: "essay", correctAnswer: null, points: 5.0 },
  ];

  test("Calculates correct score with perfect multiple-choice and short answer", () => {
    const studentAnswers: StudentAnswerItem[] = [
      { questionId: "q1", selectedOptionIds: "A" },
      { questionId: "q2", selectedOptionIds: "C" },
      { questionId: "q3", selectedOptionIds: "B,A" }, // Order independent
      { questionId: "q4", textAnswer: "12" },
      { questionId: "q5", textAnswer: "Bài giải tự luận chi tiết..." },
    ];

    const result = GradingEngine.evaluateExam(sampleQuestions, studentAnswers);

    assert.strictEqual(result.maxScore, 10.0);
    assert.strictEqual(result.totalScore, 5.0, "Total auto-graded score should be 5.0 (essay is manual)");
    assert.strictEqual(result.correctCount, 4);
    assert.strictEqual(result.wrongCount, 1, "Essay counts as wrong in auto phase until manual grading");
    assert.strictEqual(result.skippedCount, 0);
  });

  test("Accurately counts skipped and wrong answers", () => {
    const studentAnswers: StudentAnswerItem[] = [
      { questionId: "q1", selectedOptionIds: "B" }, // Wrong
      // q2 skipped
      { questionId: "q3", selectedOptionIds: "A" }, // Partial / Wrong for multiple_choice
    ];

    const result = GradingEngine.evaluateExam(sampleQuestions, studentAnswers);

    assert.strictEqual(result.totalScore, 0);
    assert.strictEqual(result.correctCount, 0);
    assert.strictEqual(result.wrongCount, 2);
    assert.strictEqual(result.skippedCount, 3);
  });
});
