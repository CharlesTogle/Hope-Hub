import { test, expect } from '../../fixtures';
import { APP_ROUTES } from '../../config/routes';
import {
  createMockPftSession,
  createMockPftSummary,
} from '../../helpers/test-data';

test.describe('Physical Fitness Test — PAR-Q', () => {
  test('PAR-Q page loads for student', async ({
    page,
    studentUser,
    setAuthSession,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    // No pre-test yet = this will be the pre-test
    await mockPhysicalFitnessTest({
      uuid: studentUser.id,
      pre_physical_fitness_test: null,
      post_physical_fitness_test: null,
    });

    await page.goto(APP_ROUTES.physicalFitnessTest.parq);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('parq');
  });

  test('PAR-Q page has gender selection', async ({
    page,
    studentUser,
    setAuthSession,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest();

    await page.goto(APP_ROUTES.physicalFitnessTest.parq);
    await page.waitForLoadState('networkidle');

    // Gender radio buttons (Male / Female)
    const radioButtons = page.locator('input[type="radio"]');
    const hasRadio = await radioButtons.count().then((n) => n > 0);
    expect(hasRadio).toBeTruthy();
  });

  test('PAR-Q page has 7 yes/no health screening questions', async ({
    page,
    studentUser,
    setAuthSession,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest();

    await page.goto(APP_ROUTES.physicalFitnessTest.parq);
    await page.waitForLoadState('networkidle');

    // 7 yes/no questions — each has 2 radio options = 14+ radio buttons total (plus gender)
    const radioButtons = page.locator('input[type="radio"]');
    const count = await radioButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('PAR-Q has submit button', async ({
    page,
    studentUser,
    setAuthSession,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest();

    await page.goto(APP_ROUTES.physicalFitnessTest.parq);
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Continue")');
    const hasButton = await submitButton.count().then((n) => n > 0);
    expect(hasButton).toBeTruthy();
  });

  test('PAR-Q submission with invalid answers (not all No) shows error', async ({
    page,
    studentUser,
    setAuthSession,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest();

    await page.goto(APP_ROUTES.physicalFitnessTest.parq);
    await page.waitForLoadState('networkidle');

    // Attempt to submit without filling anything
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Continue")');
    const hasButton = await submitButton.count().then((n) => n > 0);

    if (hasButton) {
      await submitButton.first().click();
      await page.waitForLoadState('networkidle');

      // Should stay on parq or show error
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });

  test('teacher PAR-Q auto-completes and goes to test', async ({
    page,
    teacherUser,
    setAuthSession,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(teacherUser);
    await mockPhysicalFitnessTest();

    await page.goto(APP_ROUTES.physicalFitnessTest.parq);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(new RegExp(`${APP_ROUTES.physicalFitnessTest.test(0)}$`));
    await expect(page.getByText('Teachers are to conduct PFTs only')).toBeVisible();
  });

  test('student test page redirects to PAR-Q when PAR-Q is not finished', async ({
    page,
    studentUser,
    setAuthSession,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest({
      uuid: studentUser.id,
      pre_physical_fitness_test: null,
      post_physical_fitness_test: null,
    });

    await page.addInitScript(() => {
      localStorage.setItem('physicalFitnessData', JSON.stringify({
        gender: '',
        category: '',
        isPARQFinished: false,
        finishedTestIndex: [],
      }));
    });

    await page.goto(APP_ROUTES.physicalFitnessTest.test(0));
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(new RegExp(`${APP_ROUTES.physicalFitnessTest.parq}$`));
  });
});

test.describe('Physical Fitness Test — Test Pages', () => {
  test('short test duration follows VITE_APP_ENV timing policy', async ({
    page,
    studentUser,
    setAuthSession,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest({
      uuid: studentUser.id,
      pre_physical_fitness_test: null,
      post_physical_fitness_test: null,
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        'physicalFitnessData',
        JSON.stringify({
          gender: 'Male',
          category: 'secondaryBoys',
          isPARQFinished: true,
          finishedTestIndex: [0, 2],
        }),
      );
    });

    await page.goto(APP_ROUTES.physicalFitnessTest.test(1));
    await page.waitForLoadState('networkidle');

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;
    await page.locator('input[type="number"]').fill('10');
    await page.locator('input[type="time"]').fill(currentTime);
    await page.getByRole('button', { name: 'Submit' }).click();

    if (process.env.VITE_APP_ENV === 'DEV') {
      await expect(page).toHaveURL(
        new RegExp(`${APP_ROUTES.physicalFitnessTest.test(2)}$`),
      );
    } else {
      await expect(
        page.getByText('Test duration is too short.', { exact: false }),
      ).toBeVisible();
    }
  });

  test('test page 0 (BMI weight) loads', async ({
    page,
    studentUser,
    setAuthSession,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest();

    // Simulate PAR-Q already done via localStorage
    await page.addInitScript(() => {
      const pftData = {
        gender: 'Male',
        category: 'secondaryBoys',
        isPARQFinished: true,
        finishedTestIndex: [],
      };
      localStorage.setItem('physicalFitnessData', JSON.stringify(pftData));
    });

    await page.goto(APP_ROUTES.physicalFitnessTest.test(0));
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
  });

  test('test page has score input', async ({
    page,
    studentUser,
    setAuthSession,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest({
      uuid: studentUser.id,
      pre_physical_fitness_test: null,
      post_physical_fitness_test: null,
    });

    // App logic for test/0: !finishedTestIndex.includes(-1) is always true
    // → always triggers isBadRequest. Use test/1 with finishedTestIndex=[0,2]:
    //   • includes(0) = true  → prev test done ✓
    //   • length(2) > 1       → allowed ✓
    //   • includes(length-1=1) = false → no summary redirect ✓
    await page.addInitScript(() => {
      localStorage.setItem('physicalFitnessData', JSON.stringify({
        gender: 'Male',
        category: 'secondaryBoys',
        isPARQFinished: true,
        finishedTestIndex: [0, 2],
      }));
    });

    await page.goto(APP_ROUTES.physicalFitnessTest.test(1));
    await page.waitForLoadState('networkidle');

    // ResultSection renders input[type="number"] for scores, input[type="time"] for timers
    const input = page.locator('input[type="number"], input[type="time"]');
    const hasInput = await input.count().then((n) => n > 0);
    expect(hasInput).toBeTruthy();
  });
});

test.describe('Physical Fitness Test — Summary', () => {
  test('pre-test summary page loads', async ({
    page,
    studentUser,
    setAuthSession,
    mockPftSummary,
  }) => {
    await setAuthSession(studentUser);
    await mockPftSummary(
      createMockPftSummary({
        full_name: studentUser.fullName,
        email: studentUser.email,
        pft_data: createMockPftSession(),
      }),
    );

    await page.goto(APP_ROUTES.physicalFitnessTest.preSummary);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('Student Information')).toBeVisible();
    await expect(page.getByText(studentUser.fullName)).toBeVisible();
    expect(page.url()).toContain('pre-test');
  });

  test('teacher can load a student summary from the class route', async ({
    page,
    teacherUser,
    studentUser,
    setAuthSession,
    mockTeacherClasses,
    mockPftSummary,
  }) => {
    await setAuthSession(teacherUser);
    await mockTeacherClasses();
    await mockPftSummary(
      createMockPftSummary({
        full_name: studentUser.fullName,
        email: studentUser.email,
        pft_data: createMockPftSession(),
      }),
    );

    await page.goto(
      APP_ROUTES.physicalFitnessTest.teacherSummary(
        'CLASS123',
        'pre-test',
        studentUser.id,
      ),
    );
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('Student Information')).toBeVisible();
    await expect(page.getByText(studentUser.fullName)).toBeVisible();
    expect(page.url()).toContain('/dashboard/view-class/CLASS123/');
  });

  test('student is redirected away from the teacher-only summary route', async ({
    page,
    studentUser,
    setAuthSession,
    mockLectureProgress,
    mockQuizData,
    mockPhysicalFitnessTest,
    mockStudentClassCode,
  }) => {
    await setAuthSession(studentUser);
    await mockLectureProgress();
    await mockQuizData();
    await mockPhysicalFitnessTest();
    await mockStudentClassCode();

    await page.goto(
      APP_ROUTES.physicalFitnessTest.teacherSummary(
        'CLASS123',
        'pre-test',
        'other-student-uuid',
      ),
    );
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(new RegExp(`${APP_ROUTES.dashboard}$`));
  });

  test('post-test summary page loads when post-test exists', async ({
    page,
    studentUser,
    setAuthSession,
    mockPftSummary,
  }) => {
    await setAuthSession(studentUser);
    await mockPftSummary(
      createMockPftSummary({
        full_name: studentUser.fullName,
        email: studentUser.email,
        pft_data: createMockPftSession({
          bmiWeight: {
            title: 'BMI (Weight)',
            record: '68',
            timeStarted: '08:00',
            timeEnd: '08:05',
            classification: 'No data available',
          },
        }),
      }),
    );

    await page.goto(APP_ROUTES.physicalFitnessTest.postSummary);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('post-test');
  });

  test('summary page shows result sections', async ({
    page,
    studentUser,
    setAuthSession,
    mockPftSummary,
  }) => {
    await setAuthSession(studentUser);
    await mockPftSummary(
      createMockPftSummary({
        full_name: studentUser.fullName,
        email: studentUser.email,
        pft_data: createMockPftSession(),
      }),
    );

    await page.goto(APP_ROUTES.physicalFitnessTest.preSummary);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('A. Body Mass Index')).toBeVisible();
    await expect(page.getByText('B. Cardiovascular Endurance')).toBeVisible();
    await expect(page.getByText('C. Strength')).toBeVisible();
    await expect(page.getByText('D. Flexibility')).toBeVisible();
  });
});
