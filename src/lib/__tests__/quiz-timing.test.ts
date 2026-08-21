import { describe, expect, it } from 'vitest';
import { getQuizQuestionDuration } from '@/lib/quiz-timing';

describe('getQuizQuestionDuration', () => {
  it('gives computation questions five minutes', () => {
    expect(
      getQuizQuestionDuration({ type: 'computation', duration: 30 }),
    ).toBe(300);
  });

  it('preserves the configured duration for other question types', () => {
    expect(
      getQuizQuestionDuration({ type: 'multiple-choice', duration: 45 }),
    ).toBe(45);
    expect(
      getQuizQuestionDuration({ type: 'identification', duration: 60 }),
    ).toBe(60);
  });
});
