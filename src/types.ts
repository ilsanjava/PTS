export interface QuestionRubric {
  id: number;
  topic: string;
  badge: string;
  title: string;
  scenario: string;
  question: string;
  keywords: string[];
  placeholder?: string;
  explanationHint?: string;
}

export interface RosterItem {
  nama: string;
  kelas: string;
}

export interface ExamSubmission {
  id: string;
  timestamp: string;
  nama: string;
  kelas: string;
  nilai: string; // number string e.g. "85.0"
  rincian: string; // e.g. "S1: 10.0 | S2: 7.1 | ..."
  answers?: Record<number, string>;
  syncedToGoogleSheets?: boolean;
}

export interface QuestionScoreDetail {
  questionId: number;
  score: number;
  maxScore: number;
  matchedKeywords: string[];
  missedKeywords: string[];
}
