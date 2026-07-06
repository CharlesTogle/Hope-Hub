import { useCallback, useReducer, useRef } from 'react';
import { renderHtml } from '@/utilities/render-html';
import { toast } from 'sonner';
import { getBMR, getCalorieGoals } from '@/services/Calculations';
import { highlightedData } from '@/utilities/CalculatorData';
import Container from '@/components/health-calculators/Container';
import CalculatorContainer from '@/components/health-calculators/CalculatorContainer';
import { CalculatorDetails } from '@/components/health-calculators/CalculatorDetails';
import GenderSelector from '@/components/health-calculators/GenderSelector';
import CalculatorInput from '@/components/health-calculators/CalculatorInput';
import Content from '@/components/health-calculators/Content';
import RadioButton from '@/components/health-calculators/RadioButtons';
import RowContainer from '@/components/health-calculators/RowContainer';
import ResultGroup from '@/components/health-calculators/ResultGroup';
import Citation from '@/components/Citations';
import type {
  BMRActivityLevel,
  BMRFormula,
  BMRResult,
  CalorieGoalsResult,
  Gender,
  HeightUnit,
  WeightUnit,
} from '@/types/calculations';

interface BMRState {
  gender: Gender | '';
  age: string;
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
  height: string;
  weight: string;
  formulaVariant: BMRFormula;
  bodyFat: number;
  bmrResult: number;
  maintainingCalories: number;
  activityLevel: BMRActivityLevel;
  weightGain: CalorieGoalsResult['weightGain'];
  weightLoss: CalorieGoalsResult['weightLoss'];
  activityLevelValues: BMRResult['DailyCalories'];
}

type BMRAction =
  | { type: 'set-value'; field: 'age' | 'height' | 'weight'; value: string }
  | {
      type: 'set-unit';
      field: 'heightUnit' | 'weightUnit';
      value: HeightUnit | WeightUnit;
    }
  | { type: 'set-gender'; value: Gender | '' }
  | { type: 'set-formula'; value: BMRFormula }
  | { type: 'set-body-fat'; value: number }
  | { type: 'set-activity-level'; value: BMRActivityLevel }
  | {
      type: 'set-results';
      value: Pick<
        BMRState,
        | 'bmrResult'
        | 'maintainingCalories'
        | 'weightGain'
        | 'weightLoss'
        | 'activityLevelValues'
      >;
    }
  | { type: 'reset-form' };

const initialWeightGain: CalorieGoalsResult['weightGain'] = {
  'Maintain Weight': 0,
  'Mild Weight Gain': 0,
  'Weight Gain': 0,
  'Extreme Weight Gain': 0,
};

const initialWeightLoss: CalorieGoalsResult['weightLoss'] = {
  'Mild Weight Loss': 0,
  'Weight Loss': 0,
  'Extreme Weight Loss': 0,
};

const initialActivityLevelValues: BMRResult['DailyCalories'] = {
  sedentary: 1.2,
  'lightly active': 1.375,
  'moderately active': 1.55,
  'very active': 1.725,
  'extra active': 1.9,
  'super active': 2.0,
};

const initialState: BMRState = {
  gender: '',
  age: '0',
  heightUnit: 'cm',
  weightUnit: 'kg',
  height: '0',
  weight: '0',
  formulaVariant: 'Mifflin St Jeor',
  bodyFat: 20,
  bmrResult: 0,
  maintainingCalories: 0,
  activityLevel: 'Moderate: exercise 4-5 times/week',
  weightGain: initialWeightGain,
  weightLoss: initialWeightLoss,
  activityLevelValues: initialActivityLevelValues,
};

function reducer(state: BMRState, action: BMRAction): BMRState {
  switch (action.type) {
    case 'set-value':
      return { ...state, [action.field]: action.value };
    case 'set-unit':
      return { ...state, [action.field]: action.value };
    case 'set-gender':
      return { ...state, gender: action.value };
    case 'set-formula':
      return { ...state, formulaVariant: action.value };
    case 'set-body-fat':
      return { ...state, bodyFat: action.value };
    case 'set-activity-level':
      return { ...state, activityLevel: action.value };
    case 'set-results':
      return { ...state, ...action.value };
    case 'reset-form':
      return {
        ...state,
        gender: '',
        age: '',
        height: '',
        weight: '',
        bodyFat: 20,
        formulaVariant: 'Mifflin St Jeor',
      };
    default:
      return state;
  }
}

export default function BMRCalculator() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const { BMR } = highlightedData;
  const { description, instructions } = BMR;
  const formulaVariants = [
    'Mifflin St Jeor',
    'Revised Harris-Benedict',
    'Katch-McArdle',
  ];

  const activityLevels = [
    {
      label: 'Sedentary: little or no exercise',
      value: state.activityLevelValues.sedentary,
    },
    {
      label: 'Exercise 1-3 times/week',
      value: state.activityLevelValues['lightly active'],
    },
    {
      label: 'Exercise 4-5 times/week',
      value: state.activityLevelValues['moderately active'],
    },
    {
      label: 'Daily exercise or intense exercise 3-4 times/week',
      value: state.activityLevelValues['very active'],
    },
    {
      label: 'Intense exercise 6-7 times/week',
      value: state.activityLevelValues['extra active'],
    },
    {
      label: 'Very intense exercise daily, or physical job',
      value: state.activityLevelValues['super active'],
    },
  ];

  const heightUnits = ['cm', 'ft', 'm'];
  const weightUnits = ['kg', 'lbs'];

  const handleCalculate = useCallback(() => {
    if (
      !state.height ||
      !state.weight ||
      Number(state.height) <= 0 ||
      Number(state.weight) <= 0
    ) {
      toast.error('Please enter valid height and weight values');
      return;
    }

    if (!state.gender) {
      toast.error('Please select a gender');
      return;
    }

    let bmr;
    try {
      bmr = getBMR(
        state.gender,
        Number(state.age),
        Number(state.height),
        Number(state.weight),
        state.formulaVariant,
        state.bodyFat,
        state.heightUnit,
        state.weightUnit,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Calculation failed');
      return;
    }

    const { BMR, DailyCalories } = bmr;

    let calorieGoals;
    try {
      calorieGoals = getCalorieGoals(BMR, state.activityLevel);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Calculation failed');
      return;
    }

    dispatch({
      type: 'set-results',
      value: {
        activityLevelValues: DailyCalories,
        bmrResult: BMR,
        weightGain: calorieGoals.weightGain,
        weightLoss: calorieGoals.weightLoss,
        maintainingCalories: calorieGoals.weightGain['Maintain Weight'],
      },
    });

    if (resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [state]);

  const handleClear = useCallback(() => {
    dispatch({ type: 'reset-form' });
  }, []);

  const activityVariant: BMRActivityLevel[] = [
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
        name="Basal Metabolic Rate Calculator"
        details={description}
      />
      <RowContainer>
        <CalculatorContainer
          heading="Basal Metabolic Rate (BMR) Calculator"
          onCalculate={handleCalculate}
          onClear={handleClear}
        >
          <div className="flex flex-col gap-3">
            <GenderSelector
              gender={state.gender}
              setGender={(value) => dispatch({ type: 'set-gender', value })}
            />
            <CalculatorInput
              label="Age"
              value={state.age}
              setValue={(value) =>
                dispatch({ type: 'set-value', field: 'age', value })
              }
            />
            <CalculatorInput
              label="Height"
              setUnit={(value) =>
                dispatch({
                  type: 'set-unit',
                  field: 'heightUnit',
                  value: value as HeightUnit,
                })
              }
              unit={state.heightUnit}
              setValue={(value) =>
                dispatch({ type: 'set-value', field: 'height', value })
              }
              value={state.height}
              units={heightUnits}
            />
            <CalculatorInput
              label="Weight"
              setUnit={(value) =>
                dispatch({
                  type: 'set-unit',
                  field: 'weightUnit',
                  value: value as WeightUnit,
                })
              }
              unit={state.weightUnit}
              setValue={(value) =>
                dispatch({ type: 'set-value', field: 'weight', value })
              }
              value={state.weight}
              units={weightUnits}
            />
            <div className="z-3 bg-white relative">
              <RadioButton
                choices={formulaVariants}
                name="formula-variants"
                value={state.formulaVariant}
                setValue={(value) =>
                  dispatch({
                    type: 'set-formula',
                    value: value as BMRFormula,
                  })
                }
                text="BMR Estimation Formula"
                showBodyFat={true}
                bodyFatValue={state.bodyFat}
                onBodyFatChange={(event) =>
                  dispatch({
                    type: 'set-body-fat',
                    value: Number(event.target.value),
                  })
                }
              />
            </div>
            <div className="z-3 bg-white relative">
              <RadioButton
                choices={activityVariant}
                name="activity-variants"
                value={state.activityLevel}
                setValue={(value) =>
                  dispatch({
                    type: 'set-activity-level',
                    value: value as BMRActivityLevel,
                  })
                }
                text="Activity Level"
                showBodyFat={false}
              />
            </div>
          </div>
        </CalculatorContainer>
        <Container heading="Instructions">
          <ol className="list-decimal font-content mx-2 mb-3 md:mb-5 text-xs md:text-basetext-xs md:text-base text-justify">
            {instructions.map((instruction) => (
              <li key={instruction}>
                {renderHtml(instruction)}
              </li>
            ))}
          </ol>
        </Container>
      </RowContainer>
      <RowContainer ref={resultsRef}>
        <ResultGroup
          variant="weight-gain"
          maintainingCalories={state.maintainingCalories}
          result={state.weightGain}
        />
        <ResultGroup
          variant="weight-loss"
          maintainingCalories={state.maintainingCalories}
          result={state.weightLoss}
        />
      </RowContainer>
      <RowContainer>
        <Container heading="Results">
          <p className="font-content w-full text-xs md:text-base text-center">
            BMR ={' '}
            <span className="font-bold">
              {state.bmrResult.toLocaleString()}
            </span>{' '}
            Calories / day
          </p>
        </Container>
        <Container heading="BMR Caloric Levels">
          <table className="w-auto mx-2 mb-3 md:mb-5 border-collapse">
            <thead>
              <tr className="border-b-2 border-primary-yellow">
                <th className="pb-2 text-left font-content font-semibold text-xs md:text-base">
                  Activity Level
                </th>
                <th className="text-center font-content font-semibold text-xs md:text-base">
                  Multiplier
                </th>
              </tr>
            </thead>
            <tbody>
              {activityLevels.map((level) => (
                <tr key={level.label}>
                  <td className="py-2 pr-2 text-xs md:text-base font-content text-b border-r-2 border-primary-yellow">
                    {level.label}
                  </td>
                  <td className="text-xs md:text-base text-center">
                    <span className="font-medium text-primary-blue">
                      {level.value}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </RowContainer>
      <div className="w-full flex flex-col gap-10 mt-10">
        <Content
          content='Your Basal Metabolic Rate (BMR) represents the number of calories your body requires at rest to support vital functions like breathing, circulation, and cell production. It is a foundational measure used in nutrition and medical settings to estimate your total energy needs. Because BMR is highly individualized — depending on your sex, age, weight, and height — there are no universal “healthy” or “unhealthy” categories. A higher or lower BMR is not inherently better or worse; it simply reflects how your body burns energy at rest. This value is most useful when planning diets, medical treatments, or fitness goals tailored to your unique physiology.'
          title="Medical Interpretation"
        />
        <Content
          content='Statistically, BMR varies widely across the population and is influenced by biological and lifestyle factors. For example, younger individuals, males, and those with more muscle mass tend to have higher BMRs, while older adults or individuals with less lean mass typically have lower rates. There are no standard classification ranges (such as “low” or “high”) for BMR, since calorie requirements are personal and context-specific. Instead, your result should be viewed as a baseline estimate of how much energy your body needs before accounting for physical activity. When combined with your activity level, it helps determine your Total Daily Energy Expenditure (TDEE).'
          title="Statistical Interpretation"
        />
        <Citation citations={citations} title="References" />
      </div>
    </>
  );
}
