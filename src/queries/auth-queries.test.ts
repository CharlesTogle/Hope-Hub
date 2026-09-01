import { describe, expect, it, vi } from 'vitest';

const { single, from, getSession, rpc } = vi.hoisted(() => {
  const single = vi.fn();
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));

  return {
    single,
    from: vi.fn(() => ({ select })),
    getSession: vi.fn(),
    rpc: vi.fn(),
  };
});

vi.mock('@/client/supabase', () => ({
  default: {
    auth: { getSession },
    from,
    rpc,
  },
}));

import { fetchAuthenticatedProfile } from './auth-queries';

describe('fetchAuthenticatedProfile', () => {
  it('loads an authenticated profile without client-side provisioning', async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: '00000000-0000-0000-0000-000000000001' } } },
      error: null,
    });
    single.mockResolvedValue({
      data: {
        uuid: '00000000-0000-0000-0000-000000000001',
        full_name: 'Integration Student',
        email: 'student@example.com',
        user_type: 'student',
      },
      error: null,
    });

    await expect(fetchAuthenticatedProfile()).resolves.toMatchObject({
      userId: '00000000-0000-0000-0000-000000000001',
      profile: { email: 'student@example.com' },
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
