export type PFTGender = '' | 'Male' | 'Female';
export type PFTCategory =
  | ''
  | 'elementaryBoys'
  | 'secondaryBoys'
  | 'elementaryGirls'
  | 'secondaryGirls';

export interface PFTTestResult {
  title: string;
  record: string;
  timeStarted: string;
  timeEnd: string;
  classification: string;
}

export type PFTColumnName =
  | 'pre_physical_fitness_test'
  | 'post_physical_fitness_test';

export type PFTSessionKey =
  | 'bmiWeight'
  | 'bmiHeight'
  | 'zipperTestRight'
  | 'zipperTestLeft'
  | 'sitAndReachFirst'
  | 'sitAndReachSecond'
  | 'preStepTest'
  | 'stepTest'
  | 'pushUp'
  | 'basicPlank';

export interface PFTSessionData {
  gender: PFTGender;
  category: PFTCategory;
  isPARQFinished: boolean;
  finishedTestIndex: number[];
  bmiWeight?: PFTTestResult;
  bmiHeight?: PFTTestResult;
  zipperTestRight?: PFTTestResult;
  zipperTestLeft?: PFTTestResult;
  sitAndReachFirst?: PFTTestResult;
  sitAndReachSecond?: PFTTestResult;
  preStepTest?: PFTTestResult;
  stepTest?: PFTTestResult;
  pushUp?: PFTTestResult;
  basicPlank?: PFTTestResult;
}

export interface ClassificationEntry {
  min?: number;
  max?: number;
  exact?: number;
  interpretation: string;
}

export interface PushUpClassification {
  elementaryBoys: ClassificationEntry[];
  secondaryBoys: ClassificationEntry[];
  elementaryGirls: ClassificationEntry[];
  secondaryGirls: ClassificationEntry[];
}

export type PFTClassification = ClassificationEntry[] | PushUpClassification;

export interface PFTTestDefinition {
  title: string;
  key: PFTSessionKey;
  description: string[];
  equipment: string[];
  instructionsForTester: string[];
  instructionsForPartner: string[];
  instructionsScoring: string[];
  videoInstructions: string;
  unit?: string;
  tips?: string[];
  classification?: PFTClassification;
  purpose?: string[];
}
