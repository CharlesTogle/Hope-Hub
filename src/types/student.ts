import type { LectureProgressItem } from './lecture';

export interface ClassCode {
  class_code: string;
  class_name: string;
  class_color: string;
}

export interface RawStudentData {
  uuid: string;
  full_name: string;
  email: string;
  lecture_progress: [LectureProgressItem[]];
  pre_physical_fitness_test: [{ finishedTestIndex: number[] }] | null;
  post_physical_fitness_test: [{ finishedTestIndex: number[] }] | null;
  quiz_data: Array<{
    quiz_number: number;
    status: string;
    score: number;
    total_items: number;
  }> | null;
}

export interface CleanedStudent {
  email: string;
  studentName: string;
  uuid: string;
  preTestCompleted: boolean;
  postTestCompleted: boolean;
  [key: string]: string | boolean | number;
}
