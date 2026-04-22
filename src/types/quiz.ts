export type QuizStatus = 'Pending' | 'Done' | 'Incomplete' | 'Locked';

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
  status: 'Pending' | 'Done';
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
  question_index: number;
  score: number;
  points: number;
  status: 'Pending' | 'Done';
  remaining_time: number;
  questions_answered: AnsweredQuestion[];
  questions_shuffled: QuizQuestion[] | null;
  start_time: string | null;
  end_time: string | null;
  total_items: number | null;
  date_taken: string | null;
}

export interface QuizRow {
  id: number;
  title: string;
  lecture_title: string;
  description: string;
  questions: { questions: QuizQuestion[] };
  quiz_number: number;
}

export interface QuizWithProgress extends QuizRow {
  quiz_progress?: QuizProgressRow[];
  number?: number;
  status?: QuizStatus;
  details?: Record<string, string>;
  content?: string;
}
