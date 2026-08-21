import { describe, expect, it } from 'vitest';
import {
  getWaterIntakeCategory,
  isValidWaterIntakeNumber,
} from '@/utilities/water-intake';

describe('water intake inputs', () => {
  it('rejects non-finite values', () => {
    expect(isValidWaterIntakeNumber('NaN', 0)).toBe(false);
    expect(isValidWaterIntakeNumber('Infinity', 0)).toBe(false);
  });

  it('accepts finite values at or above the minimum', () => {
    expect(isValidWaterIntakeNumber('0', 0)).toBe(true);
    expect(isValidWaterIntakeNumber('72.5', 0)).toBe(true);
  });

  it('rejects zero when a positive minimum is required', () => {
    expect(isValidWaterIntakeNumber('0', Number.MIN_VALUE)).toBe(false);
  });
});

describe('getWaterIntakeCategory', () => {
  it('uses age-based guidance for child recommendations', () => {
    expect(getWaterIntakeCategory('50 oz', 9, false)).toBe('age-based');
  });

  it('uses tropical guidance for adult tropical recommendations', () => {
    expect(getWaterIntakeCategory('90.00 oz', 30, true)).toBe('tropical');
  });

  it('uses standard adult guidance otherwise', () => {
    expect(getWaterIntakeCategory('90.00 oz', 30, false)).toBe('within');
  });
});
