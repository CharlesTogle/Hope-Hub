import type { LectureProgressItem } from './lecture';
import type { DbQuizStatus } from './quiz';
import type { PFTSessionData } from './physical-fitness';

export type { PFTSessionData };

export interface ClassCode {
  class_code: string;
  class_name: string;
  class_color: string;
}

export interface ProgressStats {
  completed: number;
  pending: number;
  incomplete: number;
  total: number;
}

export interface DashboardQuizRow {
  quiz_id: number;
  status: string;
  score?: number;
  total_items?: number;
  date_taken?: string;
}

export interface StudentPftStatus {
  preFinished: boolean;
  postFinished: boolean;
}

export interface RawStudentQuizData {
  quiz_number: number;
  status: DbQuizStatus;
  score: number | null;
  total_items: number | null;
}

export interface RawStudentData {
  uuid: string;
  full_name: string;
  email: string;
  lecture_progress: LectureProgressItem[][] | null;
  pre_physical_fitness_test: PFTSessionData[] | null;
  post_physical_fitness_test: PFTSessionData[] | null;
  quiz_data: RawStudentQuizData[] | null;
}

export interface CleanedStudentBase {
  email: string;
  studentName: string;
  uuid: string;
  preTestCompleted: boolean;
  postTestCompleted: boolean;
  prePFTRaw?: PFTSessionData;
  postPFTRaw?: PFTSessionData;
}

export type CleanedStudent = CleanedStudentBase & Record<string, string | boolean>;
