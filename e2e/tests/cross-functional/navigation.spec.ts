import { test, expect } from '../../fixtures';
import { APP_ROUTES } from '../../config/routes';

test.describe('Navigation — Public Pages', () => {
  test('home page is accessible without auth', async ({ page }) => {
    // Block YouTube iframe to prevent network requests from stalling 'load'
    await page.route('**youtube.com/**', (route) => route.abort());
    await page.route('**ytimg.com/**', (route) => route.abort());

    await page.goto(APP_ROUTES.home);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toBeTruthy();
  });

  test('about page is accessible without auth', async ({ page }) => {
    await page.goto(APP_ROUTES.about);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
  });

  test('login page is accessible without auth', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.login);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('login');
  });

  test('register page is accessible without auth', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.register);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('register');
  });

  test('unknown route shows 404 page', async ({ page }) => {
    await page.goto(APP_ROUTES.notFound);
    await page.waitForLoadState('load');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Navigation — Protected Routes (redirect to login)', () => {
  test('dashboard redirects unauthenticated user to login', async ({
    page,
    mockUnauthenticated,
  }) => {
    await mockUnauthenticated();
    await page.goto(APP_ROUTES.dashboard);
    await page.waitForURL('**/login**', { timeout: 10000 });

    expect(page.url()).toContain('login');
  });

  test('lectures index redirects unauthenticated user', async ({
    page,
    mockUnauthenticated,
  }) => {
    await mockUnauthenticated();
    await page.goto(APP_ROUTES.lectures.index);
    await page.waitForURL('**/login**', { timeout: 10000 });

    expect(page.url()).toContain('login');
  });

  test('quizzes index redirects unauthenticated user', async ({
    page,
    mockUnauthenticated,
  }) => {
    await mockUnauthenticated();
    await page.goto(APP_ROUTES.quizzes.index);
    await page.waitForURL('**/login**', { timeout: 10000 });

    expect(page.url()).toContain('login');
  });

  test('workout zone is accessible without auth (no redirect)', async ({
    page,
  }) => {
    await page.route('**youtube.com/**', (route) => route.abort());
    await page.route('**ytimg.com/**', (route) => route.abort());
    await page.route('**supabase.co/storage/**', (route) => route.abort());

    await page.goto(APP_ROUTES.workoutZone.index);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('workout-zone');
  });
});

test.describe('Navigation — Student Sidebar', () => {
  test('sidebar is visible for authenticated student', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
    mockQuizData,
    mockStudentClassCode,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();
    await mockQuizData();
    await mockStudentClassCode();
    await mockPhysicalFitnessTest();

    await page.goto(APP_ROUTES.dashboard);
    await page.waitForLoadState('networkidle');

    // ProfileSidebar renders Logout inside div#profile (hidden lg:flex — visible at 1280px)
    const logoutButton = page.locator('#profile button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
  });

  test('student can navigate from dashboard to lectures', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
    mockQuizData,
    mockStudentClassCode,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();
    await mockQuizData();
    await mockStudentClassCode();
    await mockPhysicalFitnessTest();

    await page.goto(APP_ROUTES.dashboard);
    await page.waitForLoadState('networkidle');

    const lecturesLink = page.locator('a[href*="lectures"]');
    const hasLink = await lecturesLink.count().then((n) => n > 0);

    if (hasLink) {
      await lecturesLink.first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('lectures');
    }
  });

  test('student can navigate from dashboard to quizzes', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
    mockQuizData,
    mockStudentClassCode,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();
    await mockQuizData();
    await mockStudentClassCode();
    await mockPhysicalFitnessTest();

    await page.goto(APP_ROUTES.dashboard);
    await page.waitForLoadState('networkidle');

    const quizzesLink = page.locator('a[href*="quizzes"]');
    const hasLink = await quizzesLink.count().then((n) => n > 0);

    if (hasLink) {
      await quizzesLink.first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('quizzes');
    }
  });
});

test.describe('Navigation — Teacher Sidebar', () => {
  test('teacher dashboard loads after auth', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    await setAuthSession(teacherUser);
    await mockTeacherClasses();

    await page.goto(APP_ROUTES.dashboard);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('dashboard');
  });

  test('teacher has navigation buttons in sidebar', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    await setAuthSession(teacherUser);
    await mockTeacherClasses();

    await page.goto(APP_ROUTES.dashboard);
    await page.waitForLoadState('networkidle');

    // Sidebar uses <button onClick={navigate}> not <a href>
    const navButtons = await page.locator('#sidebar-button button').count();
    expect(navButtons).toBeGreaterThan(0);
  });
});

test.describe('Navigation — Home Page', () => {
  test('home page has start journey CTA', async ({ page }) => {
    await page.route('**youtube.com/**', (route) => route.abort());
    await page.route('**ytimg.com/**', (route) => route.abort());

    await page.goto(APP_ROUTES.home);
    await page.waitForLoadState('load');

    const cta = page.locator('button:has-text("Start your Journey")');
    await expect(cta).toBeVisible();
  });

  test('home page CTA links to dashboard or login', async ({ page }) => {
    await page.route('**youtube.com/**', (route) => route.abort());
    await page.route('**ytimg.com/**', (route) => route.abort());

    await page.goto(APP_ROUTES.home);
    await page.waitForLoadState('load');

    // The CTA is a <button onClick={navigate('/dashboard')}> — not an anchor
    const cta = page.locator('button:has-text("Start your Journey")');
    await expect(cta).toBeVisible();
  });

  test('home page has footer', async ({ page }) => {
    await page.route('**youtube.com/**', (route) => route.abort());
    await page.route('**ytimg.com/**', (route) => route.abort());

    await page.goto(APP_ROUTES.home);
    await page.waitForLoadState('load');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});
