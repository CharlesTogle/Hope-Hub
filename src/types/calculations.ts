export type HeightUnit = 'cm' | 'm' | 'ft';
export type WeightUnit = 'kg' | 'lbs';
export type MeasurementUnit = 'cm' | 'm' | 'ft';
export type Gender = 'male' | 'female';
export type BMRFormula =
  | 'Mifflin St Jeor'
  | 'Revised Harris-Benedict'
  | 'Katch-McArdle';
export type BMRActivityLevel =
  | 'Sedentary: little or no exercise'
  | 'Light: exercise 1-3 times/week'
  | 'Moderate: exercise 4-5 times/week'
  | 'Active: daily exercise or intense exercise 3-4 times/week'
  | 'Very Active: intense exercise 6-7 times/week'
  | 'Extra Active: very intense exercise daily, or physical job';
export type WaterIntakeActivityLevel =
  | 'Sedentary (Little to No Exercise)'
  | 'Light Exercise (1-2 times/week)'
  | 'Moderate Exercise (3-5 times/week)'
  | 'High Exercise (6-7 times/week)'
  | 'Extreme (2x per day)';
export type HeartRateZone =
  | 'Very Light'
  | 'Light'
  | 'Moderate'
  | 'Hard'
  | 'Very Hard';

export interface BMRResult {
  BMR: number;
  DailyCalories: {
    sedentary: number;
    'lightly active': number;
    'moderately active': number;
    'very active': number;
    'extra active': number;
    'super active': number;
  };
}

export interface IBWResult {
  IBW: { Robinson: number; Miller: number; Devine: number; Hamwi: number };
  HealthyBMIRange: { min: number; max: number };
}

export interface CalorieGoalsResult {
  weightLoss: {
    'Mild Weight Loss': number;
    'Weight Loss': number;
    'Extreme Weight Loss': number;
  };
  weightGain: {
    'Maintain Weight': number;
    'Mild Weight Gain': number;
    'Weight Gain': number;
    'Extreme Weight Gain': number;
  };
}

export interface TDEEResult {
  TDEE: number;
  DailyCalories: Record<string, number>;
}

export interface BodyFatResult {
  results: {
    'Body Fat: U.S. Navy Method': string;
    'Body Fat Mass': string;
    'Lean Body Mass': string;
    'Lean Body Fat for Given Age': string;
    'Body Fat Loss to Reach Ideal': string;
    'Body Fat: BMI Method': string;
  };
}

export interface HeartRateResult {
  zone: HeartRateZone;
  range: string;
}

export interface BodyFatParams {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  neck: number;
  waist: number;
  hips?: number;
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
  neckUnit: MeasurementUnit;
  waistUnit: MeasurementUnit;
  hipsUnit?: MeasurementUnit;
}
