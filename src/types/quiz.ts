export type DbQuizStatus = 'All' | 'Done' | 'Pending' | 'Locked';
export type QuizStatus = DbQuizStatus | 'Incomplete';

export interface QuizChoice {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  question: string;
  type: 'multiple-choice' | 'identification';
  answer: string;
  duration: number;
  choices?: QuizChoice[];
}

export interface AnsweredQuestion {
  question: string;
  correctAnswer: string;
  answer: string;
  isCorrect: boolean;
}

export interface QuizState {
  quizId: number | string;
  questionIndex: number;
  score: number;
  points: number;
  currentQuestionPoints: number;
  status: Extract<DbQuizStatus, 'Pending' | 'Done'>;
  remainingTime: number;
  questionsAnswered: AnsweredQuestion[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: string;
  isCurrentUser: boolean;
}

export interface QuizProgressRow {
  id?: number;
  user_id: string;
  quiz_id: number;
  question_index: number | null;
  score: number | null;
  points: number | null;
  status: DbQuizStatus;
  remaining_time: number | null;
  questions_answered: AnsweredQuestion[] | null;
  questions_shuffled: QuizQuestion[] | null;
  start_time: string | null;
  end_time: string | null;
  total_items: number | null;
  date_taken: string | null;
}

export interface QuizQuestionSet {
  questions: QuizQuestion[];
}

export interface QuizRow {
  id: number;
  title: string | null;
  lecture_title: string | null;
  description: string;
  questions: QuizQuestionSet;
  quiz_number: number | null;
}

export interface QuizWithProgress extends QuizRow {
  quiz_progress?: QuizProgressRow[];
  number?: number;
  status?: QuizStatus;
  details?: Record<string, string>;
  content?: string;
}
