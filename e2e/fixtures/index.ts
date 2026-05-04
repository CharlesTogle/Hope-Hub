import { expect, test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  createMockClass,
  createMockLectureProgress,
  createMockPhysicalFitnessTest,
  createMockProfile,
  createMockQuiz,
  createMockQuizProgress,
  createMockSession,
  testUsers,
} from '../helpers/test-data';
import type { TestUser } from '../helpers/test-data';
import type { Database } from '../../src/types/supabase';
import type { QuizProgressRow, QuizRow } from '../../src/types/quiz';

type LectureProgressResponse = ReturnType<typeof createMockLectureProgress>;
type TeacherClassRow = Database['public']['Tables']['teacher_class_code']['Row'];
type PhysicalFitnessTestRow = Database['public']['Tables']['physical_fitness_test']['Row'];

interface MockQuizDataInput {
  quizzes?: QuizRow[];
  progress?: QuizProgressRow[];
}

interface CustomFixtures {
  blockExternalFonts: void;
  studentUser: TestUser;
  teacherUser: TestUser;
  setAuthSession: (user: TestUser) => Promise<void>;
  mockUnauthenticated: () => Promise<void>;
  logout: () => Promise<void>;
  mockLectureProgress: (data?: LectureProgressResponse) => Promise<void>;
  mockQuizData: (input?: MockQuizDataInput) => Promise<void>;
  mockTeacherClasses: (classes?: TeacherClassRow[]) => Promise<void>;
  mockPhysicalFitnessTest: (data?: PhysicalFitnessTestRow) => Promise<void>;
  mockStudentClassCode: (classCode?: string | null) => Promise<void>;
}

async function fulfillStorage(page: Page): Promise<void> {
  await page.route('**/storage/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
}

export const test = base.extend<CustomFixtures>({
  blockExternalFonts: [
    async ({ page }, use) => {
      await page.route('**fonts.googleapis.com/**', async (route) => {
        await route.abort();
      });
      await page.route('**fonts.gstatic.com/**', async (route) => {
        await route.abort();
      });
      await use();
    },
    { auto: true },
  ],
  studentUser: testUsers.student,
  teacherUser: testUsers.teacher,
  setAuthSession: async ({ page }, use) => {
    const setSession = async (user: TestUser) => {
      const session = createMockSession(user);
      const sessionJson = JSON.stringify(session);

      await page.addInitScript((sessionString: string) => {
        localStorage.setItem('rememberMe', 'true');
        const originalGetItem = Storage.prototype.getItem;

        Storage.prototype.getItem = function getItemOverride(key: string) {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            return sessionString;
          }

          return originalGetItem.call(this, key);
        };
      }, sessionJson);

      await page.route('**/auth/v1/user', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(session.user),
        });
      });

      await page.route('**/auth/v1/token**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(session),
        });
      });

      const profile = createMockProfile(user);
      await page.route('**/rest/v1/profile**', async (route) => {
        const accept = route.request().headers().accept ?? '';
        const isSingle = accept.includes('vnd.pgrst.object');

        await route.fulfill({
          status: 200,
          contentType: isSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: isSingle
            ? JSON.stringify(profile)
            : JSON.stringify([profile]),
        });
      });

      await fulfillStorage(page);
    };

    await use(setSession);
  },
  mockUnauthenticated: async ({ page }, use) => {
    const mock = async () => {
      await page.route('**/auth/v1/**', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'unauthorized' }),
        });
      });
    };

    await use(mock);
  },
  logout: async ({ page }, use) => {
    const doLogout = async () => {
      await page.context().clearCookies();
      await page.goto('http://localhost:5173', { waitUntil: 'commit' });
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    };

    await use(doLogout);
  },
  mockLectureProgress: async ({ page }, use) => {
    const mock = async (data?: LectureProgressResponse) => {
      const progress = data ?? createMockLectureProgress();

      await page.route('**/rest/v1/lecture_progress**', async (route) => {
        const accept = route.request().headers().accept ?? '';
        const isSingle = accept.includes('vnd.pgrst.object');

        await route.fulfill({
          status: 200,
          contentType: isSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: isSingle
            ? JSON.stringify(progress)
            : JSON.stringify([progress]),
        });
      });
    };

    await use(mock);
  },
  mockQuizData: async ({ page }, use) => {
    const mock = async (input: MockQuizDataInput = {}) => {
      const quizzes = input.quizzes ?? [createMockQuiz()];
      const progress = input.progress ?? [createMockQuizProgress()];

      await page.route('**/rest/v1/quiz**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(quizzes),
        });
      });

      await page.route('**/rest/v1/quiz_progress**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(progress),
        });
      });
    };

    await use(mock);
  },
  mockTeacherClasses: async ({ page }, use) => {
    const mock = async (classes?: TeacherClassRow[]) => {
      const data = classes ?? [createMockClass()];

      await page.route('**/rest/v1/teacher_class_code**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data),
        });
      });
    };

    await use(mock);
  },
  mockPhysicalFitnessTest: async ({ page }, use) => {
    const mock = async (data?: PhysicalFitnessTestRow) => {
      const pft = data ?? createMockPhysicalFitnessTest();

      await page.route('**/rest/v1/physical_fitness_test**', async (route) => {
        const accept = route.request().headers().accept ?? '';
        const isSingle = accept.includes('vnd.pgrst.object');

        await route.fulfill({
          status: 200,
          contentType: isSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: isSingle ? JSON.stringify(pft) : JSON.stringify([pft]),
        });
      });
    };

    await use(mock);
  },
  mockStudentClassCode: async ({ page }, use) => {
    const mock = async (classCode: string | null = 'CLASS123') => {
      await page.route('**/rest/v1/student_class_code**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            classCode
              ? [{ uuid: testUsers.student.id, class_code: classCode }]
              : [],
          ),
        });
      });
    };

    await use(mock);
  },
});

export { expect };
