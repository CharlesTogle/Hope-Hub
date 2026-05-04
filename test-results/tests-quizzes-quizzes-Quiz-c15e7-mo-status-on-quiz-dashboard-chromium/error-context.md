# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/quizzes/quizzes.spec.js >> Quiz Dashboard >> teacher sees demo status on quiz dashboard
- Location: e2e/tests/quizzes/quizzes.spec.js:123:3

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
  121 |   });
  122 | 
  123 |   test('teacher sees demo status on quiz dashboard', async ({
  124 |     page,
  125 |     teacherUser,
  126 |     setAuthSession,
  127 |     mockQuizData,
  128 |     mockPhysicalFitnessTest,
  129 |   }) => {
  130 |     await setAuthSession(teacherUser);
  131 |     await mockPhysicalFitnessTest();
  132 |     await mockQuizData({ quizzes: [createMockQuiz()], progress: [] });
  133 | 
  134 |     await page.goto(APP_ROUTES.quizzes.index);
  135 |     await page.waitForLoadState('networkidle');
  136 | 
> 137 |     await expect(page.locator('body')).toBeVisible();
      |                                        ^ Error: expect(locator).toBeVisible() failed
  138 |   });
  139 | });
  140 | 
  141 | test.describe('Quiz Page', () => {
  142 |   const mockQuizQuestions = () => [
  143 |     {
  144 |       id: 1,
  145 |       type: 'multiple_choice',
  146 |       question: 'What is the FITT principle?',
  147 |       choices: [
  148 |         'Frequency, Intensity, Time, Type',
  149 |         'Fast, Intense, Timed, Test',
  150 |         'Fit, Improve, Train, Try',
  151 |         'Fun, Important, Targeted, Timed',
  152 |       ],
  153 |       correct_answer: 'Frequency, Intensity, Time, Type',
  154 |     },
  155 |   ];
  156 | 
  157 |   test('quiz page loads for a pending quiz', async ({
  158 |     page,
  159 |     studentUser,
  160 |     setAuthSession,
  161 |     mockQuizData,
  162 |   }) => {
  163 |     const quizId = 1;
  164 | 
  165 |     await setAuthSession(studentUser);
  166 |     await mockQuizData({
  167 |       quizzes: [createMockQuiz({ id: quizId, questions: mockQuizQuestions() })],
  168 |       progress: [createMockQuizProgress({ quiz_id: quizId, status: 'Pending' })],
  169 |     });
  170 | 
  171 |     await page.goto(APP_ROUTES.quizzes.quiz(quizId));
  172 |     await page.waitForLoadState('load');
  173 | 
  174 |     await expect(page.locator('body')).toBeVisible();
  175 |     expect(page.url()).toContain(`quiz/${quizId}`);
  176 |   });
  177 | 
  178 |   test('quiz page shows question text', async ({
  179 |     page,
  180 |     studentUser,
  181 |     setAuthSession,
  182 |     mockQuizData,
  183 |   }) => {
  184 |     const quizId = 1;
  185 | 
  186 |     await setAuthSession(studentUser);
  187 |     await mockQuizData({
  188 |       quizzes: [createMockQuiz({ id: quizId, questions: mockQuizQuestions() })],
  189 |       progress: [createMockQuizProgress({ quiz_id: quizId, status: 'Pending' })],
  190 |     });
  191 | 
  192 |     await page.goto(APP_ROUTES.quizzes.quiz(quizId));
  193 |     await page.waitForLoadState('load');
  194 | 
  195 |     const pageContent = await page.textContent('body');
  196 |     expect(pageContent).toBeTruthy();
  197 |   });
  198 | 
  199 |   test('completed quiz shows results', async ({
  200 |     page,
  201 |     studentUser,
  202 |     setAuthSession,
  203 |     mockQuizData,
  204 |   }) => {
  205 |     const quizId = 1;
  206 | 
  207 |     await setAuthSession(studentUser);
  208 |     await mockQuizData({
  209 |       quizzes: [createMockQuiz({ id: quizId, questions: mockQuizQuestions() })],
  210 |       progress: [createMockQuizProgress({
  211 |         quiz_id: quizId,
  212 |         status: 'Done',
  213 |         score: 1,
  214 |         points: 900,
  215 |         total_items: 1,
  216 |       })],
  217 |     });
  218 | 
  219 |     await page.goto(APP_ROUTES.quizzes.quiz(quizId));
  220 |     await page.waitForLoadState('load');
  221 | 
  222 |     const pageContent = await page.textContent('body');
  223 |     expect(pageContent).toBeTruthy();
  224 |   });
  225 | });
  226 | 
```