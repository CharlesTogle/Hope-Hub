import type {
  BMRActivityLevel,
  BMRFormula,
  BMRResult,
  BodyFatResult,
  Gender,
  HeightUnit,
  IBWResult,
  TDEEResult,
  WaterIntakeActivityLevel,
  WeightUnit,
} from '@/types/calculations';

const convertLbsToKg = (value: number): number => value * 0.4536;
const convertFtToM = (value: number): number => value * 0.3048;
const convertCmToM = (value: number): number => value / 100;
const convertCmToInches = (value: number): number => value / 2.54;
const convertMToInches = (value: number): number => value * 39.3701;
const convertFtToInches = (value: number): number => value * 12;
const convertInchesToM = (value: number): number => value * 0.0254;

export function getBMI(
  height: number,
  weight: number,
  heightUnit: HeightUnit,
  weightUnit: WeightUnit,
): number {
  let heightInMeters;
  if (heightUnit === 'ft') {
    heightInMeters = convertFtToM(height);
  } else if (heightUnit === 'cm') {
    heightInMeters = convertCmToM(height);
  } else {
    heightInMeters = height;
  }
  const weightInKg = weightUnit === 'lbs' ? convertLbsToKg(weight) : weight;

  return weightInKg / (heightInMeters * heightInMeters);
}

export function getBMR(
  gender: Gender,
  age: number,
  height: number,
  weight: number,
  formulaVariant: BMRFormula,
  bodyFat: number,
  heightUnit: HeightUnit = 'cm',
  weightUnit: WeightUnit = 'kg',
): BMRResult {
  if (!gender) {
    throw new Error('Please select a gender to continue.');
  }

  // Convert height to cm if needed
  let heightInCm;
  if (heightUnit === 'ft') {
    heightInCm = convertFtToM(height) * 100; // ft -> m -> cm
  } else if (heightUnit === 'm') {
    heightInCm = height * 100; // m -> cm
  } else {
    heightInCm = height; // assume cm
  }

  // Convert weight to kg if needed
  const weightInKg = weightUnit === 'lbs' ? convertLbsToKg(weight) : weight;

  const activityMultipliers: BMRResult['DailyCalories'] = {
    sedentary: 1.2,
    'lightly active': 1.375,
    'moderately active': 1.465,
    'very active': 1.55,
    'extra active': 1.725,
    'super active': 1.9,
  };

  let bmr;
  switch (formulaVariant) {
    case 'Mifflin St Jeor':
      bmr =
        gender === 'male'
          ? 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5
          : 10 * weightInKg + 6.25 * heightInCm - 5 * age - 161;
      break;

    case 'Revised Harris-Benedict':
      bmr =
        gender === 'male'
          ? 13.397 * weightInKg + 4.799 * heightInCm - 5.677 * age + 88.362
          : 9.247 * weightInKg + 3.098 * heightInCm - 4.33 * age + 447.593;
      break;

    case 'Katch-McArdle':
      if (bodyFat == null) {
        throw new Error(
          'Body fat percentage is required for the selected formula.',
        );
      }
      bmr = 370 + 21.6 * (1 - bodyFat / 100) * weightInKg;
      break;

    default:
      throw new Error('Unknown formula variant selected. Please choose a valid formula.');
  }

  const caloriesByActivity: BMRResult['DailyCalories'] = {
    sedentary: 0,
    'lightly active': 0,
    'moderately active': 0,
    'very active': 0,
    'extra active': 0,
    'super active': 0,
  };
  for (const [level, multiplier] of Object.entries(activityMultipliers)) {
    caloriesByActivity[level as keyof BMRResult['DailyCalories']] = Math.round(
      bmr * multiplier,
    );
  }

  return {
    BMR: parseFloat(bmr.toFixed(2)),
    DailyCalories: caloriesByActivity,
  };
}

export function getCalorieGoals(
  bmr: number,
  activityLevel: BMRActivityLevel,
): {
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
} {
  const activityMultipliers = {
    sedentary: 1.2,
    'lightly active': 1.375,
    'moderately active': 1.465,
    active: 1.55,
    'very active': 1.725,
    'extra active': 1.9,
  };

  let multiplier;
  switch (activityLevel) {
    case 'Sedentary: little or no exercise':
      multiplier = activityMultipliers.sedentary;
      break;
    case 'Light: exercise 1-3 times/week':
      multiplier = activityMultipliers['lightly active'];
      break;
    case 'Moderate: exercise 4-5 times/week':
      multiplier = activityMultipliers['moderately active'];
      break;
    case 'Active: daily exercise or intense exercise 3-4 times/week':
      multiplier = activityMultipliers['active'];
      break;
    case 'Very Active: intense exercise 6-7 times/week':
      multiplier = activityMultipliers['very active'];
      break;
    case 'Extra Active: very intense exercise daily, or physical job':
      multiplier = activityMultipliers['extra active'];
      break;
    default:
      throw new Error('Unknown activity level selected. Please choose a valid activity level.');
  }

  const tdee = bmr * multiplier;
  return {
    weightLoss: {
      'Mild Weight Loss': Math.round(tdee - 250),
      'Weight Loss': Math.round(tdee - 500),
      'Extreme Weight Loss': Math.round(tdee - 1000),
    },
    weightGain: {
      'Maintain Weight': Math.round(tdee),
      'Mild Weight Gain': Math.round(tdee + 250),
      'Weight Gain': Math.round(tdee + 500),
      'Extreme Weight Gain': Math.round(tdee + 1000),
    },
  };
}

export function getTDEE(
  gender: Gender,
  age: number,
  height: number,
  weight: number,
  activityType: WaterIntakeActivityLevel | 'Heavy Exercise (6-7 times/week)' | 'Athlete (2x per day)',
  heightUnit: HeightUnit = 'cm',
  weightUnit: WeightUnit = 'kg',
): TDEEResult {
  if (!gender) {
    throw new Error('Please select a gender to continue.');
  }

  // Convert height to cm if needed
  let heightInCm;
  if (heightUnit === 'ft') {
    heightInCm = convertFtToM(height) * 100; // ft -> m -> cm
  } else if (heightUnit === 'm') {
    heightInCm = height * 100; // m -> cm
  } else {
    heightInCm = height; // assume cm
  }

  // Convert weight to kg if needed
  const weightInKg = weightUnit === 'lbs' ? convertLbsToKg(weight) : weight;

  const activityMultipliers = {
    'Sedentary (Little to No Exercise)': 1.2,
    'Light Exercise (1-2 times/week)': 1.375,
    'Moderate Exercise (3-5 times/week)': 1.55,
    'Heavy Exercise (6-7 times/week)': 1.725,
    'Athlete (2x per day)': 2.0,
  };

  let tdee;
  switch (activityType) {
    case 'Sedentary (Little to No Exercise)':
      tdee =
        gender === 'male'
          ? (10 * weightInKg + 6.25 * heightInCm - 5 * age + 5) *
            activityMultipliers['Sedentary (Little to No Exercise)']
          : (10 * weightInKg + 6.25 * heightInCm - 5 * age - 161) *
            activityMultipliers['Sedentary (Little to No Exercise)'];
      break;

    case 'Light Exercise (1-2 times/week)':
      tdee =
        gender === 'male'
          ? (10 * weightInKg + 6.25 * heightInCm - 5 * age + 5) *
            activityMultipliers['Light Exercise (1-2 times/week)']
          : (10 * weightInKg + 6.25 * heightInCm - 5 * age + 161) *
            activityMultipliers['Light Exercise (1-2 times/week)'];
      break;

    case 'Moderate Exercise (3-5 times/week)':
      tdee =
        gender === 'male'
          ? (13.397 * weightInKg + 6.25 * heightInCm - 5 * age + 5) *
            activityMultipliers['Moderate Exercise (3-5 times/week)']
          : (9.247 * weightInKg + 6.25 * heightInCm - 5 * age - 161) *
            activityMultipliers['Moderate Exercise (3-5 times/week)'];
      break;

    case 'Heavy Exercise (6-7 times/week)':
      tdee =
        gender === 'male'
          ? (13.397 * weightInKg + 6.25 * heightInCm - 5 * age + 5) *
            activityMultipliers['Heavy Exercise (6-7 times/week)']
          : (9.247 * weightInKg + 6.25 * heightInCm - 5 * age - 161) *
            activityMultipliers['Heavy Exercise (6-7 times/week)'];
      break;

    case 'Athlete (2x per day)':
      tdee =
        (gender === 'male'
          ? 13.397 * weightInKg + 6.25 * heightInCm - 5 * age + 5
          : 9.247 * weightInKg + 6.25 * heightInCm - 5 * age + 5) *
        activityMultipliers['Athlete (2x per day)'];
      break;

    default:
      throw new Error('Unknown activity type selected. Please choose a valid activity level.');
  }

  const caloriesByActivity: Record<string, number> = {};
  for (const [level, multiplier] of Object.entries(activityMultipliers)) {
    caloriesByActivity[level] = Math.round(tdee * multiplier);
  }

  return {
    TDEE: parseFloat(tdee.toFixed(2)),
    DailyCalories: caloriesByActivity,
  };
}

export function getIBW(
  height: number,
  heightUnit: HeightUnit,
  gender: Gender,
): IBWResult {
  // convert height to inches/feet
  let heightInInches;
  if (heightUnit === 'm') {
    heightInInches = convertMToInches(height);
  } else if (heightUnit === 'cm') {
    heightInInches = convertCmToInches(height);
  } else {
    heightInInches = convertFtToInches(height);
  }

  const normalizedGender = gender;

  let Robinson: number;
  let Miller: number;
  let Devine: number;
  let Hamwi: number;
  // const HealthyBMIRange = (height) => {
  //   minWeight = 18.5 * height ** 2;
  //   maxWeight = 24.9 * height ** 2;
  //   String("Minimum: " + toString(minWeight))
  //   String("Maximum: " + toString(maxWeight))
  // };

  const overFiveFt = Math.max(heightInInches - 60, 0);
  const heightInMeters = convertInchesToM(heightInInches);

  const minWeight = 18.5 * heightInMeters ** 2;
  const maxWeight = 24.9 * heightInMeters ** 2;

  if (normalizedGender === 'female') {
    Robinson = 49 + 1.7 * overFiveFt;
    Miller = 53.1 + 1.36 * overFiveFt;
    Devine = 45.5 + 2.3 * overFiveFt;
    Hamwi = 45.5 + 2.2 * overFiveFt;
  } else {
    Robinson = 52 + 1.9 * overFiveFt;
    Miller = 56.2 + 1.41 * overFiveFt;
    Devine = 50 + 2.3 * overFiveFt;
    Hamwi = 48 + 2.7 * overFiveFt;
  }

  return {
    IBW: {
      Robinson: parseFloat(Robinson.toFixed(2)),
      Miller: parseFloat(Miller.toFixed(2)),
      Devine: parseFloat(Devine.toFixed(2)),
      Hamwi: parseFloat(Hamwi.toFixed(2)),
    },
    HealthyBMIRange: {
      min: parseFloat(minWeight.toFixed(2)),
      max: parseFloat(maxWeight.toFixed(2)),
    },
  };
}

export function getWaterIntake(
  weight: number,
  activityLevel: WaterIntakeActivityLevel,
  weightUnit: WeightUnit,
): number {
  const weightInKg = weightUnit === 'lbs' ? convertLbsToKg(weight) : weight;

  let waterIntake = weightInKg * 0.033;

  switch (activityLevel) {
    case 'Sedentary (Little to No Exercise)':
      waterIntake += 0;
      break;
    case 'Light Exercise (1-2 times/week)':
      waterIntake += 0.2;
      break;
    case 'Moderate Exercise (3-5 times/week)':
      waterIntake += 0.35;
      break;
    case 'High Exercise (6-7 times/week)':
      waterIntake += 0.5;
      break;
    case 'Extreme (2x per day)':
      waterIntake += 0.7;
      break;
    default:
      throw new Error('Unknown activity level. Please select a valid option.');
  }

  return parseFloat(waterIntake.toFixed(2));
}

export function getBodyFatPercentage(
  age: number,
  gender: Gender,
  height: number,
  weight: number,
  neck: number,
  waist: number,
  hips: number,
  heightUnit: HeightUnit,
  weightUnit: WeightUnit,
  neckUnit: HeightUnit,
  waistUnit: HeightUnit,
  hipsUnit: HeightUnit,
): BodyFatResult {
  let neckInInches: number;
  let waistInInches: number;
  let hipsInInches: number | undefined;
  let heightInInches: number;
  let heightInMeters: number;
  if (heightUnit === 'ft') {
    heightInMeters = convertFtToM(height);
  } else if (heightUnit === 'cm') {
    heightInMeters = convertCmToM(height);
  } else {
    heightInMeters = height;
  }

  if (heightUnit === 'ft') {
    heightInInches = convertFtToInches(height);
  } else if (heightUnit === 'cm') {
    heightInInches = convertCmToInches(height);
  } else {
    heightInInches = convertMToInches(height);
  }

  if (neckUnit === 'm') {
    neckInInches = convertMToInches(neck);
  } else if (neckUnit === 'cm') {
    neckInInches = convertCmToInches(neck);
  } else {
    neckInInches = convertFtToInches(neck);
  }

  if (waistUnit === 'm') {
    waistInInches = convertMToInches(waist);
  } else if (waistUnit === 'cm') {
    waistInInches = convertCmToInches(waist);
  } else {
    waistInInches = convertFtToInches(waist);
  }

  if (hips !== undefined && hipsUnit !== undefined) {
    if (hipsUnit === 'm') {
      hipsInInches = convertMToInches(hips);
    } else if (hipsUnit === 'cm') {
      hipsInInches = convertCmToInches(hips);
    } else {
      hipsInInches = convertFtToInches(hips);
    }
  }

  const weightInKg = weightUnit === 'lbs' ? convertLbsToKg(weight) : weight;
  let idealForAge = 0;
  let usMethod: number;
  let massInKg: number;
  let leanMassInKg: number;
  let idealLoss: number;
  let bmi: number;
  let bmiMethod: number;

  const idealForAgeList = (currentGender: Gender, currentAge: number): number => {
    switch (currentGender) {
      case 'male':
        if (currentAge < 20) return 13;
        if (currentAge < 40) return 13.5;
        if (currentAge < 60) return 16;
        if (currentAge < 80) return 18.5;
        return (idealForAge = 20);
      case 'female':
        if (currentAge < 20) return 22;
        if (currentAge < 40) return 26.5;
        if (currentAge < 60) return 28;
        if (currentAge < 80) return 29.5;
        return 30.5;
    }
  };

  const idealPercent = idealForAgeList(gender, age);
  idealForAge = idealPercent;

  switch (gender) {
    case 'male':
      usMethod =
        86.01 * Math.log10(waistInInches - neckInInches) -
        70.041 * Math.log10(heightInInches) +
        36.76;

      massInKg = (usMethod / 100) * weightInKg;
      leanMassInKg = weightInKg - massInKg;

      idealForAge = idealForAgeList(gender, age);
      bmi = weightInKg / heightInMeters ** 2;

      idealLoss = massInKg - (idealPercent / 100) * weightInKg;
      bmiMethod = 1.2 * bmi + 0.23 * age - 10.8 * 1 - 5.4;

      break;
    case 'female':
      if (hipsInInches === undefined) {
        throw new Error('Hips measurement is required for female body fat calculation. Please enter your hip measurement.');
      }
      usMethod =
        163.205 * Math.log10(waistInInches + hipsInInches - neckInInches) -
        97.684 * Math.log10(heightInInches) -
        78.387;

      massInKg = (usMethod / 100) * weightInKg;
      leanMassInKg = weightInKg - massInKg;

      idealForAgeList(gender, age);
      bmi = weightInKg / heightInMeters ** 2;

      idealLoss =
        massInKg -
        (parseFloat(idealForAgeList(gender, age).toFixed(2)) / 100) *
          weightInKg;
      bmiMethod = 1.2 * bmi + 0.23 * age - 10.8 * 0 - 5.4;

      break;
    default:
      throw new Error('Gender must be male or female for this calculation.');
  }

  return {
    results: {
      'Body Fat: U.S. Navy Method': parseFloat(usMethod.toFixed(2)) + '%',
      'Body Fat Mass': parseFloat(massInKg.toFixed(2)) + 'kg',
      'Lean Body Mass': parseFloat(leanMassInKg.toFixed(2)) + 'kg',
      'Lean Body Fat for Given Age': parseFloat(idealForAge.toFixed(2)) + '%',
      'Body Fat Loss to Reach Ideal': parseFloat(idealLoss.toFixed(2)) + '%',
      'Body Fat: BMI Method': parseFloat(bmiMethod.toFixed(2)) + '%',
    },
  };
}

export function getHeartRate(
  age: number,
  restingHeartRate: number,
): string[] {
  // const maxHeartRate = 206.9 - (0.67 * age)
  // let heartRateReserve = maxHeartRate - restingHeartRate;

  // const targetHeartRate = [
  //   parseFloat((heartRateReserve * 0.19) + restingHeartRate).toFixed(0) + " or less",
  //   parseFloat((heartRateReserve * 0.20 + restingHeartRate) + restingHeartRate).toFixed(0) + " - " + parseFloat((heartRateReserve * 0.39 + restingHeartRate) + restingHeartRate).toFixed(0),
  //   parseFloat((heartRateReserve * 0.40 + restingHeartRate) + restingHeartRate).toFixed(0) + " - " + parseFloat((heartRateReserve * 0.59 + restingHeartRate) + restingHeartRate).toFixed(0),
  //   parseFloat((heartRateReserve * 0.60 + restingHeartRate) + restingHeartRate).toFixed(0) + " - " + parseFloat((heartRateReserve * 0.84 + restingHeartRate + restingHeartRate)).toFixed(0),
  //   parseFloat((heartRateReserve * 0.85 + restingHeartRate) + restingHeartRate).toFixed(0) + " - " + parseFloat((heartRateReserve + restingHeartRate)).toFixed(0)
  // ]

  // return targetHeartRate;
  const normalizedAge = Number(age);
  const normalizedRestingHeartRate = Number(restingHeartRate);

  const maxHeartRate = 220 - normalizedAge;
  const heartRateReserve = maxHeartRate - normalizedRestingHeartRate;

  const toInt = (value: number): string => Number(value).toFixed(0);

  return [
    `${toInt(heartRateReserve * 0.19 + normalizedRestingHeartRate)} or less`,
    `${toInt(heartRateReserve * 0.20 + normalizedRestingHeartRate)} - ${toInt(heartRateReserve * 0.39 + normalizedRestingHeartRate)}`,
    `${toInt(heartRateReserve * 0.40 + normalizedRestingHeartRate)} - ${toInt(heartRateReserve * 0.59 + normalizedRestingHeartRate)}`,
    `${toInt(heartRateReserve * 0.60 + normalizedRestingHeartRate)} - ${toInt(heartRateReserve * 0.84 + normalizedRestingHeartRate)}`,
    `${toInt(heartRateReserve * 0.85 + normalizedRestingHeartRate)} - ${toInt(heartRateReserve * 1.00 + normalizedRestingHeartRate)}`,
  ];
}
