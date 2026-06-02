import type { LectureProgressItem } from './lecture';
import type { QuizQuestion, AnsweredQuestion, DbQuizStatus, QuizQuestionSet } from './quiz';
import type { PFTSessionData } from './physical-fitness';
import type { RawStudentData } from './student';
import type { UserType } from './auth';

export interface Database {
  public: {
    Tables: {
      profile: {
        Row: {
          uuid: string;
          created_at: string;
          full_name: string | null;
          email: string | null;
          user_type: UserType | null;
        };
        Insert: {
          uuid?: string;
          created_at?: string;
          full_name?: string | null;
          email?: string | null;
          user_type?: UserType | null;
        };
        Update: Partial<Database['public']['Tables']['profile']['Row']>;
      };
      quiz: {
        Row: {
          id: number;
          title: string;
          description: string;
          questions: QuizQuestionSet;
          created_at: string;
          quiz_number: number | null;
          lecture_title: string | null;
        };
        Insert: Omit<Database['public']['Tables']['quiz']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['quiz']['Row']>;
      };
      quiz_progress: {
        Row: {
          id: number;
          user_id: string;
          quiz_id: number;
          question_index: number | null;
          score: number | null;
          points: number | null;
          status: DbQuizStatus;
          questions_answered: AnsweredQuestion[] | null;
          questions_shuffled: QuizQuestion[] | null;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
          remaining_time: number | null;
          total_items: number | null;
          date_taken: string | null;
        };
        Insert: Omit<Database['public']['Tables']['quiz_progress']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['quiz_progress']['Row']>;
      };
      lecture_progress: {
        Row: { uuid: string; created_at: string; lecture_progress: LectureProgressItem[] | null };
        Insert: { uuid?: string; created_at?: string; lecture_progress?: LectureProgressItem[] | null };
        Update: Partial<Database['public']['Tables']['lecture_progress']['Row']>;
      };
      physical_fitness_test: {
        Row: {
          id: number;
          created_at: string;
          uuid: string;
          pre_physical_fitness_test: PFTSessionData | null;
          post_physical_fitness_test: PFTSessionData | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          uuid?: string;
          pre_physical_fitness_test?: PFTSessionData | null;
          post_physical_fitness_test?: PFTSessionData | null;
        };
        Update: Partial<Database['public']['Tables']['physical_fitness_test']['Row']>;
      };
      teacher_class_code: {
        Row: {
          id: number;
          created_at: string;
          uuid: string | null;
          class_code: string | null;
          class_name: string | null;
          class_color: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          uuid?: string | null;
          class_code?: string | null;
          class_name?: string | null;
          class_color?: string | null;
        };
        Update: Partial<Database['public']['Tables']['teacher_class_code']['Row']>;
      };
      student_class_code: {
        Row: { id: number; class_code: string | null; uuid: string | null };
        Insert: { id?: number; uuid?: string | null; class_code?: string | null };
        Update: Partial<Database['public']['Tables']['student_class_code']['Row']>;
      };
    };
    Functions: {
      class_code_exists: {
        Args: { p_class_code: string };
        Returns: boolean;
      };
      get_pft_summary_for_viewer: {
        Args: {
          p_student_uuid: string;
          p_test_type: string;
        };
        Returns: {
          full_name: string | null;
          email: string | null;
          pft_data: PFTSessionData | null;
        }[];
      };
      retrieve_students_by_class: {
        Args: { class_code_input: string };
        Returns: RawStudentData[];
      };
      register_user: {
        Args: {
          p_user_id: string;
          p_full_name: string;
          p_email: string;
          p_user_type: string;
          p_class_code: string | null;
          p_lecture_progress: LectureProgressItem[];
        };
        Returns: void;
      };
    };
  };
}
