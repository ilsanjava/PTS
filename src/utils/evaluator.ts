import { HOTS_QUESTIONS } from '../data/questions';
import { QuestionScoreDetail } from '../types';

export interface EvaluationResult {
  totalScore: number;
  questionDetails: QuestionScoreDetail[];
  summaryString: string; // e.g. "S1: 10.0 | S2: 7.1 | ..."
}

export function evaluateAnswers(answers: Record<number, string>): EvaluationResult {
  let totalScore = 0;
  const questionDetails: QuestionScoreDetail[] = [];
  const scoreParts: string[] = [];

  HOTS_QUESTIONS.forEach((item) => {
    const rawAnswer = answers[item.id] || '';
    const ansLower = rawAnswer.toLowerCase();
    const matchedKeywords: string[] = [];
    const missedKeywords: string[] = [];

    item.keywords.forEach((kw) => {
      // Clean keyword comparison (case insensitive, trimmed)
      const cleanKw = kw.toLowerCase().trim();
      if (ansLower.includes(cleanKw)) {
        matchedKeywords.push(kw);
      } else {
        missedKeywords.push(kw);
      }
    });

    let qScore = (matchedKeywords.length / item.keywords.length) * 10;
    if (qScore > 10) qScore = 10;
    // Format to 1 decimal place matching prompt
    const roundedQScore = Math.min(10, Math.max(0, Math.round(qScore * 10) / 10));

    totalScore += roundedQScore;
    questionDetails.push({
      questionId: item.id,
      score: roundedQScore,
      maxScore: 10,
      matchedKeywords,
      missedKeywords,
    });

    scoreParts.push(`S${item.id}: ${roundedQScore.toFixed(1)}`);
  });

  const finalTotal = Math.min(100, Math.max(0, Math.round(totalScore * 10) / 10));

  return {
    totalScore: finalTotal,
    questionDetails,
    summaryString: scoreParts.join(' | ')
  };
}
