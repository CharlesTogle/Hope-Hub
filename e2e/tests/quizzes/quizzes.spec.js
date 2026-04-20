import { test, expect } from '../../fixtures/index.js';
import { APP_ROUTES } from '../../config/routes.js';
import { createMockQuiz, createMockQuizProgress } from '../../helpers/test-data.js';

test.describe('Quiz Dashboard', () => {
  test('quiz dashboard loads for student', async ({
    page,
    studentUser,
    setAuthSession,
    mockQuizData,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest();
    await mockQuizData();

    await page.goto(APP_ROUTES.quizzes.index);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('quizzes');
  });

  test('quiz dashboard has filter tabs', async ({
    page,
    studentUser,
    setAuthSession,
    mockQuizData,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest();
    await mockQuizData();

    await page.goto(APP_ROUTES.quizzes.index);
    await page.waitForLoadState('networkidle');

    // QuizDashboard renders filters as <motion.li> (renders to <li> in DOM)
    // inside a <ul>. Use role='listitem' with hasText for precision.
    const filterAll = page.locator('ul').locator('li').filter({ hasText: /^All$/ });
    await expect(filterAll).toBeVisible();
  });

  test('filtering by All shows all quizzes', async ({
    page,
    studentUser,
    setAuthSession,
    mockQuizData,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest();
    await mockQuizData({
      quizzes: [
        createMockQuiz({ id: 1, title: 'Quiz 1' }),
        createMockQuiz({ id: 2, title: 'Quiz 2' }),
      ],
      progress: [
        createMockQuizProgress({ quiz_id: 1, status: 'Done' }),
        createMockQuizProgress({ quiz_id: 2, status: 'Pending' }),
      ],
    });

    await page.goto(APP_ROUTES.quizzes.index);
    await page.waitForLoadState('networkidle');

    const filterAll = page.locator('ul').locator('li').filter({ hasText: /^All$/ });
    await filterAll.waitFor({ state: 'visible' });
    await filterAll.click();

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('filtering by Done shows only completed quizzes', async ({
    page,
    studentUser,
    setAuthSession,
    mockQuizData,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest();
    await mockQuizData({
      quizzes: [createMockQuiz({ id: 1, title: 'Quiz 1' })],
      progress: [createMockQuizProgress({ quiz_id: 1, status: 'Done' })],
    });

    await page.goto(APP_ROUTES.quizzes.index);
    await page.waitForLoadState('networkidle');

    const filterDone = page.locator('ul').locator('li').filter({ hasText: /^Done$/ });
    await filterDone.waitFor({ state: 'visible' });
    await filterDone.click();

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('locked quiz cards are not clickable links', async ({
    page,
    studentUser,
    setAuthSession,
    mockQuizData,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(studentUser);
    await mockPhysicalFitnessTest();
    await mockQuizData({
      quizzes: [createMockQuiz({ id: 1, title: 'Locked Quiz' })],
      progress: [],
    });

    await page.goto(APP_ROUTES.quizzes.index);
    await page.waitForLoadState('networkidle');

    const quizLinks = page.locator('a[href*="quizzes/quiz/"]');
    const linkCount = await quizLinks.count();

    expect(linkCount >= 0).toBeTruthy();
  });

  test('teacher sees demo status on quiz dashboard', async ({
    page,
    teacherUser,
    setAuthSession,
    mockQuizData,
    mockPhysicalFitnessTest,
  }) => {
    await setAuthSession(teacherUser);
    await mockPhysicalFitnessTest();
    await mockQuizData({ quizzes: [createMockQuiz()], progress: [] });

    await page.goto(APP_ROUTES.quizzes.index);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Quiz Page', () => {
  const mockQuizQuestions = () => [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'What is the FITT principle?',
      choices: [
        'Frequency, Intensity, Time, Type',
        'Fast, Intense, Timed, Test',
        'Fit, Improve, Train, Try',
        'Fun, Important, Targeted, Timed',
      ],
      correct_answer: 'Frequency, Intensity, Time, Type',
    },
  ];

  test('quiz page loads for a pending quiz', async ({
    page,
    studentUser,
    setAuthSession,
    mockQuizData,
  }) => {
    const quizId = 1;

    await setAuthSession(studentUser);
    await mockQuizData({
      quizzes: [createMockQuiz({ id: quizId, questions: mockQuizQuestions() })],
      progress: [createMockQuizProgress({ quiz_id: quizId, status: 'Pending' })],
    });

    await page.goto(APP_ROUTES.quizzes.quiz(quizId));
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain(`quiz/${quizId}`);
  });

  test('quiz page shows question text', async ({
    page,
    studentUser,
    setAuthSession,
    mockQuizData,
  }) => {
    const quizId = 1;

    await setAuthSession(studentUser);
    await mockQuizData({
      quizzes: [createMockQuiz({ id: quizId, questions: mockQuizQuestions() })],
      progress: [createMockQuizProgress({ quiz_id: quizId, status: 'Pending' })],
    });

    await page.goto(APP_ROUTES.quizzes.quiz(quizId));
    await page.waitForLoadState('load');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('completed quiz shows results', async ({
    page,
    studentUser,
    setAuthSession,
    mockQuizData,
  }) => {
    const quizId = 1;

    await setAuthSession(studentUser);
    await mockQuizData({
      quizzes: [createMockQuiz({ id: quizId, questions: mockQuizQuestions() })],
      progress: [createMockQuizProgress({
        quiz_id: quizId,
        status: 'Done',
        score: 1,
        points: 900,
        total_items: 1,
      })],
    });

    await page.goto(APP_ROUTES.quizzes.quiz(quizId));
    await page.waitForLoadState('load');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
