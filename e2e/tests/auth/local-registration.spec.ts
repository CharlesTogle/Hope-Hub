import { expect, test } from '@playwright/test';

const supabaseUrl = process.env.E2E_SUPABASE_URL;
const anonKey = process.env.E2E_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

test.skip(!supabaseUrl || !anonKey || !serviceRoleKey, 'Requires local Supabase credentials');

test.describe('Local registration integration', () => {
  test('GoTrue signup creates a student profile and ignores an untrusted admin role', async ({ request }) => {
    const email = `registration-${crypto.randomUUID()}@example.com`;
    const signup = await request.post(`${supabaseUrl}/auth/v1/signup`, {
      headers: { apikey: anonKey! },
      data: {
        email,
        password: 'password123',
        data: { fullName: 'Local Integration Student', userType: 'admin' },
      },
    });

    await expect(signup).toBeOK();
    const { user } = await signup.json();
    expect(user).toBeTruthy();

    await expect.poll(async () => {
      const profile = await request.get(`${supabaseUrl}/rest/v1/profile?uuid=eq.${user.id}`, {
        headers: { apikey: serviceRoleKey!, Authorization: `Bearer ${serviceRoleKey}` },
      });
      if (!profile.ok()) return null;
      return (await profile.json())[0];
    }).toMatchObject({
      uuid: user.id,
      full_name: 'Local Integration Student',
      email,
      user_type: 'student',
    });
  });
});
