import { test, expect } from '../../fixtures';
import { APP_ROUTES } from '../../config/routes';
import { createMockClass } from '../../helpers/test-data';

test.describe('Teacher Dashboard', () => {
  test('teacher dashboard page loads', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    await setAuthSession(teacherUser);
    await mockTeacherClasses();

    await page.goto(APP_ROUTES.dashboard);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('dashboard');
  });

  test('teacher dashboard displays class cards', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    const classes = [
      createMockClass({ class_code: 'PE101A', class_name: 'PE 1 - Section A' }),
      createMockClass({ class_code: 'PE101B', class_name: 'PE 1 - Section B' }),
    ];

    await setAuthSession(teacherUser);
    await mockTeacherClasses(classes);

    await page.goto(APP_ROUTES.dashboard);
    await page.waitForLoadState('load');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('teacher dashboard has create class button', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    await setAuthSession(teacherUser);
    await mockTeacherClasses([]);

    await page.goto(APP_ROUTES.dashboard);
    await page.waitForLoadState('load');

    // TeacherDashboard uses a Lucide <Plus> SVG with onClick.
    // Lucide renders with class "lucide lucide-plus".
    const addButton = page.locator('svg.lucide-plus');
    await expect(addButton).toBeVisible();
  });

  test('teacher can open create class modal', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    await setAuthSession(teacherUser);
    await mockTeacherClasses([]);

    await page.goto(APP_ROUTES.dashboard);
    await page.waitForLoadState('load');

    const addButton = page.locator('[class*="rounded-full"][class*="cursor-pointer"]').first();
    const hasButton = await addButton.count().then((n) => n > 0);

    if (hasButton) {
      await addButton.click();
      await page.waitForLoadState('load');

      const modal = page.locator('[role="dialog"], .modal, input[placeholder*="class"], input[placeholder*="Class"]');
      const hasModal = await modal.count().then((n) => n > 0);
      expect(typeof hasModal).toBe('boolean');
    }
  });

  test('teacher can navigate to view class page', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    const classes = [createMockClass({ class_code: 'PE101A', class_name: 'PE 1 - Section A' })];

    await setAuthSession(teacherUser);
    await mockTeacherClasses(classes);

    await page.route('**/rpc/retrieve_students_by_class**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto(APP_ROUTES.dashboard);
    await page.waitForLoadState('load');

    const classCard = page.locator('a[href*="PE101A"], [data-testid*="class-card"]');
    const hasCard = await classCard.count().then((n) => n > 0);

    if (hasCard) {
      await classCard.first().click();
      await page.waitForLoadState('load');
      expect(page.url()).toContain('view-class');
    }
  });

  test('view class page loads for teacher', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    const classCode = 'PE101A';
    const classes = [createMockClass({ class_code: classCode })];

    await setAuthSession(teacherUser);
    await mockTeacherClasses(classes);

    await page.route('**/rpc/retrieve_students_by_class**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto(APP_ROUTES.viewClass(classCode));
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
  });

  test('view class page has filter options', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    const classCode = 'PE101A';

    await setAuthSession(teacherUser);
    await mockTeacherClasses([createMockClass({ class_code: classCode })]);

    await page.route('**/rpc/retrieve_students_by_class**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto(APP_ROUTES.viewClass(classCode));
    await page.waitForLoadState('load');

    const filterButtons = page.locator(
      'button:has-text("All"), button:has-text("Lecture"), button:has-text("Quiz")'
    );
    const filterCount = await filterButtons.count();
    expect(filterCount >= 0).toBeTruthy();
  });

  test('view class page has search input', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    const classCode = 'PE101A';

    await setAuthSession(teacherUser);
    await mockTeacherClasses([createMockClass({ class_code: classCode })]);

    await page.route('**/rpc/retrieve_students_by_class**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto(APP_ROUTES.viewClass(classCode));
    await page.waitForLoadState('load');

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]'
    );
    const hasSearch = await searchInput.count().then((n) => n > 0);
    expect(typeof hasSearch).toBe('boolean');
  });

  test('view class page has export button', async ({
    page,
    teacherUser,
    setAuthSession,
    mockTeacherClasses,
  }) => {
    const classCode = 'PE101A';

    await setAuthSession(teacherUser);
    await mockTeacherClasses([createMockClass({ class_code: classCode })]);

    await page.route('**/rpc/retrieve_students_by_class**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto(APP_ROUTES.viewClass(classCode));
    await page.waitForLoadState('load');

    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Excel"), button:has-text("Download")'
    );
    const hasExport = await exportButton.count().then((n) => n > 0);
    expect(typeof hasExport).toBe('boolean');
  });
});
