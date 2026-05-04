# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/physical-fitness/physical-fitness.spec.js >> Physical Fitness Test — Test Pages >> test page 0 (BMI weight) loads
- Location: e2e/tests/physical-fitness/physical-fitness.spec.js:125:3

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
  48  |     mockPhysicalFitnessTest,
  49  |   }) => {
  50  |     await setAuthSession(studentUser);
  51  |     await mockPhysicalFitnessTest();
  52  | 
  53  |     await page.goto(APP_ROUTES.physicalFitnessTest.parq);
  54  |     await page.waitForLoadState('networkidle');
  55  | 
  56  |     // 7 yes/no questions — each has 2 radio options = 14+ radio buttons total (plus gender)
  57  |     const radioButtons = page.locator('input[type="radio"]');
  58  |     const count = await radioButtons.count();
  59  |     expect(count).toBeGreaterThan(0);
  60  |   });
  61  | 
  62  |   test('PAR-Q has submit button', async ({
  63  |     page,
  64  |     studentUser,
  65  |     setAuthSession,
  66  |     mockPhysicalFitnessTest,
  67  |   }) => {
  68  |     await setAuthSession(studentUser);
  69  |     await mockPhysicalFitnessTest();
  70  | 
  71  |     await page.goto(APP_ROUTES.physicalFitnessTest.parq);
  72  |     await page.waitForLoadState('networkidle');
  73  | 
  74  |     const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Continue")');
  75  |     const hasButton = await submitButton.count().then((n) => n > 0);
  76  |     expect(hasButton).toBeTruthy();
  77  |   });
  78  | 
  79  |   test('PAR-Q submission with invalid answers (not all No) shows error', async ({
  80  |     page,
  81  |     studentUser,
  82  |     setAuthSession,
  83  |     mockPhysicalFitnessTest,
  84  |   }) => {
  85  |     await setAuthSession(studentUser);
  86  |     await mockPhysicalFitnessTest();
  87  | 
  88  |     await page.goto(APP_ROUTES.physicalFitnessTest.parq);
  89  |     await page.waitForLoadState('networkidle');
  90  | 
  91  |     // Attempt to submit without filling anything
  92  |     const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Continue")');
  93  |     const hasButton = await submitButton.count().then((n) => n > 0);
  94  | 
  95  |     if (hasButton) {
  96  |       await submitButton.first().click();
  97  |       await page.waitForLoadState('networkidle');
  98  | 
  99  |       // Should stay on parq or show error
  100 |       const pageContent = await page.textContent('body');
  101 |       expect(pageContent).toBeTruthy();
  102 |     }
  103 |   });
  104 | 
  105 |   test('teacher PAR-Q auto-completes and goes to test', async ({
  106 |     page,
  107 |     teacherUser,
  108 |     setAuthSession,
  109 |     mockPhysicalFitnessTest,
  110 |   }) => {
  111 |     await setAuthSession(teacherUser);
  112 |     await mockPhysicalFitnessTest();
  113 | 
  114 |     await page.goto(APP_ROUTES.physicalFitnessTest.parq);
  115 |     await page.waitForLoadState('networkidle');
  116 | 
  117 |     // Teacher auto-skips to test — should redirect to test/0
  118 |     const url = page.url();
  119 |     // Either stays on parq or redirects to test
  120 |     expect(url).toBeTruthy();
  121 |   });
  122 | });
  123 | 
  124 | test.describe('Physical Fitness Test — Test Pages', () => {
  125 |   test('test page 0 (BMI weight) loads', async ({
  126 |     page,
  127 |     studentUser,
  128 |     setAuthSession,
  129 |     mockPhysicalFitnessTest,
  130 |   }) => {
  131 |     await setAuthSession(studentUser);
  132 |     await mockPhysicalFitnessTest();
  133 | 
  134 |     // Simulate PAR-Q already done via localStorage
  135 |     await page.addInitScript(() => {
  136 |       const pftData = {
  137 |         gender: 'Male',
  138 |         category: '18-25',
  139 |         isPARQFinished: true,
  140 |         finishedTestIndex: [],
  141 |       };
  142 |       localStorage.setItem('physicalFitnessData', JSON.stringify(pftData));
  143 |     });
  144 | 
  145 |     await page.goto(APP_ROUTES.physicalFitnessTest.test(0));
  146 |     await page.waitForLoadState('networkidle');
  147 | 
> 148 |     await expect(page.locator('body')).toBeVisible();
      |                                        ^ Error: expect(locator).toBeVisible() failed
  149 |   });
  150 | 
  151 |   test('test page has score input', async ({
  152 |     page,
  153 |     studentUser,
  154 |     setAuthSession,
  155 |     mockPhysicalFitnessTest,
  156 |   }) => {
  157 |     await setAuthSession(studentUser);
  158 |     await mockPhysicalFitnessTest({
  159 |       uuid: studentUser.id,
  160 |       pre_physical_fitness_test: null,
  161 |       post_physical_fitness_test: null,
  162 |     });
  163 | 
  164 |     // App logic for test/0: !finishedTestIndex.includes(-1) is always true
  165 |     // → always triggers isBadRequest. Use test/1 with finishedTestIndex=[0,2]:
  166 |     //   • includes(0) = true  → prev test done ✓
  167 |     //   • length(2) > 1       → allowed ✓
  168 |     //   • includes(length-1=1) = false → no summary redirect ✓
  169 |     await page.addInitScript(() => {
  170 |       localStorage.setItem('physicalFitnessData', JSON.stringify({
  171 |         gender: 'Male',
  172 |         category: '18-25',
  173 |         isPARQFinished: true,
  174 |         finishedTestIndex: [0, 2],
  175 |       }));
  176 |     });
  177 | 
  178 |     await page.goto(APP_ROUTES.physicalFitnessTest.test(1));
  179 |     await page.waitForLoadState('networkidle');
  180 | 
  181 |     // ResultSection renders input[type="number"] for scores, input[type="time"] for timers
  182 |     const input = page.locator('input[type="number"], input[type="time"]');
  183 |     const hasInput = await input.count().then((n) => n > 0);
  184 |     expect(hasInput).toBeTruthy();
  185 |   });
  186 | });
  187 | 
  188 | test.describe('Physical Fitness Test — Summary', () => {
  189 |   test('pre-test summary page loads', async ({
  190 |     page,
  191 |     studentUser,
  192 |     setAuthSession,
  193 |     mockPhysicalFitnessTest,
  194 |   }) => {
  195 |     await setAuthSession(studentUser);
  196 |     await mockPhysicalFitnessTest({
  197 |       uuid: studentUser.id,
  198 |       pre_physical_fitness_test: JSON.stringify({
  199 |         bmi_weight: 70,
  200 |         bmi_height: 170,
  201 |         gender: 'Male',
  202 |         category: '18-25',
  203 |       }),
  204 |       post_physical_fitness_test: null,
  205 |     });
  206 | 
  207 |     await page.goto(APP_ROUTES.physicalFitnessTest.preSummary);
  208 |     await page.waitForLoadState('networkidle');
  209 | 
  210 |     await expect(page.locator('body')).toBeVisible();
  211 |     expect(page.url()).toContain('pre-test');
  212 |   });
  213 | 
  214 |   test('post-test summary page loads when post-test exists', async ({
  215 |     page,
  216 |     studentUser,
  217 |     setAuthSession,
  218 |     mockPhysicalFitnessTest,
  219 |   }) => {
  220 |     await setAuthSession(studentUser);
  221 |     await mockPhysicalFitnessTest({
  222 |       uuid: studentUser.id,
  223 |       pre_physical_fitness_test: JSON.stringify({ bmi_weight: 70, bmi_height: 170 }),
  224 |       post_physical_fitness_test: JSON.stringify({ bmi_weight: 68, bmi_height: 170 }),
  225 |     });
  226 | 
  227 |     await page.goto(APP_ROUTES.physicalFitnessTest.postSummary);
  228 |     await page.waitForLoadState('networkidle');
  229 | 
  230 |     await expect(page.locator('body')).toBeVisible();
  231 |     expect(page.url()).toContain('post-test');
  232 |   });
  233 | 
  234 |   test('summary page shows result sections', async ({
  235 |     page,
  236 |     studentUser,
  237 |     setAuthSession,
  238 |     mockPhysicalFitnessTest,
  239 |   }) => {
  240 |     await setAuthSession(studentUser);
  241 |     await mockPhysicalFitnessTest({
  242 |       uuid: studentUser.id,
  243 |       pre_physical_fitness_test: JSON.stringify({
  244 |         bmi_weight: 70,
  245 |         bmi_height: 170,
  246 |         gender: 'Male',
  247 |         category: '18-25',
  248 |       }),
```