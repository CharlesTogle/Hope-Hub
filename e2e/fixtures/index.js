/**
 * Combined test fixtures for Hope Hub e2e tests
 *
 * Auth strategy: Supabase reads the session from localStorage under
 * `sb-<ref>-auth-token`. Since the exact key depends on the Supabase project
 * URL (which is an env var), we override localStorage.getItem via addInitScript
 * so any `sb-*-auth-token` lookup returns our mock session. Network calls to
 * the Supabase REST and Auth APIs are intercepted via page.route().
 */

import { test as base, expect } from '@playwright/test';
import {
  testUsers,
  createMockSession,
  createMockProfile,
  createMockLectureProgress,
  createMockQuizProgress,
  createMockQuiz,
  createMockClass,
  createMockPhysicalFitnessTest,
} from '../helpers/test-data.js';

export const test = base.extend({
  // ── Auto fixtures (run for every test) ────────────────────────────────────

  /**
   * Blocks Google Fonts on every test.
   * Google Fonts keeps an HTTP/2 connection alive long after the resource
   * is delivered, preventing networkidle from ever firing.
   */
  blockExternalFonts: [async ({ page }, use) => {
    await page.route('**fonts.googleapis.com/**', (route) => route.abort());
    await page.route('**fonts.gstatic.com/**', (route) => route.abort());
    await use();
  }, { auto: true }],

  // ── User fixtures ──────────────────────────────────────────────────────────

  studentUser: testUsers.student,
  teacherUser: testUsers.teacher,

  // ── Core auth helpers ──────────────────────────────────────────────────────

  /**
   * Sets up a mock Supabase session for the given user.
   * Call before page.goto() — it injects an initScript that intercepts
   * localStorage reads for the Supabase session key.
   *
   * Profile mock detects .single() via the Accept header and returns a single
   * object instead of an array so Supabase's client doesn't throw an error.
   */
  setAuthSession: async ({ page }, use) => {
    const setSession = async (user) => {
      const session = createMockSession(user);
      const sessionJSON = JSON.stringify(session);

      // addInitScript runs before any page script on every navigation.
      // We intercept localStorage.getItem so any sb-*-auth-token lookup
      // returns our mock session, regardless of the actual Supabase project ref.
      await page.addInitScript((sessionStr) => {
        localStorage.setItem('rememberMe', 'true');
        const _orig = Storage.prototype.getItem;
        Storage.prototype.getItem = function (key) {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            return sessionStr;
          }
          return _orig.call(this, key);
        };
      }, sessionJSON);

      // Intercept Supabase auth/v1/user — called when verifying the session
      await page.route('**/auth/v1/user', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(session.user),
        });
      });

      // Intercept token refresh attempts
      await page.route('**/auth/v1/token**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(session),
        });
      });

      // Mock profile table.
      // Supabase .single() sends Accept: application/vnd.pgrst.object+json
      // and expects a plain object back, not an array.
      const profile = createMockProfile(user);
      await page.route('**/rest/v1/profile**', (route) => {
        const accept = route.request().headers()['accept'] ?? '';
        const isSingle = accept.includes('vnd.pgrst.object');
        route.fulfill({
          status: 200,
          contentType: isSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: isSingle
            ? JSON.stringify(profile)
            : JSON.stringify([profile]),
        });
      });

      // Silence Supabase storage calls (profile pictures, etc.)
      await page.route('**/storage/v1/**', (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      });
    };

    await use(setSession);
  },

  /**
   * Mocks Supabase auth as unauthenticated (returns 401).
   * Use this for tests that verify redirect-to-login behaviour on protected routes.
   * Without this, the real Supabase auth call can hang and time out.
   */
  mockUnauthenticated: async ({ page }, use) => {
    const mock = async () => {
      await page.route('**/auth/v1/**', (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'unauthorized' }),
        });
      });
    };
    await use(mock);
  },

  /**
   * Signs out by clearing all auth state.
   */
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

  // ── API mock helpers ───────────────────────────────────────────────────────

  mockLectureProgress: async ({ page }, use) => {
    const mock = async (data) => {
      const progress = data ?? createMockLectureProgress();
      await page.route('**/rest/v1/lecture_progress**', (route) => {
        const accept = route.request().headers()['accept'] ?? '';
        const isSingle = accept.includes('vnd.pgrst.object');
        route.fulfill({
          status: 200,
          contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
          body: isSingle ? JSON.stringify(progress) : JSON.stringify([progress]),
        });
      });
    };
    await use(mock);
  },

  mockQuizData: async ({ page }, use) => {
    const mock = async ({ quizzes = [], progress = [] } = {}) => {
      const defaultQuiz = createMockQuiz();
      const defaultProgress = createMockQuizProgress();

      await page.route('**/rest/v1/quiz**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(quizzes.length ? quizzes : [defaultQuiz]),
        });
      });

      await page.route('**/rest/v1/quiz_progress**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(progress.length ? progress : [defaultProgress]),
        });
      });
    };
    await use(mock);
  },

  mockTeacherClasses: async ({ page }, use) => {
    const mock = async (classes) => {
      const data = classes ?? [createMockClass()];
      await page.route('**/rest/v1/teacher_class_code**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data),
        });
      });
    };
    await use(mock);
  },

  mockPhysicalFitnessTest: async ({ page }, use) => {
    const mock = async (data) => {
      const pft = data ?? createMockPhysicalFitnessTest();
      await page.route('**/rest/v1/physical_fitness_test**', (route) => {
        const accept = route.request().headers()['accept'] ?? '';
        const isSingle = accept.includes('vnd.pgrst.object');
        route.fulfill({
          status: 200,
          contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
          body: isSingle ? JSON.stringify(pft) : JSON.stringify([pft]),
        });
      });
    };
    await use(mock);
  },

  mockStudentClassCode: async ({ page }, use) => {
    const mock = async (classCode = 'CLASS123') => {
      await page.route('**/rest/v1/student_class_code**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ uuid: testUsers.student.id, class_code: classCode }]),
        });
      });
    };
    await use(mock);
  },
});

export { expect };
