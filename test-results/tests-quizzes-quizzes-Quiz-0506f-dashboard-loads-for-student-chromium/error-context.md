# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/quizzes/quizzes.spec.js >> Quiz Dashboard >> quiz dashboard loads for student
- Location: e2e/tests/quizzes/quizzes.spec.js:6:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('body')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('body')
    9 × locator resolved to <body>…</body>
      - unexpected value "hidden"

```

# Test source

```ts
  1   | import { test, expect } from '../../fixtures/index.js';
  2   | import { APP_ROUTES } from '../../config/routes.js';
  3   | import { createMockQuiz, createMockQuizProgress } from '../../helpers/test-data.js';
  4   | 
  5   | test.describe('Quiz Dashboard', () => {
  6   |   test('quiz dashboard loads for student', async ({
  7   |     page,
  8   |     studentUser,
  9   |     setAuthSession,
  10  |     mockQuizData,
  11  |     mockPhysicalFitnessTest,
  12  |   }) => {
  13  |     await setAuthSession(studentUser);
  14  |     await mockPhysicalFitnessTest();
  15  |     await mockQuizData();
  16  | 
  17  |     await page.goto(APP_ROUTES.quizzes.index);
  18  |     await page.waitForLoadState('networkidle');
  19  | 
> 20  |     await expect(page.locator('body')).toBeVisible();
      |                                        ^ Error: expect(locator).toBeVisible() failed
  21  |     expect(page.url()).toContain('quizzes');
  22  |   });
  23  | 
  24  |   test('quiz dashboard has filter tabs', async ({
  25  |     page,
  26  |     studentUser,
  27  |     setAuthSession,
  28  |     mockQuizData,
  29  |     mockPhysicalFitnessTest,
  30  |   }) => {
  31  |     await setAuthSession(studentUser);
  32  |     await mockPhysicalFitnessTest();
  33  |     await mockQuizData();
  34  | 
  35  |     await page.goto(APP_ROUTES.quizzes.index);
  36  |     await page.waitForLoadState('networkidle');
  37  | 
  38  |     // QuizDashboard renders filters as <motion.li> (renders to <li> in DOM)
  39  |     // inside a <ul>. Use role='listitem' with hasText for precision.
  40  |     const filterAll = page.locator('ul').locator('li').filter({ hasText: /^All$/ });
  41  |     await expect(filterAll).toBeVisible();
  42  |   });
  43  | 
  44  |   test('filtering by All shows all quizzes', async ({
  45  |     page,
  46  |     studentUser,
  47  |     setAuthSession,
  48  |     mockQuizData,
  49  |     mockPhysicalFitnessTest,
  50  |   }) => {
  51  |     await setAuthSession(studentUser);
  52  |     await mockPhysicalFitnessTest();
  53  |     await mockQuizData({
  54  |       quizzes: [
  55  |         createMockQuiz({ id: 1, title: 'Quiz 1' }),
  56  |         createMockQuiz({ id: 2, title: 'Quiz 2' }),
  57  |       ],
  58  |       progress: [
  59  |         createMockQuizProgress({ quiz_id: 1, status: 'Done' }),
  60  |         createMockQuizProgress({ quiz_id: 2, status: 'Pending' }),
  61  |       ],
  62  |     });
  63  | 
  64  |     await page.goto(APP_ROUTES.quizzes.index);
  65  |     await page.waitForLoadState('networkidle');
  66  | 
  67  |     const filterAll = page.locator('ul').locator('li').filter({ hasText: /^All$/ });
  68  |     await filterAll.waitFor({ state: 'visible' });
  69  |     await filterAll.click();
  70  | 
  71  |     const pageContent = await page.textContent('body');
  72  |     expect(pageContent).toBeTruthy();
  73  |   });
  74  | 
  75  |   test('filtering by Done shows only completed quizzes', async ({
  76  |     page,
  77  |     studentUser,
  78  |     setAuthSession,
  79  |     mockQuizData,
  80  |     mockPhysicalFitnessTest,
  81  |   }) => {
  82  |     await setAuthSession(studentUser);
  83  |     await mockPhysicalFitnessTest();
  84  |     await mockQuizData({
  85  |       quizzes: [createMockQuiz({ id: 1, title: 'Quiz 1' })],
  86  |       progress: [createMockQuizProgress({ quiz_id: 1, status: 'Done' })],
  87  |     });
  88  | 
  89  |     await page.goto(APP_ROUTES.quizzes.index);
  90  |     await page.waitForLoadState('networkidle');
  91  | 
  92  |     const filterDone = page.locator('ul').locator('li').filter({ hasText: /^Done$/ });
  93  |     await filterDone.waitFor({ state: 'visible' });
  94  |     await filterDone.click();
  95  | 
  96  |     const pageContent = await page.textContent('body');
  97  |     expect(pageContent).toBeTruthy();
  98  |   });
  99  | 
  100 |   test('locked quiz cards are not clickable links', async ({
  101 |     page,
  102 |     studentUser,
  103 |     setAuthSession,
  104 |     mockQuizData,
  105 |     mockPhysicalFitnessTest,
  106 |   }) => {
  107 |     await setAuthSession(studentUser);
  108 |     await mockPhysicalFitnessTest();
  109 |     await mockQuizData({
  110 |       quizzes: [createMockQuiz({ id: 1, title: 'Locked Quiz' })],
  111 |       progress: [],
  112 |     });
  113 | 
  114 |     await page.goto(APP_ROUTES.quizzes.index);
  115 |     await page.waitForLoadState('networkidle');
  116 | 
  117 |     const quizLinks = page.locator('a[href*="quizzes/quiz/"]');
  118 |     const linkCount = await quizLinks.count();
  119 | 
  120 |     expect(linkCount >= 0).toBeTruthy();
```