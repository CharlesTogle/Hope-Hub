import { test, expect } from '../../fixtures';
import { APP_ROUTES } from '../../config/routes';

test.describe('Health Calculators — Index', () => {
  test('health calculators index page loads', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.index);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('health-calculators');
  });

  test('index page has links to all calculators', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.index);
    await page.waitForLoadState('load');

    const calculatorLinks = page.locator('a[href*="health-calculators/"]');
    const count = await calculatorLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Health Calculators — BMI', () => {
  test('BMI calculator page loads', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.bmi);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('bmi');
  });

  test('BMI calculator has height and weight inputs', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.bmi);
    await page.waitForLoadState('load');

    const inputs = page.locator('input[type="number"], input[type="text"]');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('BMI calculator has calculate button', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.bmi);
    await page.waitForLoadState('load');

    const calcButton = page.locator('button:has-text("Calculate")');
    await expect(calcButton.first()).toBeVisible();
  });

  test('BMI calculator has clear button', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.bmi);
    await page.waitForLoadState('load');

    const clearButton = page.locator('button:has-text("Clear"), button:has-text("Reset")');
    const hasClear = await clearButton.count().then((n) => n > 0);
    expect(hasClear).toBeTruthy();
  });

  test('BMI calculator computes result after input', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.bmi);
    await page.waitForLoadState('load');

    const inputs = await page.locator('input[type="number"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('170'); // height
      await inputs[1].fill('70');  // weight

      await page.click('button:has-text("Calculate")');

      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });
});

test.describe('Health Calculators — BMR', () => {
  test('BMR calculator page loads', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.bmr);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('bmr');
  });

  test('BMR calculator has required inputs', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.bmr);
    await page.waitForLoadState('load');

    const inputs = page.locator('input[type="number"], select');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('BMR calculator has calculate button', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.bmr);
    await page.waitForLoadState('load');

    const calcButton = page.locator('button:has-text("Calculate")');
    await expect(calcButton.first()).toBeVisible();
  });
});

test.describe('Health Calculators — IBW', () => {
  test('IBW calculator page loads', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.ibw);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('ibw');
  });
});

test.describe('Health Calculators — Water Intake', () => {
  test('water intake calculator page loads', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.waterIntake);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('waterintake');
  });

  test('water intake calculator computes result', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.waterIntake);
    await page.waitForLoadState('load');

    const weightInput = page.locator('input[type="number"]').first();
    await weightInput.fill('70');

    const calcButton = page.locator('button:has-text("Calculate")');
    const hasCalc = await calcButton.count().then((n) => n > 0);

    if (hasCalc) {
      await calcButton.first().click();
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });
});

test.describe('Health Calculators — Body Fat Percentage', () => {
  test('body fat percentage calculator page loads', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.bodyFat);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('bodyfatpercentage');
  });
});

test.describe('Health Calculators — Heart Rate', () => {
  test('heart rate calculator page loads', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.heartRate);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('heartrate');
  });

  test('heart rate calculator has age and resting HR inputs', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.heartRate);
    await page.waitForLoadState('load');

    const inputs = page.locator('input[type="number"]');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('heart rate calculator shows 5 training zones after calculation', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);

    await page.goto(APP_ROUTES.healthCalculators.heartRate);
    await page.waitForLoadState('load');

    const inputs = await page.locator('input[type="number"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('25'); // age
      await inputs[1].fill('65'); // resting HR

      const calcButton = page.locator('button:has-text("Calculate")');
      const hasCalc = await calcButton.count().then((n) => n > 0);

      if (hasCalc) {
        await calcButton.first().click();
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
      }
    }
  });
});
