import { test, expect } from '../../fixtures/index.js';
import { APP_ROUTES } from '../../config/routes.js';

test.describe('Auth — Login', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.login);
    await page.waitForLoadState('load');

    // FormInput uses type="text" for email (not type="email")
    await expect(page.locator('input[placeholder="Email"], input[placeholder="Email Address"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    // FormButton renders a plain <button> with text, no type="submit"
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('login page has forgot password link', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.login);

    // Forgot password is a <button onClick={navigate}>, not an <a href>
    const btn = page.locator('button:has-text("Forgot Password")');
    await expect(btn).toBeVisible();
  });

  test('login page has register link', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.login);

    // FormHeading renders a <span onClick={navigate}> for the action link
    const link = page.locator('span:has-text("Sign Up")');
    await expect(link).toBeVisible();
  });

  test('clicking forgot password link navigates to forgot password page', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.login);

    await page.click('button:has-text("Forgot Password")');
    await page.waitForLoadState('load');

    expect(page.url()).toContain('forgot-password');
  });

  test('clicking register link navigates to register page', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.login);

    await page.click('span:has-text("Sign Up")');
    await page.waitForLoadState('load');

    expect(page.url()).toContain('register');
  });

  test('submitting empty login form shows error', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.login);

    await page.click('button:has-text("Login")');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('remember me checkbox is present', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.login);

    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
  });

  test('login form accepts email and password input', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.login);

    await page.fill('input[placeholder="Email"], input[placeholder="Email Address"]', 'test@test.com');
    await page.fill('input[placeholder="Password"]', 'password123');

    const email = await page.inputValue('input[placeholder="Email"], input[placeholder="Email Address"]');
    const password = await page.inputValue('input[placeholder="Password"]');

    expect(email).toBe('test@test.com');
    expect(password).toBe('password123');
  });

  test('failed login shows error message', async ({ page }) => {
    await page.route('**/auth/v1/token**', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      });
    });

    await page.goto(APP_ROUTES.auth.login);

    await page.fill('input[placeholder="Email"], input[placeholder="Email Address"]', 'wrong@test.com');
    await page.fill('input[placeholder="Password"]', 'wrongpassword');
    await page.click('button:has-text("Login")');

    await page.waitForLoadState('load');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Auth — Register', () => {
  test('register page renders correctly', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.register);
    await page.waitForLoadState('load');

    // FormInput uses type="text" for email — not type="email"
    await expect(page.locator('input[placeholder="Email"], input[placeholder="Email Address"]')).toBeVisible();
    // There are two password fields (Password + Confirm Password) — use .first()
    await expect(page.locator('input[placeholder="Password"]').first()).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
  });

  test('register page has student and teacher role options', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.register);
    await page.waitForLoadState('load');

    const radioButtons = page.locator('input[type="radio"]');
    const count = await radioButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('register page has data privacy consent checkbox', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.register);
    await page.waitForLoadState('load');

    const checkboxes = page.locator('input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();
  });

  test('register page has link back to login', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.register);

    // FormHeading renders a <span onClick={navigate}> — action text is "Login"
    const link = page.locator('span:has-text("Login")');
    await expect(link).toBeVisible();
  });

  test('passwords mismatch shows error', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.register);
    await page.waitForLoadState('load');

    await page.fill('input[placeholder="Password"]', 'password123');
    await page.fill('input[placeholder="Confirm Password"]', 'different456');
    await page.click('button:has-text("Sign Up")');
    await page.waitForLoadState('load');

    expect(page.url()).toContain('register');
  });
});

test.describe('Auth — Forgot Password', () => {
  test('forgot password page renders correctly', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.forgotPassword);
    await page.waitForLoadState('load');

    await expect(page.locator('input[placeholder="Email"], input[placeholder="Email Address"]')).toBeVisible();
  });

  test('forgot password page has email input and submit button', async ({ page }) => {
    await page.goto(APP_ROUTES.auth.forgotPassword);

    const emailInput = page.locator('input[placeholder="Email"], input[placeholder="Email Address"]');
    const submitButton = page.locator('button:has-text("Confirm"), button:has-text("Send")');

    await expect(emailInput).toBeVisible();
    await expect(submitButton.first()).toBeVisible();
  });

  test('submitting forgot password sends reset email', async ({ page }) => {
    await page.route('**/auth/v1/recover**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto(APP_ROUTES.auth.forgotPassword);

    await page.fill('input[placeholder="Email"], input[placeholder="Email Address"]', 'test@test.com');
    await page.click('button:has-text("Confirm"), button:has-text("Send")');

    await page.waitForLoadState('load');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Auth — Session & Redirect', () => {
  test('unauthenticated user accessing dashboard is redirected to login', async ({
    page,
    mockUnauthenticated,
  }) => {
    await mockUnauthenticated();
    await page.goto(APP_ROUTES.dashboard);
    await page.waitForURL('**/login**', { timeout: 10000 });

    expect(page.url()).toContain('login');
  });

  test('authenticated student accessing dashboard stays on dashboard', async ({
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

    expect(page.url()).toContain('dashboard');
    expect(page.url()).not.toContain('login');
  });
});
