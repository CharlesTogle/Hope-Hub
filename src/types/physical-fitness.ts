export interface PFTTestResult {
  title: string;
  record: string;
  timeStarted: string;
  timeEnd: string;
  classification: string;
}

export interface PFTSessionData {
  gender: string;
  category: string;
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
  key: string;
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
