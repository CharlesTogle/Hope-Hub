export type HeightUnit = 'cm' | 'm' | 'ft';
export type WeightUnit = 'kg' | 'lbs';
export type MeasurementUnit = 'cm' | 'm' | 'ft';
export type Gender = 'male' | 'female';
export type BMRFormula = 'Mifflin St Jeor' | 'Revised Harris-Benedict' | 'Katch-Mcardle';

export interface BMRResult {
  BMR: number;
  DailyCalories: Record<string, number>;
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

export interface ExcelWorkbookData {
  data: (string | number)[][];
  headers: string[];
  classCode: string;
}
