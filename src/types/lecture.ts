export type LessonStatus = 'Incomplete' | 'Pending' | 'Done';

export interface Lesson {
  key: number;
  title: string;
  introduction: string;
  pdf: string;
  videoLecture?: string;
  quizLink: string;
  videoStatus?: number;
}

export interface LectureProgressItem {
  key: number;
  title: string;
  status: LessonStatus;
}
