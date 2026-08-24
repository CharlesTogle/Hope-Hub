import { describe, expect, it } from 'vitest';
import { lectureKeys } from '@/lib/query-keys';

describe('lecture query keys', () => {
  it('keeps raw progress and summary data in separate caches', () => {
    expect(lectureKeys.progress('user-1')).not.toEqual(lectureKeys.summary('user-1'));
  });
});
