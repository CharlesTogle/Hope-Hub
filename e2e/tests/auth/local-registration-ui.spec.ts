import { expect, test } from '@playwright/test';

const supabaseUrl = process.env.E2E_SUPABASE_URL;
const anonKey = process.env.E2E_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

test.skip(!supabaseUrl || !anonKey || !serviceRoleKey, 'Requires local Supabase credentials');

test('registration UI creates a trigger-provisioned student profile', async ({ page, request }) => {
  const email = `registration-ui-${crypto.randomUUID()}@example.com`;

  await page.goto('/auth/register');
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Name"]', 'Local UI Student');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.fill('input[placeholder="Confirm Password"]', 'password123');
  await page.check('#consent-checkbox');
  await page.getByRole('button', { name: 'Sign Up' }).click();

  await expect(page.getByText('Verification has been sent to your email')).toBeVisible();

  await expect.poll(async () => {
    const profile = await request.get(`${supabaseUrl}/rest/v1/profile?email=eq.${encodeURIComponent(email)}`, {
      headers: { apikey: serviceRoleKey!, Authorization: `Bearer ${serviceRoleKey}` },
    });
    if (!profile.ok()) return null;
    return (await profile.json())[0];
  }).toMatchObject({
    full_name: 'Local UI Student',
    email,
    user_type: 'student',
  });
});
