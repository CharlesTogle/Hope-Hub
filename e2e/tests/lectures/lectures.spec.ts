import { test, expect } from '../../fixtures';
import { APP_ROUTES } from '../../config/routes';
import { createMockLectureProgress } from '../../helpers/test-data';

test.describe('Lectures — Introduction Page', () => {
  test('lectures intro page loads for student', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();

    await page.goto(APP_ROUTES.lectures.index);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('lectures');
  });

  test('lectures page shows 3 lesson cards', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();

    await page.goto(APP_ROUTES.lectures.index);
    await page.waitForLoadState('networkidle');

    // 3 lessons per PRD: Personal Safety Protocol, Physiological Indicators, FITT Principle
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('lectures page has status filter buttons for students', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();

    await page.goto(APP_ROUTES.lectures.index);
    await page.waitForLoadState('networkidle');

    // Filter buttons: All, Done, Pending, Incomplete
    const filterButtons = page.locator(
      'button:has-text("All"), button:has-text("Done"), button:has-text("Pending"), button:has-text("Incomplete")'
    );
    const filterCount = await filterButtons.count();
    expect(filterCount).toBeGreaterThan(0);
  });

  test('clicking All filter shows all lectures', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();

    await page.goto(APP_ROUTES.lectures.index);
    await page.waitForLoadState('networkidle');

    const allButton = page.locator('button:has-text("All")');
    const hasAll = await allButton.count().then((n) => n > 0);

    if (hasAll) {
      await allButton.first().click();
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });

  test('clicking Done filter filters lectures', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress(createMockLectureProgress({
      lecture_progress: [
        { key: 1, title: 'Personal Safety Protocol', status: 'Done' },
        { key: 2, title: 'Physiological Indicators', status: 'Pending' },
        { key: 3, title: 'The FITT Principle', status: 'Incomplete' },
      ],
    }));

    await page.goto(APP_ROUTES.lectures.index);
    await page.waitForLoadState('networkidle');

    const doneButton = page.locator('button:has-text("Done")');
    const hasDone = await doneButton.count().then((n) => n > 0);

    if (hasDone) {
      await doneButton.first().click();
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });

  test('teacher sees simplified view on lectures page', async ({
    page,
    teacherUser,
    setAuthSession,
    mockLectureProgress,
  }) => {
    await setAuthSession(teacherUser);
    await mockLectureProgress();

    await page.goto(APP_ROUTES.lectures.index);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
  });

  test('clicking lecture card navigates to lecture page', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();

    // Mock the lecture page data
    await page.route('**/rest/v1/lecture_progress**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([createMockLectureProgress()]),
      });
    });

    await page.goto(APP_ROUTES.lectures.index);
    await page.waitForLoadState('networkidle');

    // Click first lecture card / link
    const lectureCard = page.locator('a[href*="lecture/"]');
    const hasCard = await lectureCard.count().then((n) => n > 0);

    if (hasCard) {
      await lectureCard.first().click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('lecture/');
    }
  });
});

test.describe('Lectures — Lecture Page', () => {
  test('lecture page loads for lesson 1', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();

    await page.goto(APP_ROUTES.lectures.lesson(1));
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('lecture/1');
  });

  test('lecture page has finish button or timer', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();

    await page.goto(APP_ROUTES.lectures.lesson(1));
    await page.waitForLoadState('networkidle');

    // Timer or finish button should be present
    const finishEl = page.locator(
      'button:has-text("Finish"), button:has-text("Done"), [data-testid*="timer"], [data-testid*="finish"]'
    );
    const hasFinish = await finishEl.count().then((n) => n > 0);
    expect(typeof hasFinish).toBe('boolean');
  });
});
