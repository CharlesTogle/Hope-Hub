import { ActivityIcon } from 'lucide-react';

const convertLbsToKg = number => number * 0.4536;
const convertKgToLbs = number => number / 0.4536;
const convertFtToM = number => number * 0.3048;
const convertMToFt = number => number / 0.3048;
const convertCmToM = number => number / 100;
const convertCmToFt = number => number / 30.48;
const convertCmToInches = number => number / 2.54;
const convertMToInches = number => number * 39.3701;
const convertFtToInches = number => number * 12;
const convertInchesToM = number => number * 0.0254;

export const getBMI = (height, weight, heightUnit, weightUnit) => {
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
};

export const getBMR = (
  gender,
  age,
  height,
  weight,
  formulaVariant,
  bodyFat,
  heightUnit = 'cm', // default to cm
  weightUnit = 'kg', // default to kg
) => {
  if (!gender) {
    throw new Error('Gender is unknown');
  }
  gender = gender.toLowerCase();

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

    case 'Katch-Mcardle':
      if (bodyFat == null) {
        throw new Error(
          'Body fat percentage is required for Katch-McArdle formula',
        );
      }
      bmr = 370 + 21.6 * (1 - bodyFat) * weightInKg;
      break;

    default:
      throw new Error(`Unknown formula variant: ${formulaVariant}`);
  }

  const caloriesByActivity = {};
  for (const [level, multiplier] of Object.entries(activityMultipliers)) {
    caloriesByActivity[level] = Math.round(parseFloat(bmr * multiplier));
  }

  return {
    BMR: parseFloat(bmr.toFixed(2)),
    DailyCalories: caloriesByActivity,
  };
};

export const getCalorieGoals = (bmr, activityLevel) => {
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
};

export const getTDEE = (
  gender,
  age,
  height,
  weight,
  activityType,
  heightUnit = 'cm', // default to cm
  weightUnit = 'kg', // default to kg
) => {
  if (!gender) {
    throw new Error('Gender is unknown');
  }
  gender = gender.toLowerCase();

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
      throw new Error(`Unknown formula variant: ${formulaVariant}`);
  }

  const caloriesByActivity = {};
  for (const [level, multiplier] of Object.entries(activityMultipliers)) {
    caloriesByActivity[level] = Math.round(parseFloat(tdee * multiplier));
  }

  return {
    TDEE: parseFloat(tdee.toFixed(2)),
    DailyCalories: caloriesByActivity,
  };
};

export const getIBW = (height, heightUnit, gender) => {
  // convert height to inches/feet
  let heightInInches;
  if (heightUnit === 'm') {
    heightInInches = convertMToInches(height);
  } else if (heightUnit === 'cm') {
    heightInInches = convertCmToInches(height);
  } else {
    heightInInches = convertFtToInches(height);
  }

  const normalizedGender = gender.toLowerCase();

  let Robinson, Miller, Devine, Hamwi;
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
};

export const getWaterIntake = (weight, activityLevel, weightUnit) => {
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
      throw new Error(`Unknown formula variant.`);
  }

  return parseFloat(waterIntake.toFixed(2));
};

export const getBodyFatPercentage = (
  age,
  gender,
  height,
  weight,
  neck,
  waist,
  hips,
  heightUnit,
  weightUnit,
  neckUnit,
  waistUnit,
  hipsUnit,
) => {
  let neckInInches, waistInInches, hipsInInches;
  let heightInInches, heightInMeters;
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
  let idealForAge, usMethod, massInKg, leanMassInKg, idealLoss, bmi, bmiMethod;

  const idealForAgeList = (gender, age) => {
    switch (gender) {
      case 'male':
        if (age < 20) return (idealForAge = 13);
        if (age < 40) return (idealForAge = 13.5);
        if (age < 60) return (idealForAge = 16);
        if (age < 80) return (idealForAge = 18.5);
        return (idealForAge = 20);
      case 'female':
        if (age < 20) return (idealForAge = 22);
        if (age < 40) return (idealForAge = 26.5);
        if (age < 60) return (idealForAge = 28);
        if (age < 80) return (idealForAge = 29.5);
        return (idealForAge = 30.5);
    }
  };

  const idealPercent = parseFloat(idealForAgeList(gender, age));

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
      throw new Error("Gender must be 'male' or 'female'.");
      break;
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
};

export const getHeartRate = (
  age,
  restingHeartRate,
) => {
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
  age = Number(age);
  restingHeartRate = Number(restingHeartRate)

  const maxHeartRate = 220 - age;
  const heartRateReserve = maxHeartRate - restingHeartRate;

  const toInt = (num) => Number(num).toFixed(0);

  return [
    `${toInt(heartRateReserve * 0.19 + restingHeartRate)} or less`, // Very Light: ≤19%
    `${toInt(heartRateReserve * 0.20 + restingHeartRate)} - ${toInt(heartRateReserve * 0.39 + restingHeartRate)}`, // Light: 20–39%
    `${toInt(heartRateReserve * 0.40 + restingHeartRate)} - ${toInt(heartRateReserve * 0.59 + restingHeartRate)}`, // Moderate: 40–59%
    `${toInt(heartRateReserve * 0.60 + restingHeartRate)} - ${toInt(heartRateReserve * 0.84 + restingHeartRate)}`, // Hard: 60–84%
    `${toInt(heartRateReserve * 0.85 + restingHeartRate)} - ${toInt(heartRateReserve * 1.00 + restingHeartRate)}`, // Very Hard: 85–100%
  ];

};