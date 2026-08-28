import { describe, expect, it, vi } from 'vitest';

vi.mock('@/client/supabase', () => ({ default: { auth: {} } }));

import { getRecoveryParams } from './ChangePassword';

describe('getRecoveryParams', () => {
  it('reads Supabase recovery tokens from the URL fragment', () => {
    expect(
      getRecoveryParams(
        '',
        '#access_token=access-token&refresh_token=refresh-token&type=recovery',
      ),
    ).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      type: 'recovery',
    });
  });

  it('keeps supporting query-string recovery links', () => {
    expect(
      getRecoveryParams(
        '?access_token=access-token&refresh_token=refresh-token&type=recovery',
        '',
      ),
    ).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      type: 'recovery',
    });
  });
});
