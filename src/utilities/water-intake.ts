export type WaterIntakeCategory = 'age-based' | 'tropical' | 'within';

export function isValidWaterIntakeNumber(value: string, minimum: number): boolean {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= minimum;
}

export function getWaterIntakeCategory(
  waterIntake: string,
  age: number,
  isTropical: boolean,
): WaterIntakeCategory {
  if (waterIntake.includes('-') || age < 14) return 'age-based';
  if (isTropical) return 'tropical';
  return 'within';
}
