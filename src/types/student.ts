import type { LectureProgressItem } from './lecture';
import type { DbQuizStatus } from './quiz';
import type { PFTSessionData } from './physical-fitness';

export interface ClassCode {
  class_code: string;
  class_name: string;
  class_color: string;
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
}

export type CleanedStudent = CleanedStudentBase & Record<string, string | boolean>;
