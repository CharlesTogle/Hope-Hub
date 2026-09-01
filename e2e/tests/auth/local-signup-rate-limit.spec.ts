import { expect, test } from '@playwright/test';

const supabaseUrl = process.env.E2E_SUPABASE_URL;
const anonKey = process.env.E2E_SUPABASE_ANON_KEY;

test.skip(!supabaseUrl || !anonKey, 'Requires a local Supabase API and anon key');

test('GoTrue rejects the eleventh signup attempt from one IP', async ({ request }) => {
  const suffix = crypto.randomUUID();
  const responses = await Promise.all(
    Array.from({ length: 11 }, (_, index) =>
      request.post(`${supabaseUrl}/auth/v1/signup`, {
        headers: { apikey: anonKey! },
        data: {
          email: `signup-rate-limit-${suffix}-${index}@example.com`,
          password: 'password123',
        },
      }),
    ),
  );

  expect(responses.filter((response) => response.ok())).toHaveLength(10);
  expect(responses.filter((response) => response.status() === 429)).toHaveLength(1);
});
