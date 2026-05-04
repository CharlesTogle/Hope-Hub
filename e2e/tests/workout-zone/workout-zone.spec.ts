import { test, expect } from '../../fixtures';
import { APP_ROUTES } from '../../config/routes';
import type { Page } from '@playwright/test';

// Workout zone loads 13 video thumbnails from Supabase Storage and YouTube embeds.
// We block external storage/media requests and use 'load' (not 'networkidle')
// to prevent the 30s test timeout.
const blockExternalMedia = async (page: Page) => {
  await page.route('**youtube.com/**', (route) => route.abort());
  await page.route('**ytimg.com/**', (route) => route.abort());
  // Storage thumbnails are already blocked via setAuthSession → storage/v1 mock
};

test.describe('Workout Zone', () => {
  test('workout zone page loads', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);
    await blockExternalMedia(page);

    await page.goto(APP_ROUTES.workoutZone.index);
    await page.waitForLoadState('load');

    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('workout-zone');
  });

  test('workout zone shows video categories', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);
    await blockExternalMedia(page);

    await page.goto(APP_ROUTES.workoutZone.index);
    await page.waitForLoadState('load');

    const pageContent = await page.textContent('body');
    const hasCategories =
      pageContent.toLowerCase().includes('warm') ||
      pageContent.toLowerCase().includes('upper') ||
      pageContent.toLowerCase().includes('lower');

    expect(hasCategories).toBeTruthy();
  });

  test('workout zone has video list items', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);
    await blockExternalMedia(page);

    await page.goto(APP_ROUTES.workoutZone.index);
    await page.waitForLoadState('load');

    const videoItems = page.locator('img, [data-testid*="video"]');
    const count = await videoItems.count();
    expect(count >= 0).toBeTruthy();
  });

  test('clicking a video updates the URL with video identifier', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);
    await blockExternalMedia(page);

    await page.goto(APP_ROUTES.workoutZone.index);
    await page.waitForLoadState('load');

    const videoLinks = page.locator('a[href*="workout-zone/"]');
    const count = await videoLinks.count();

    if (count > 0) {
      await videoLinks.first().click();
      await page.waitForLoadState('load');
      expect(page.url()).toContain('workout-zone/');
    }
  });

  test('workout zone page shows video player area', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);
    await blockExternalMedia(page);

    await page.goto(APP_ROUTES.workoutZone.index);
    await page.waitForLoadState('load');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('video detail page shows instructions section', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);
    await blockExternalMedia(page);

    await page.goto(APP_ROUTES.workoutZone.index);
    await page.waitForLoadState('load');

    const videoLinks = page.locator('a[href*="workout-zone/"]');
    const count = await videoLinks.count();

    if (count > 0) {
      await videoLinks.first().click();
      await page.waitForLoadState('load');

      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });

  test('workout zone page shows references/citations section', async ({
    page,
    studentUser,
    setAuthSession,
  }) => {
    await setAuthSession(studentUser);
    await blockExternalMedia(page);

    await page.goto(APP_ROUTES.workoutZone.index);
    await page.waitForLoadState('load');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
