import { getBMR, getCalorieGoals } from '@/services/Calculations';
import { CalculatorData, highlightedData } from '@/utilities/CalculatorData';
import Container from '@/components/health-calculators/Container';
import CalculatorContainer from '@/components/health-calculators/CalculatorContainer';
import { CalculatorDetails } from '@/components/health-calculators/CalculatorDetails';
import GenderSelector from '@/components/health-calculators/GenderSelector';
import { useState, useRef } from 'react';
import CalculatorInput from '@/components/health-calculators/CalculatorInput';
import Content from '@/components/health-calculators/Content';
import RadioButton from '@/components/health-calculators/RadioButtons';
import RowContainer from '@/components/health-calculators/RowContainer';
import ResultGroup from '@/components/health-calculators/ResultGroup';
import { useCallback } from 'react';
import useMobile from '@/hooks/useMobile';
import Citation from '@/components/Citations';

export default function BMRCalculator () {
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('0');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [height, setHeight] = useState('0');
  const [weight, setWeight] = useState('0');
  const [formulaVariant, setFormulaVariant] = useState('Mifflin St Jeor');
  const [bodyFat, setBodyFat] = useState(20);
  const [bmrResult, setBmrResult] = useState(0);
  const [maintainingCalories, setMaintainingCalories] = useState(0);
  const [activityLevel, setActivityLevel] = useState(
    'Moderate: exercise 4-5 times/week',
  );
  const [weightGain, setWeightGain] = useState({
    'Mantain Weight': 0.0,
    'Mild Weight Loss': 0.0,
    'Weight Loss': 0.0,
    'Extreme Weight Loss': 0.0,
  });

  const [weightLoss, setWeightLoss] = useState({
    'Mild Weight Loss': 0.0,
    'Weight Loss': 0.0,
    'Extreme Weight Loss': 0.0,
  });

  // Activity level states
  const [sedentaryLevel, setSedentaryLevel] = useState(1.2);
  const [lightActiveLevel, setLightActiveLevel] = useState(1.375);
  const [moderateActiveLevel, setModerateActiveLevel] = useState(1.55);
  const [veryActiveLevel, setVeryActiveLevel] = useState(1.725);
  const [extremelyActiveLevel, setExtremelyActiveLevel] = useState(1.9);
  const [superActiveLevel, setSuperActiveLevel] = useState(2.0);

  const resultsRef = useRef(null);
  const isMobile = useMobile();

  const { BMR } = highlightedData;
  const { description, instructions } = BMR;
  const formulaVariants = [
    'Mifflin St Jeor',
    'Revised Harris-Benedict',
    'Katch-McArdle',
  ];

  const activityLevels = [
    { label: 'Sedentary: little or no exercise', value: sedentaryLevel },
    { label: 'Exercise 1-3 times/week', value: lightActiveLevel },
    { label: 'Exercise 4-5 times/week', value: moderateActiveLevel },
    {
      label: 'Daily exercise or intense exercise 3-4 times/week',
      value: veryActiveLevel,
    },
    { label: 'Intense exercise 6-7 times/week', value: extremelyActiveLevel },
    {
      label: 'Very intense exercise daily, or physical job',
      value: superActiveLevel,
    },
  ];

  const heightUnits = ['cm', 'ft', 'm'];
  const weightUnits = ['kg', 'lbs'];

  const handleCalculate = useCallback(() => {
    if (!height || !weight || height <= 0 || weight <= 0) {
      alert('Please enter valid height and weight values');
      return;
    }

    let bmr;
    try {
      bmr = getBMR(
        gender,
        age,
        height,
        weight,
        formulaVariant,
        bodyFat,
        heightUnit,
        weightUnit,
      );
    } catch (e) {
      alert(e);
      return;
    }

    const { BMR, DailyCalories } = bmr;
    //FOR CALORIE GOALS
    let calorieGoals;
    try {
      calorieGoals = getCalorieGoals(BMR, activityLevel);
    } catch (e) {
      alert(e);
      return;
    }

    setSedentaryLevel(DailyCalories.sedentary);
    setLightActiveLevel(DailyCalories['lightly active']);
    setModerateActiveLevel(DailyCalories['moderately active']);
    setVeryActiveLevel(DailyCalories['very active']);
    setExtremelyActiveLevel(DailyCalories['extra active']);
    setSuperActiveLevel(DailyCalories['super active']);
    setBmrResult(BMR);
    setWeightGain(calorieGoals.weightGain);
    setWeightLoss(calorieGoals.weightLoss);
    setMaintainingCalories(calorieGoals.weightGain['Maintain Weight']);

    // Scroll to results on mobile after successful calculation
    if (resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [height, weight, age, gender, isMobile]);

  const handleClear = useCallback(() => {
    setGender('');
    setAge('');
    setHeight('');
    setWeight('');
    setBodyFat(20);
    setFormulaVariant('Mifflin St Jeor');
  }, []);

  const activityVariant = [
    'Sedentary: little or no exercise',
    'Light: exercise 1-3 times/week',
    'Moderate: exercise 4-5 times/week',
    'Active: daily exercise or intense exercise 3-4 times/week',
    'Very Active: intense exercise 6-7 times/week',
    'Extra Active: very intense exercise daily, or physical job',
  ];

  const citations = [
    {
      name: '[1] Food and Agriculture Organization, World Health Organization, & United Nations University. (2001). Human energy requirements: Report of a joint FAO/WHO/UNU expert consultation (FAO Food and Nutrition Technical Report Series No. 1). FAO. ',
      link: 'https://www.fao.org/3/y5686e/y5686e00.htm',
    },
    {
      name: '[2] Harris, J. A., & Benedict, F. G. (1919). A biometric study of human basal metabolism. Carnegie Institution of Washington. ',
      link: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1091498/',
    },
    {
      name: '[3] Mifflin, M. D., St Jeor, S. T., Hill, L. A., Scott, B. J., Daugherty, S. A., & Koh, Y. O. (1990). A new predictive equation for resting energy expenditure in healthy individuals. The American Journal of Clinical Nutrition, 51(2), 241–247. ',
      link: 'https://doi.org/10.1093/ajcn/51.2.241',
    },
  ];

  return (
    <>
      <CalculatorDetails
        name='Basal Metabolic Rate Calculator'
        details={description}
      />
      <RowContainer>
        <CalculatorContainer
          heading='Basal Metabolic Rate (BMR) Calculator'
          onCalculate={handleCalculate}
          onClear={handleClear}
        >
          <div className='flex flex-col gap-3'>
            <GenderSelector gender={gender} setGender={setGender} />
            <CalculatorInput label='Age' value={age} setValue={setAge} />
            <CalculatorInput
              label='Height'
              setUnit={setHeightUnit}
              unit={heightUnit}
              setValue={setHeight}
              value={height}
              units={heightUnits}
            />
            <CalculatorInput
              label='Weight'
              setUnit={setWeightUnit}
              unit={weightUnit}
              setValue={setWeight}
              value={weight}
              units={weightUnits}
            />
            <div className='z-3 bg-white relative'>
              <RadioButton
                choices={formulaVariants}
                name='formula-variants'
                value={formulaVariant}
                setValue={setFormulaVariant}
                text='BMR Estimation Formula'
                showBodyFat={true}
                bodyFatValue={bodyFat}
                onBodyFatChange={e => setBodyFat(e.target.value)}
              />
            </div>
            <div className='z-3 bg-white relative'>
              <RadioButton
                choices={activityVariant}
                name='activity-variants'
                value={activityLevel}
                setValue={setActivityLevel}
                text='Activity Level'
                showBodyFat={false}
              />
            </div>
          </div>
        </CalculatorContainer>{' '}
        <Container heading='Instructions'>
          <ol className='list-decimal font-content mx-2 mb-3 md:mb-5 text-xs md:text-basetext-xs md:text-base text-justify'>
            {instructions.map((instruction, index) => (
              <li
                dangerouslySetInnerHTML={{ __html: instruction }}
                key={`Instruction ${index}`}
              />
            ))}
          </ol>
        </Container>
      </RowContainer>
      <RowContainer ref={resultsRef}>
        <ResultGroup
          variant='weight-gain'
          maintainingCalories={maintainingCalories}
          result={weightGain}
        />
        <ResultGroup
          variant='weight-loss'
          maintainingCalories={maintainingCalories}
          result={weightLoss}
        />
      </RowContainer>
      <RowContainer>
        <Container heading='Results'>
          <p className='font-content w-full text-xs md:text-base text-center'>
            BMR ={' '}
            <span className='font-bold'>{bmrResult.toLocaleString()}</span>{' '}
            Calories / day
          </p>
        </Container>{' '}
        <Container heading='BMR Caloric Levels'>
          <table className='w-auto mx-2 mb-3 md:mb-5 border-collapse'>
            <thead>
              <tr className='border-b-2 border-primary-yellow'>
                <th className='pb-2 text-left font-content font-semibold text-xs md:text-base'>
                  Activity Level
                </th>
                <th className='text-center font-content font-semibold text-xs md:text-base'>
                  Multiplier
                </th>
              </tr>
            </thead>
            <tbody>
              {activityLevels.map((level, index) => (
                <tr key={index}>
                  <td className='py-2 pr-2 text-xs md:text-base font-content text-b border-r-2 border-primary-yellow'>
                    {level.label}
                  </td>
                  <td className='text-xs md:text-base text-center'>
                    <span className='font-medium text-primary-blue'>
                      {level.value}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </RowContainer>
      <div className='w-full flex flex-col gap-10 mt-10'>
        <Content
          content='Your Basal Metabolic Rate (BMR) represents the number of calories your body requires at rest to support vital functions like breathing, circulation, and cell production. It is a foundational measure used in nutrition and medical settings to estimate your total energy needs. Because BMR is highly individualized — depending on your sex, age, weight, and height — there are no universal “healthy” or “unhealthy” categories. A higher or lower BMR is not inherently better or worse; it simply reflects how your body burns energy at rest. This value is most useful when planning diets, medical treatments, or fitness goals tailored to your unique physiology.'
          title='Medical Interpretation'
        />
        <Content
          content='Statistically, BMR varies widely across the population and is influenced by biological and lifestyle factors. For example, younger individuals, males, and those with more muscle mass tend to have higher BMRs, while older adults or individuals with less lean mass typically have lower rates. There are no standard classification ranges (such as “low” or “high”) for BMR, since calorie requirements are personal and context-specific. Instead, your result should be viewed as a baseline estimate of how much energy your body needs before accounting for physical activity. When combined with your activity level, it helps determine your Total Daily Energy Expenditure (TDEE).'
          title='Statistical Interpretation'
        />
        <Citation citations={citations} title='References' />
      </div>
    </>
  );
}
