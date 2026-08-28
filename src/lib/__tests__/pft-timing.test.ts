import { describe, expect, it } from 'vitest';
import {
  getPftTimingValidation,
  shouldValidatePftTiming,
} from '@/lib/pft-timing';

describe('shouldValidatePftTiming', () => {
  it('skips timing validation only for APP_ENV=DEV', () => {
    expect(shouldValidatePftTiming('DEV')).toBe(false);
  });

  it('keeps timing validation for unset and non-DEV values', () => {
    expect(shouldValidatePftTiming(undefined)).toBe(true);
    expect(shouldValidatePftTiming('dev')).toBe(true);
    expect(shouldValidatePftTiming('PROD')).toBe(true);
  });
});

describe('getPftTimingValidation', () => {
  const baseInput = {
    appEnv: undefined,
    startTimeInMinutes: 10 * 60,
    endTimeInMinutes: 10 * 60 + 3,
    currentTimeInMinutes: 11 * 60,
    isBmiTest: false,
  };

  it('rejects an end time before the start time', () => {
    expect(
      getPftTimingValidation({
        ...baseInput,
        endTimeInMinutes: baseInput.startTimeInMinutes - 1,
      }),
    ).toBe('end-before-start');
  });

  it('rejects an end time after the current time', () => {
    expect(
      getPftTimingValidation({
        ...baseInput,
        endTimeInMinutes: baseInput.currentTimeInMinutes + 1,
      }),
    ).toBe('end-after-current-time');
  });

  it('rejects non-BMI tests shorter than three minutes', () => {
    expect(
      getPftTimingValidation({
        ...baseInput,
        endTimeInMinutes: baseInput.startTimeInMinutes + 2,
      }),
    ).toBe('too-short');
  });

  it('allows BMI tests shorter than three minutes', () => {
    expect(
      getPftTimingValidation({
        ...baseInput,
        endTimeInMinutes: baseInput.startTimeInMinutes + 2,
        isBmiTest: true,
      }),
    ).toBeNull();
  });

  it('rejects tests longer than twenty minutes', () => {
    expect(
      getPftTimingValidation({
        ...baseInput,
        endTimeInMinutes: baseInput.startTimeInMinutes + 21,
      }),
    ).toBe('too-long');
  });

  it('skips all timing checks in DEV', () => {
    expect(
      getPftTimingValidation({
        ...baseInput,
        appEnv: 'DEV',
        endTimeInMinutes: baseInput.startTimeInMinutes - 1,
      }),
    ).toBeNull();
  });
});
