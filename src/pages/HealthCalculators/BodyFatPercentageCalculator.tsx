import { useReducer, useRef } from 'react';
import { toast } from 'sonner';
import { getBodyFatPercentage } from '@/services/Calculations';
import { highlightedData } from '@/utilities/CalculatorData';
import Container from '@/components/health-calculators/Container';
import CalculatorContainer from '@/components/health-calculators/CalculatorContainer';
import { CalculatorDetails } from '@/components/health-calculators/CalculatorDetails';
import GenderSelector from '@/components/health-calculators/GenderSelector';
import CalculatorInput from '@/components/health-calculators/CalculatorInput';
import Content from '@/components/health-calculators/Content';
import RowContainer from '@/components/health-calculators/RowContainer';
import Citation from '@/components/Citations';
import type {
  BodyFatResult,
  Gender,
  HeightUnit,
  WeightUnit,
} from '@/types/calculations';

const DEFAULT_BODY_FAT_MEDICAL_INTERPRETATION =
  'Once you calculate your result, this section will provide a general medical interpretation of your body fat percentage. It will explain what your level may mean for your health, including potential benefits or risks, based on established clinical guidelines. Always consult a healthcare provider for personal advice.';
const DEFAULT_BODY_FAT_STATISTICAL_INTERPRETATION =
  "After calculating your body fat percentage, this section will show how your result compares to typical ranges in the general population. It helps you understand where your number falls statistically — whether it's common, rare, or above average — and offers context based on observed health trends.";

interface BodyFatState {
  gender: Gender | '';
  age: string;
  height: string;
  heightUnit: HeightUnit;
  weight: string;
  weightUnit: WeightUnit;
  neck: string;
  waist: string;
  hips: string;
  neckUnit: HeightUnit;
  waistUnit: HeightUnit;
  hipsUnit: HeightUnit;
  results: BodyFatResult | null;
  fatPercentageMedicalInterpretation: string;
  fatPercentageStatisticalInterpretation: string;
}

type BodyFatAction =
  | {
      type: 'set-value';
      field: 'age' | 'height' | 'weight' | 'neck' | 'waist' | 'hips';
      value: string;
    }
  | {
      type: 'set-unit';
      field:
        | 'heightUnit'
        | 'weightUnit'
        | 'neckUnit'
        | 'waistUnit'
        | 'hipsUnit';
      value: HeightUnit | WeightUnit;
    }
  | { type: 'set-gender'; value: Gender | '' }
  | {
      type: 'set-results';
      value: Pick<
        BodyFatState,
        | 'results'
        | 'fatPercentageMedicalInterpretation'
        | 'fatPercentageStatisticalInterpretation'
      >;
    }
  | { type: 'reset' };

const initialState: BodyFatState = {
  gender: '',
  age: '',
  height: '',
  heightUnit: 'cm',
  weight: '',
  weightUnit: 'kg',
  neck: '',
  waist: '',
  hips: '',
  neckUnit: 'cm',
  waistUnit: 'cm',
  hipsUnit: 'cm',
  results: null,
  fatPercentageMedicalInterpretation: DEFAULT_BODY_FAT_MEDICAL_INTERPRETATION,
  fatPercentageStatisticalInterpretation:
    DEFAULT_BODY_FAT_STATISTICAL_INTERPRETATION,
};

function reducer(state: BodyFatState, action: BodyFatAction): BodyFatState {
  switch (action.type) {
    case 'set-value':
      return { ...state, [action.field]: action.value };
    case 'set-unit':
      return { ...state, [action.field]: action.value };
    case 'set-gender':
      return { ...state, gender: action.value };
    case 'set-results':
      return { ...state, ...action.value };
    case 'reset':
      return initialState;
    default:
      return state;
  }
}

export default function BodyFatPercentageCalculator() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const { BodyFatPercentage } = highlightedData;
  const {
    description,
    instructions,
    statisticalInterpretation,
    medicalInterpretation,
  } = BodyFatPercentage;

  const heightUnits = ['cm', 'ft', 'm'];
  const neckUnits = ['cm', 'ft', 'm'];
  const waistUnits = ['cm', 'ft', 'm'];
  const hipsUnits = ['cm', 'ft', 'm'];
  const weightUnits = ['kg', 'lbs'];

  const getBodyFatPercentageCategory = (
    currentGender: Gender,
    bodyFatPercentage: number,
  ): 'Below' | 'Essential' | 'Athletes' | 'Fitness' | 'Average' | 'Obese' => {
    switch (currentGender) {
      case 'female':
      case 'male':
        if (bodyFatPercentage > 69) return 'Obese';
        if (bodyFatPercentage > 44) return 'Average';
        if (bodyFatPercentage > 26) return 'Fitness';
        if (bodyFatPercentage > 10) return 'Athletes';
        if (bodyFatPercentage >= 4) return 'Essential';
        return 'Below';
      default:
        toast.error('Gender must be "male" or "female".');
        return 'Below';
    }
  };

  const getFatPercentageInterpretations = (
    category: 'Below' | 'Essential' | 'Athletes' | 'Fitness' | 'Average' | 'Obese',
  ) => {
    return {
      medical: medicalInterpretation[category] || 'No interpretation available',
      statistical:
        statisticalInterpretation[category] || 'No interpretation available',
    };
  };

  const handleCalculate = () => {
    if (!state.weight || Number(state.weight) <= 0) {
      toast.error('Please enter a valid weight value.');
      return;
    }

    if (!state.gender) {
      toast.error('Please select a gender.');
      return;
    }

    const bodyFatPercentage = getBodyFatPercentage(
      Number(state.age),
      state.gender,
      parseFloat(state.height),
      parseFloat(state.weight),
      parseFloat(state.neck),
      parseFloat(state.waist),
      parseFloat(state.hips),
      state.heightUnit,
      state.weightUnit,
      state.neckUnit,
      state.waistUnit,
      state.hipsUnit,
    );

    const raw = bodyFatPercentage.results['Body Fat: U.S. Navy Method'];
    const category = getBodyFatPercentageCategory(
      state.gender,
      parseFloat(raw),
    );
    const interpretations = getFatPercentageInterpretations(category);

    dispatch({
      type: 'set-results',
      value: {
        results: bodyFatPercentage,
        fatPercentageMedicalInterpretation: interpretations.medical,
        fatPercentageStatisticalInterpretation: interpretations.statistical,
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
  };

  const raw =
    state.results?.results?.['Body Fat: U.S. Navy Method']?.replace('%', '') ||
    '0';
  const rawNum = parseFloat(raw);
  const rawPercent = Math.min(Math.max(rawNum, 0), 100);

  const handleClear = () => {
    dispatch({ type: 'reset' });
  };

  const citations = [
    {
      name: '[1] Hodgdon, J. A., & Beckett, M. B. (1984). Prediction of percent body fat for U.S. Navy men and women from body circumferences and height (Naval Health Research Center Report No. 84-29). Naval Health Research Center. ',
      link: 'https://apps.dtic.mil/sti/citations/ADA143890',
    },
    {
      name: '[2] Lee, B., & Kim, J. Y. (2022). Body fat and risk of all‑cause mortality: A systematic review and dose–response meta‑analysis. Journal of the Academy of Nutrition and Dietetics. Advance online publication. ',
      link: 'https://doi.org/10.1016/j.jand.2022.01.011',
    },
    {
      name: '[3] Lindberg, S. (2025, March 20). Ideal body fat percentage for men and women. Healthline. ',
      link: 'https://www.healthline.com/health/exercise-fitness/ideal-body-fat-percentage',
    },
    {
      name: '[4] Popkin, B. M., D’Anci, K. E., & Rosenberg, I. H. (2010). Water, hydration, and health. Nutrition Reviews, 68(8), 439–458. ',
      link: 'https://doi.org/10.1111/j.1753-4887.2010.00304.x',
    },
  ];

  return (
    <>
      <CalculatorDetails
        name="Body Fat Percentage Calculator"
        details={description}
      />

      <RowContainer>
        <CalculatorContainer
          heading="Body Fat Percentage Calculator"
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
            <CalculatorInput
              label="Waist"
              setUnit={(value) =>
                dispatch({
                  type: 'set-unit',
                  field: 'waistUnit',
                  value: value as HeightUnit,
                })
              }
              unit={state.waistUnit}
              setValue={(value) =>
                dispatch({ type: 'set-value', field: 'waist', value })
              }
              value={state.waist}
              units={waistUnits}
            />
            <CalculatorInput
              label="Neck"
              setUnit={(value) =>
                dispatch({
                  type: 'set-unit',
                  field: 'neckUnit',
                  value: value as HeightUnit,
                })
              }
              unit={state.neckUnit}
              setValue={(value) =>
                dispatch({ type: 'set-value', field: 'neck', value })
              }
              value={state.neck}
              units={neckUnits}
            />
            <CalculatorInput
              label="Hips"
              setUnit={(value) =>
                dispatch({
                  type: 'set-unit',
                  field: 'hipsUnit',
                  value: value as HeightUnit,
                })
              }
              unit={state.hipsUnit}
              setValue={(value) =>
                dispatch({ type: 'set-value', field: 'hips', value })
              }
              value={state.hips}
              units={hipsUnits}
            />
          </div>
        </CalculatorContainer>
        <Container heading="Instructions">
          <ol className="list-decimal text-justify mx-2 mb-3 md:mb-5 font-content text-xs md:text-base">
            {instructions.map((instruction) => (
              <li
                dangerouslySetInnerHTML={{ __html: instruction }}
                key={instruction}
              />
            ))}
          </ol>
        </Container>
      </RowContainer>
      <RowContainer ref={resultsRef}>
        <Container heading="Results">
          <span className="mt-5 font-content text-xs md:text-base text-center font-bold">
            Body Fat: {raw}%
          </span>
          <div className="mt-2 border-b-2 border-primary-blue w-25 self-center" />
          <div className="mt-5 w-[100%] h-16 rounded overflow-hidden flex relative">
            <div className="h-8 shadow-md bg-red-800 w-[4%]" />
            <div className="h-8 shadow-md bg-yellow-400 w-[6%]" />
            <div className="h-8 shadow-md bg-green-400 w-[16%]" />
            <div className="h-8 shadow-md bg-green-600 w-[18%]" />
            <div className="h-8 shadow-md bg-yellow-400 w-[25%]" />
            <div className="h-8 shadow-md bg-red-800 w-[31%]" />
            <span
              style={{ marginLeft: `${rawPercent}%` }}
              className="w-auto mt-6 absolute font-extrabold text-xl text-shadow-black"
            >
              ◣
            </span>
          </div>

          <table className="border-collapse font-content text-xs md:text-base w-full">
            <tbody>
              {state.results?.results &&
                Object.entries(state.results.results).map(([label, value]) => (
                  <tr key={label}>
                    <td className="p-2">{label}</td>
                    <td className="p-2">
                      <span className="ml-10">{value}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="right-0 border-b-2 border-primary-yellow w-25 absolute" />
        </Container>

        <Container heading="Data Reference">
          <div className="mx-2 mb-3 md:mb-5 w-auto font-content text-xs md:text-base">
            <div className="relative grid grid-cols-2 fr gap-3 items-center">
              <span className="text-xs md:text-base font-bold">Percentage</span>
              <span className="text-xs md:text-base font-bold">
                Bar Visualizer
              </span>
              <div className="border-b-2 border-primary-blue w-10 self-center" />
              <div className="border-b-2 border-primary-blue w-10 self-center" />
              <span className="flex text-red-800">
                less than 4% <br /> Below Essential
              </span>
              <div className="h-6 flex shadow-md bg-red-800 w-[4%]" />
              <span className="flex text-yellow-400">
                4% - 10% <br /> Essential
              </span>
              <div className="h-6 shadow-md bg-yellow-400 w-[6%]" />
              <span className="flex text-green-400">
                10% - 26% <br /> Athletes
              </span>
              <div className="h-6 shadow-md bg-green-400 w-[16%]" />
              <span className="flex text-green-600">
                26% - 44% <br /> Fitness
              </span>
              <div className="h-6 shadow-md bg-green-600 w-[18%]" />
              <span className="flex text-yellow-400">
                44% - 69% <br /> Average
              </span>
              <div className="h-6 shadow-md bg-yellow-400 w-[25%]" />
              <span className="flex text-red-800">
                greater than 69% <br /> Obese
              </span>
              <div className="h-6 shadow-md bg-red-800 w-[31%]" />
            </div>
          </div>
        </Container>
      </RowContainer>

      <div className="w-full flex flex-col gap-10 mt-10">
        <Content
          content={state.fatPercentageMedicalInterpretation}
          title="Medical Interpretation"
        />
        <Content
          content={state.fatPercentageStatisticalInterpretation}
          title="Statistical Interpretation"
        />
        <Citation citations={citations} title="References" />
      </div>
    </>
  );
}
