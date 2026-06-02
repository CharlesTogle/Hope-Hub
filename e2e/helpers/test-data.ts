import type { Session, User } from '@supabase/supabase-js';
import type { LectureProgressItem } from '../../src/types/lecture';
import type { PFTSessionData } from '../../src/types/physical-fitness';
import type {
  QuizProgressRow,
  QuizQuestion,
  QuizQuestionSet,
  QuizRow,
} from '../../src/types/quiz';
import type { Database } from '../../src/types/supabase';
import type { UserType } from '../../src/types/auth';

export interface TestUser {
  id: string;
  email: string;
  fullName: string;
  userType: UserType;
  classCode: string | null;
}

type ProfileRow = Database['public']['Tables']['profile']['Row'];
type TeacherClassRow = Database['public']['Tables']['teacher_class_code']['Row'];
type PhysicalFitnessTestRow = Database['public']['Tables']['physical_fitness_test']['Row'];
type PftSummaryRow =
  Database['public']['Functions']['get_pft_summary_for_viewer']['Returns'][number];

export const testUsers: Record<'student' | 'teacher', TestUser> = {
  student: {
    id: 'student-uuid-001',
    email: 'student@test.com',
    fullName: 'Test Student',
    userType: 'student',
    classCode: 'CLASS123',
  },
  teacher: {
    id: 'teacher-uuid-001',
    email: 'teacher@test.com',
    fullName: 'Test Teacher',
    userType: 'teacher',
    classCode: null,
  },
};

export function createMockJWT(user: TestUser): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      user_metadata: {
        fullName: user.fullName,
        userType: user.userType,
        classCode: user.classCode,
      },
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64');

  return `${header}.${payload}.mock_signature`;
}

export function createMockSession(user: TestUser): Session {
  const accessToken = createMockJWT(user);
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const authUser: User = {
    id: user.id,
    app_metadata: { provider: 'email' },
    user_metadata: {
      fullName: user.fullName,
      userType: user.userType,
      classCode: user.classCode,
    },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    email: user.email,
  };

  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    refresh_token: 'mock_refresh_token',
    user: authUser,
  };
}

export function createMockProfile(
  user: TestUser,
  overrides: Partial<ProfileRow> = {},
): ProfileRow {
  return {
    uuid: user.id,
    created_at: new Date().toISOString(),
    full_name: user.fullName,
    email: user.email,
    user_type: user.userType,
    ...overrides,
  };
}

export function createMockLectureProgress(
  overrides: Partial<{
    uuid: string;
    lecture_progress: LectureProgressItem[];
  }> = {},
): { uuid: string; lecture_progress: LectureProgressItem[] } {
  return {
    uuid: testUsers.student.id,
    lecture_progress: [
      { key: 1, title: 'Personal Safety Protocol', status: 'Done' },
      { key: 2, title: 'Physiological Indicators', status: 'Pending' },
      { key: 3, title: 'The FITT Principle', status: 'Incomplete' },
    ],
    ...overrides,
  };
}

export function createMockQuizProgress(
  overrides: Partial<QuizProgressRow> = {},
): QuizProgressRow {
  return {
    id: Date.now(),
    user_id: testUsers.student.id,
    quiz_id: 1,
    status: 'Pending',
    score: 0,
    points: 0,
    question_index: 0,
    remaining_time: 30,
    questions_answered: [],
    questions_shuffled: null,
    start_time: null,
    end_time: null,
    total_items: null,
    date_taken: null,
    ...overrides,
  };
}

function getDefaultQuizQuestions(): QuizQuestionSet {
  const questions: QuizQuestion[] = [
    {
      question: 'What is the FITT principle?',
      type: 'multiple-choice',
      answer: 'Frequency, Intensity, Time, Type',
      duration: 30,
      choices: [
        {
          text: 'Frequency, Intensity, Time, Type',
          isCorrect: true,
        },
        {
          text: 'Fast, Intense, Timed, Test',
          isCorrect: false,
        },
      ],
    },
  ];

  return { questions };
}

export function createMockQuiz(
  overrides: Partial<Omit<QuizRow, 'questions'>> & { questions?: QuizQuestion[] } = {},
): QuizRow {
  const { questions, ...restOverrides } = overrides;

  return {
    id: 1,
    title: 'Quiz 1',
    lecture_title: 'Personal Safety Protocol',
    description: 'Test your knowledge on personal safety.',
    created_at: new Date().toISOString(),
    quiz_number: 1,
    questions: questions ? { questions } : getDefaultQuizQuestions(),
    ...restOverrides,
  };
}

export function createMockClass(
  overrides: Partial<TeacherClassRow> = {},
): TeacherClassRow {
  return {
    id: 1,
    created_at: new Date().toISOString(),
    class_code: 'CLASS123',
    class_name: 'PE 1 - Section A',
    class_color: '#4F46E5',
    uuid: testUsers.teacher.id,
    ...overrides,
  };
}

export function createMockPftSession(
  overrides: Partial<PFTSessionData> = {},
): PFTSessionData {
  return {
    gender: 'Male',
    category: 'secondaryBoys',
    isPARQFinished: true,
    finishedTestIndex: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    bmiWeight: {
      title: 'BMI (Weight)',
      record: '70',
      timeStarted: '08:00',
      timeEnd: '08:05',
      classification: 'No data available',
    },
    bmiHeight: {
      title: 'BMI (Height)',
      record: '170',
      timeStarted: '08:00',
      timeEnd: '08:05',
      classification: 'No data available',
    },
    zipperTestRight: {
      title: 'Zipper Test (Right hand)',
      record: '2',
      timeStarted: '08:00',
      timeEnd: '08:05',
      classification: 'Good',
    },
    zipperTestLeft: {
      title: 'Zipper Test (Left hand)',
      record: '2',
      timeStarted: '08:00',
      timeEnd: '08:05',
      classification: 'Good',
    },
    sitAndReachFirst: {
      title: 'Sit and Reach (First Attempt)',
      record: '30',
      timeStarted: '08:00',
      timeEnd: '08:05',
      classification: 'Fair',
    },
    sitAndReachSecond: {
      title: 'Sit and Reach (Second Attempt)',
      record: '32',
      timeStarted: '08:00',
      timeEnd: '08:05',
      classification: 'Good',
    },
    preStepTest: {
      title: 'Pre 3-Minute Step Test',
      record: '80',
      timeStarted: '08:00',
      timeEnd: '08:05',
      classification: 'No data available',
    },
    stepTest: {
      title: '3-Minute Step Test',
      record: '100',
      timeStarted: '08:06',
      timeEnd: '08:09',
      classification: 'No data available',
    },
    pushUp: {
      title: 'Push-Up',
      record: '15',
      timeStarted: '08:10',
      timeEnd: '08:13',
      classification: 'Good',
    },
    basicPlank: {
      title: 'Basic Plank',
      record: '45',
      timeStarted: '08:14',
      timeEnd: '08:17',
      classification: 'Good',
    },
    ...overrides,
  };
}

export function createMockPhysicalFitnessTest(
  overrides: Partial<PhysicalFitnessTestRow> = {},
): PhysicalFitnessTestRow {
  return {
    id: 1,
    created_at: new Date().toISOString(),
    uuid: testUsers.student.id,
    pre_physical_fitness_test: null,
    post_physical_fitness_test: null,
    ...overrides,
  };
}

export function createMockPftSummary(
  overrides: Partial<PftSummaryRow> = {},
): PftSummaryRow {
  return {
    full_name: testUsers.student.fullName,
    email: testUsers.student.email,
    pft_data: createMockPftSession(),
    ...overrides,
  };
}
