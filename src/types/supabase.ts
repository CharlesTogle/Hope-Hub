import type { LectureProgressItem } from './lecture';
import type { QuizQuestion, AnsweredQuestion } from './quiz';
import type { PFTSessionData } from './physical-fitness';
import type { RawStudentData } from './student';

export interface Database {
  public: {
    Tables: {
      profile: {
        Row: { uuid: string; user_type: 'student' | 'teacher'; full_name: string; email: string };
        Insert: { uuid: string; user_type: 'student' | 'teacher'; full_name: string; email: string };
        Update: Partial<Database['public']['Tables']['profile']['Row']>;
      };
      quiz: {
        Row: {
          id: number;
          title: string;
          lecture_title: string;
          description: string;
          questions: { questions: QuizQuestion[] };
          quiz_number: number;
        };
        Insert: Omit<Database['public']['Tables']['quiz']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['quiz']['Row']>;
      };
      quiz_progress: {
        Row: {
          id: number;
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
        };
        Insert: Omit<Database['public']['Tables']['quiz_progress']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['quiz_progress']['Row']>;
      };
      lecture_progress: {
        Row: { uuid: string; lecture_progress: LectureProgressItem[] };
        Insert: { uuid: string; lecture_progress: LectureProgressItem[] };
        Update: Partial<Database['public']['Tables']['lecture_progress']['Row']>;
      };
      physical_fitness_test: {
        Row: {
          uuid: string;
          pre_physical_fitness_test: PFTSessionData | null;
          post_physical_fitness_test: PFTSessionData | null;
        };
        Insert: { uuid: string; pre_physical_fitness_test?: PFTSessionData | null; post_physical_fitness_test?: PFTSessionData | null };
        Update: Partial<Database['public']['Tables']['physical_fitness_test']['Row']>;
      };
      teacher_class_code: {
        Row: { uuid: string; class_code: string; class_name: string; class_color: string };
        Insert: { uuid: string; class_code: string; class_name: string; class_color: string };
        Update: Partial<Database['public']['Tables']['teacher_class_code']['Row']>;
      };
      student_class_code: {
        Row: { uuid: string; class_code: string | null };
        Insert: { uuid: string; class_code?: string | null };
        Update: Partial<Database['public']['Tables']['student_class_code']['Row']>;
      };
    };
    Functions: {
      retrieve_students_by_class: {
        Args: { class_code_input: string };
        Returns: RawStudentData[];
      };
      register_user: {
        Args: {
          p_user_id: string;
          p_full_name: string;
          p_email: string;
          p_user_type: 'student' | 'teacher';
          p_class_code: string | null;
          p_lecture_progress: LectureProgressItem[];
        };
        Returns: undefined;
      };
    };
  };
}
