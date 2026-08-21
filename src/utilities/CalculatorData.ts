//get from calculator.net

const keywords = ["Body Mass Index (BMI)", "Basal Metabolic Rate (BMR)", "Ideal Body Weight (IBW)", "Daily Water Intake", "Body Fat Percentage", "Karvonen Heart Rate", "Target Heart Rate",
"weekly physical activity", "waist and neck circumference", "hips and buttocks",
"gender", "age in years", "height in your prefered unit", "weight in your prefered unit", "calculate", "desired formula",
"activity level", "resting heart rate", "Medical and statistical interpretations"
];

function highlightKeywords(text: string, words: readonly string[]): string {
  const escaped = words.map((word) =>
    word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.replace(pattern, "<b>$1</b>");
}

export const CalculatorData = {
  BMI: {
    description:
      'The Body Mass Index (BMI) Calculator estimates whether your weight is appropriate for your height. It uses a simple formula — weight divided by height squared — to classify your body size into categories like underweight, normal, overweight, or obese. BMI is commonly used in public health and clinical settings as a general indicator of potential weight-related health risks. A BMI within the “normal” range is associated with a lower likelihood of chronic conditions such as heart disease, diabetes, and high blood pressure. Higher or lower values may suggest the need for lifestyle changes or further medical evaluation. Although BMI is not a direct measure of body fat or overall health, it is a useful screening tool that can help guide awareness and decisions about physical well-being.', keywords,
    instructions: [
      'Enter your height in your prefered unit (Ft, Cm, M). You can select units by selecting the drop-down icon.',
      'Enter your weight in your prefered unit (kg, lbs).',
      'Click calculate.',
      'Read results below. Medical and statistical interpretations are also viewable. All outputs are for informational use only and not a substitute for professional medical advice.',
    ],
  },
  BMR: {
    description:
      'The Basal Metabolic Rate (BMR) Calculator estimates the number of calories your body needs to maintain basic functions while at rest — such as breathing, circulating blood, and regulating temperature. This is the minimum energy your body requires to stay alive and functioning, even if you were completely inactive all day. BMR is the foundation for calculating total daily calorie needs. When combined with your activity, it helps determine how many calories you need to maintain, lose, or gain weight. Factors like age, sex, weight, and height all influence your BMR, since they affect your body’s energy use. This tool is especially useful for planning nutrition and fitness goals, as it gives you a baseline for understanding how your body burns energy throughout the day.',
    instructions: [
      'Choose your gender (male or female).',
      'Input your age in years.',
      'Enter your height in your prefered unit (Ft, Cm, M). You can select units by selecting the drop-down icon.',
      'Enter your weight in your prefered unit (kg, lbs).',
      "Pick your desired formula (default: Mifflin St Jeor's formula)",
      'Pick your activity level (default: Moderate: exercise 4-5 times/week)',
      'Click calculate.',
      'Read results below. Medical and statistical interpretations are also viewable. All outputs are for informational use only and not a substitute for professional medical advice.',
    ],
  },
  IBW: {
    description:
      'Ideal Body Weight (IBW) is an estimate of what a person should weigh based on height and sex, using medical formulas. It helps provide a reference point for healthy body weight and is often used in clinical settings to guide dosing, nutrition, and risk assessment. IBW does not account for muscle mass or body composition — it’s a general benchmark, not a personal diagnosis. IBW is used in clinical settings as a guideline for medication dosing, ventilator settings, and assessing nutritional needs. It is not a diagnosis, but rather a reference point for estimating healthy physiological function. ',
    instructions: [
      'Choose your gender (male or female).',
      'Enter your age in years (optional).',
      'Enter your height in your prefered unit (Ft, Cm, M). You can select units by selecting the drop-down icon.',
      'Click calculate.',
      'Read results below. Medical and statistical interpretations are also viewable. All outputs are for informational use only and not a substitute for professional medical advice.',
    ],
  },
  WaterIntake: {
    description: 'The Daily Water Intake Calculator estimates a personalized daily water recommendation using age, gender, weight, activity level, and tropical climate exposure. Adult recommendations use weight in pounds and adjust for gender, exercise, and tropical conditions; children receive age-based recommendations. The result is general educational guidance, not a clinical prescription.',
    instructions: [
      'Enter your age in years.',
      'Choose your gender (male or female). Gender is used for ages 14 and older.',
      'Enter your weight in your prefered unit (kg, lbs). You can select units by selecting the drop-down icon.',
      'Choose the option that best describes your typical weekly physical activity. (default: Sedentary (Little to No Exercise))',
      'Choose whether you live in a tropical climate.',
      'Click calculate.',
      'Read results below. Medical and statistical interpretations are also viewable. All outputs are for informational use only and not a substitute for professional medical advice.',
    ],
  },
  BodyFatPercentage: {
  description: 'The Body Fat Percentage Calculator estimates how much of your body weight is made up of fat versus lean mass. By using basic body measurements — including height, weight, waist, neck, and hips (for females) — it applies a recognized formula to provide a reliable estimate of your fat percentage. This tool is useful for understanding body composition beyond what BMI alone can show. While BMI measures weight in relation to height, fat percentage reveals more about your health, fitness, and physical makeup. It helps identify whether you fall into categories such as athletic, average, or at risk for obesity-related conditions. Your result will include both a medical and statistical interpretation, offering insights into what your fat percentage means for your health and how it compares to population norms. This can support informed decisions about fitness, nutrition, and long-term wellness planning.',
  instructions: [
    'Choose your gender (male or female).',
    'Enter your age in years.',
    'Enter your height in your prefered unit (m, cm, ft). You can select units by selecting the drop-down icon.',
    'Enter your weight in your prefered unit (kg, lbs).',
    'Enter your waist and neck circumference in your prefered unit (m, cm, ft).',
    'For females: Measure around the widest part of your hips and buttocks.',
    'Click calculate.',
    'Read results below. Medical and statistical interpretations are also viewable. All outputs are for informational use only and not a substitute for professional medical advice.',
  ],
  statisticalInterpretation: {
    Below:
      'Body fat levels below 4% are extremely rare and typically observed only in elite endurance athletes or individuals with severe metabolic or eating disorders. Statistically, this level is considered an outlier and is not commonly maintained long-term in any general population.',
    Essential:
      'This range represents the minimum level of fat required for survival and basic physiological function. It is rare outside of competitive sports or genetic exceptions and is not statistically representative of the general population.',
    Athletes:
      'This body fat range is most commonly seen among individuals who engage in high levels of physical training. It is statistically less common in the general population but typical in athletic or fitness-focused subgroups.',
    Fitness:
      'This category represents a moderate level of body fat that is statistically common among adults who engage in occasional to regular physical activity. It aligns with average to slightly above-average norms in many health-focused populations.',
    Average:
      'This body fat range exceeds levels generally considered optimal for health and is statistically prevalent in less active or aging populations. It indicates a shift toward higher fat accumulation and potential health risk.',
    Obese:
      'Body fat over 70% is exceptionally rare and substantially higher than population norms. This range reflects extreme levels of adiposity and is associated with statistically significant increases in all-cause morbidity and mortality.'
  },
  medicalInterpretation: {
    Below:
      'Extremely low body fat levels can impair hormone regulation, immune response, and temperature control. Prolonged maintenance of this range may increase the risk of fatigue, infertility, and cardiac or organ dysfunction. Medical supervision is advised if this occurs unintentionally.',
    Essential:
      'This level of body fat is necessary to maintain vital bodily processes such as cushioning of organs, hormone production, and nutrient storage. While medically functional, sustaining this range long-term — especially without athletic supervision — may strain endocrine and metabolic systems.',
    Athletes:
      'This level supports physical performance, strength, and endurance and is considered medically healthy when supported by a balanced diet and regular exercise. It generally indicates strong metabolic and cardiovascular fitness.',
    Fitness:
      'While medically acceptable, individuals in this range may begin to see early signs of fat-related metabolic strain, particularly if visceral fat is elevated. Overall health impact depends on lifestyle, fat distribution, and muscle mass.',
    Average:
      'Higher body fat levels in this range can increase the risk of insulin resistance, elevated cholesterol, joint stress, and other weight-related conditions. Regular physical activity and nutritional counseling may help mitigate these risks.',
    Obese:
      'Excessive body fat in this range significantly raises the likelihood of chronic diseases such as type 2 diabetes, cardiovascular disease, and certain cancers. It may also impair mobility, lung capacity, and mental health. Medical intervention is often recommended to reduce health complications.'
  }
  },
  THR: {
    description:
      'The Karvonen Heart Rate Calculator helps you find your ideal Target Heart Rate (THR) zones for exercise. Unlike simple age-based formulas, it takes into account both your resting rate and maximum rate to give you results of your intended THR. By using the Karvonen formula, the calculator shows training zones from very light to very hard intensity, helping you tailor your workouts to match your fitness goals—whether that’s fat burning, improving endurance, or boosting cardiovascular health. This method is widely recommended in fitness and medical settings for creating safe and effective exercise plans.',
    instructions: [
      'Input your age in years.',
      'Enter your resting heart rate. If you do not know your resting heart rate, you may enter 70. If the resting rate is too high relative to age, it will not produce results.',
      'Click calculate.',
      'Read results below. Medical and statistical interpretations are also viewable. All outputs are for informational use only and not a substitute for professional & medical advice.',
    ],
    statisticalInterpretation: 
      "Target Heart Rate (THR) ranges calculated with the Karvonen method provide structured intensity zones from very light to very hard exercise. Population studies show that most adults achieve improvements in cardiovascular fitness, blood pressure, and overall endurance when training consistently within moderate to hard zones (≈40–85% HRR). Very light activity is statistically common in older adults or beginners, while vigorous activity is more common among trained or athletic individuals. Long-term population data confirm that maintaining activity within these ranges is strongly associated with reduced risk of cardiovascular disease and premature mortality.",

    medicalInterpretation: 
      "The Karvonen formula adjusts training intensity based on both resting and maximum heart rate, providing a more individualized target zone. Medical evidence indicates that exercising within moderate to vigorous zones supports heart health, blood sugar regulation, and weight control, while very light activity may be appropriate for recovery, older adults, or individuals with chronic conditions. Conversely, consistently training above 85% HRR may increase risk of injury, arrhythmia, or overtraining, particularly without medical clearance. These ranges are intended as general guidance; individual health status, medications (e.g., beta-blockers), and physician recommendations should always be considered when applying target heart rate zones."
  },
};

export const highlightedData = {
  BMI: {
    ...CalculatorData.BMI,
    description: highlightKeywords(CalculatorData.BMI.description, keywords),
    instructions: CalculatorData.BMI.instructions.map(instr => highlightKeywords(instr, keywords)),
    statisticalInterpretation: {
      underweight:
        'Individuals in this BMI category make up a small percentage of the adult population. Statistically, underweight status is associated with a higher incidence of frailty, menstrual irregularities, and nutritional deficiencies, particularly in settings of limited food access or chronic illness. Long-term underweight status is also linked with increased risk of all-cause mortality compared to normal-weight peers.',
      normal:
        'This BMI range is the most common among healthy adults globally and is statistically associated with the lowest rates of chronic diseases and premature death. People in this category typically experience fewer complications related to metabolic, cardiovascular, or orthopedic health, though other lifestyle factors play a significant role.',
      overweight:
        'A substantial portion of adults fall into this BMI range. Epidemiological data show that individuals classified as overweight are more likely to develop conditions such as elevated blood pressure, insulin resistance, and lipid abnormalities — especially when combined with a sedentary lifestyle.',
      obese:
        'Obesity is increasingly prevalent worldwide and is strongly correlated with heightened risk of chronic diseases, including heart disease, type 2 diabetes, stroke, and certain cancers. Statistically, individuals in this range have higher healthcare utilization and reduced life expectancy compared to those in lower BMI categories.',
    },
    medicalInterpretation: {
      underweight:
        'Clinically, being underweight may indicate insufficient body fat and muscle mass, which can impair immune function, reduce bone density, and disrupt hormone balance. This condition may be due to malnutrition, eating disorders, hyperthyroidism, or chronic illness. Medical evaluation is often warranted.',
      normal:
        'From a medical perspective, a BMI in the normal range is considered healthy and typically reflects balanced energy intake and expenditure. It is associated with a lower risk of metabolic and cardiovascular conditions. However, it does not guarantee the absence of health risks, as overall well-being depends on diet, physical activity, stress, and other lifestyle habits.',
      overweight:
        'Excess body weight in this range can begin to affect metabolic function, increasing the risk of insulin resistance, joint problems, and fatty liver disease. While not as immediately concerning as obesity, overweight status may still require intervention, particularly if other health risk factors are present.',
      obese:
        'Medically, obesity is classified as a chronic condition characterized by excessive body fat accumulation that negatively impacts health. It contributes to systemic inflammation, hormonal imbalance, and higher risk for diseases like type 2 diabetes, heart disease, and certain cancers. Weight management through lifestyle changes or medical treatment is strongly recommended.',
    },
  },
  BMR: {
    ...CalculatorData.BMR,
    description: highlightKeywords(CalculatorData.BMR.description, keywords),
    instructions: CalculatorData.BMR.instructions.map(instr => highlightKeywords(instr, keywords)),
  },
  IBW: {
    ...CalculatorData.IBW,
    description: highlightKeywords(CalculatorData.IBW.description, keywords),
    instructions: CalculatorData.IBW.instructions.map(instr => highlightKeywords(instr, keywords)),
    statisticalInterpretation: 'Ideal Body Weight (IBW) represents an estimated weight range that has been statistically associated with lower rates of chronic disease and improved long-term survival in population-level studies. It reflects average body weights observed in healthy individuals of the same height and sex. Unlike BMI or body fat percentage, IBW does not use risk-based categories (such as underweight or obese), because it is a reference value — not a measurement of current health status. Its primary purpose is to serve as a comparative baseline, not a diagnostic threshold.',
    medicalInterpretation: 'Medically, Ideal Body Weight is used as a reference point for assessing nutritional status, calculating medication dosages, and estimating caloric needs, particularly in hospitalized or underweight patients. Being significantly below IBW may suggest undernutrition, muscle wasting, or systemic illness, and may increase the risk of weakened immunity, fatigue, or poor wound healing. Weights significantly above IBW may reflect increased fat mass and elevate the risk of metabolic conditions such as type 2 diabetes, cardiovascular disease, and joint strain. However, since IBW does not consider body composition (like muscle mass or fat distribution), it should be interpreted in context with other health indicators.',
  },
  WaterIntake: {
    ...CalculatorData.WaterIntake,
    description: highlightKeywords(CalculatorData.WaterIntake.description, keywords),
    instructions: CalculatorData.WaterIntake.instructions.map(instr => highlightKeywords(instr, keywords)),
    statisticalInterpretation: {
      'age-based':
        'For children, this recommendation is based on age-specific hydration guidance rather than adult comparison ranges. Children may need additional fluids during heat, illness, or physical activity.',
      tropical:
        'This recommendation includes an additional tropical-climate allowance to account for increased fluid loss from heat and humidity. Individual needs may still vary with exertion and sweating.',
      within:
        'This is a personalized adult recommendation based on weight, gender, activity level, and climate. It is a practical starting point, not a strict clinical target.',
    },
    medicalInterpretation: {
      'age-based':
        'Children have different hydration needs from adults. This age-based recommendation is general educational guidance and should be adjusted for heat, illness, exercise, and advice from a healthcare professional.',
      tropical:
        'The tropical-climate adjustment supports fluid replacement in hot and humid conditions. Drink regularly and increase fluids during strenuous activity or heavy sweating; people with medical fluid restrictions should follow clinical advice.',
      within:
        'This adult recommendation supports hydration for normal bodily functions and accounts for weight, gender, activity level, and climate. It is general guidance rather than a clinical prescription.',
    }
  },
  BodyFatPercentage: {
    ...CalculatorData.BodyFatPercentage,
    description: highlightKeywords(CalculatorData.BodyFatPercentage.description, keywords),
    instructions: CalculatorData.BodyFatPercentage.instructions.map(instr => highlightKeywords(instr, keywords)),
    statisticalInterpretation: {
      Below:
        'Body fat levels below 4% are extremely rare and typically observed only in elite endurance athletes or individuals with severe metabolic or eating disorders. Statistically, this level is considered an outlier and is not commonly maintained long-term in any general population.',
      Essential:
        'This range represents the minimum level of fat required for survival and basic physiological function. It is rare outside of competitive sports or genetic exceptions and is not statistically representative of the general population.',
      Athletes:
        'This body fat range is most commonly seen among individuals who engage in high levels of physical training. It is statistically less common in the general population but typical in athletic or fitness-focused subgroups.',
      Fitness:
        'This category represents a moderate level of body fat that is statistically common among adults who engage in occasional to regular physical activity. It aligns with average to slightly above-average norms in many health-focused populations.',
      Average:
        'This body fat range exceeds levels generally considered optimal for health and is statistically prevalent in less active or aging populations. It indicates a shift toward higher fat accumulation and potential health risk.',
      Obese:
        'Body fat over 70% is exceptionally rare and substantially higher than population norms. This range reflects extreme levels of adiposity and is associated with statistically significant increases in all-cause morbidity and mortality.'
    },
    medicalInterpretation: {
      Below:
        'Extremely low body fat levels can impair hormone regulation, immune response, and temperature control. Prolonged maintenance of this range may increase the risk of fatigue, infertility, and cardiac or organ dysfunction. Medical supervision is advised if this occurs unintentionally.',
      Essential:
        'This level of body fat is necessary to maintain vital bodily processes such as cushioning of organs, hormone production, and nutrient storage. While medically functional, sustaining this range long-term — especially without athletic supervision — may strain endocrine and metabolic systems.',
      Athletes:
        'This level supports physical performance, strength, and endurance and is considered medically healthy when supported by a balanced diet and regular exercise. It generally indicates strong metabolic and cardiovascular fitness.',
      Fitness:
        'While medically acceptable, individuals in this range may begin to see early signs of fat-related metabolic strain, particularly if visceral fat is elevated. Overall health impact depends on lifestyle, fat distribution, and muscle mass.',
      Average:
        'Higher body fat levels in this range can increase the risk of insulin resistance, elevated cholesterol, joint stress, and other weight-related conditions. Regular physical activity and nutritional counseling may help mitigate these risks.',
      Obese:
        'Excessive body fat in this range significantly raises the likelihood of chronic diseases such as type 2 diabetes, cardiovascular disease, and certain cancers. It may also impair mobility, lung capacity, and mental health. Medical intervention is often recommended to reduce health complications.'
    }
  },
  THR: {
    ...CalculatorData.THR,
    description: highlightKeywords(CalculatorData.THR.description, keywords),
    instructions: CalculatorData.THR.instructions.map(instr => highlightKeywords(instr, keywords)),
  }
};
