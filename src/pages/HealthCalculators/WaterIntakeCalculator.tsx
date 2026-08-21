import { getWaterIntake } from '@/services/Calculations';
import { renderHtml } from '@/utilities/render-html';
import { highlightedData } from '@/utilities/CalculatorData';
import Container from '@/components/health-calculators/Container';
import CalculatorContainer from '@/components/health-calculators/CalculatorContainer';
import { CalculatorDetails } from '@/components/health-calculators/CalculatorDetails';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import CalculatorInput from '@/components/health-calculators/CalculatorInput';
import Content from '@/components/health-calculators/Content';
import RowContainer from '@/components/health-calculators/RowContainer';
import RadioButton from '@/components/health-calculators/RadioButtons';
import GenderSelector from '@/components/health-calculators/GenderSelector';
import Citation from '@/components/Citations';
import type { Gender, WaterIntakeActivityLevel, WeightUnit } from '@/types/calculations';
import {
  getWaterIntakeCategory,
  isValidWaterIntakeNumber,
} from '@/utilities/water-intake';

export default function WaterIntakeCalculator () {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [isTropical, setIsTropical] = useState('No');
  const [activityLevel, setActivityLevel] = useState<WaterIntakeActivityLevel>(
    'Sedentary (Little to No Exercise)',
  );
  const [intakeResult, setIntakeResult] = useState('');
  const [intakeMedicalInterpretation, setIntakeMedicalInterpretation] =
    useState(
      'After calculating your daily water needs, this section will provide a general medical interpretation of your result. It will explain how your hydration level may affect bodily functions, such as energy, digestion, and circulation. This is intended as educational guidance and not a clinical diagnosis.',
    );
  const [intakeStatisticalInterpretation, setIntakeStatisticalInterpretation] =
    useState(
       'Once your result is calculated, this section will explain how the recommendation reflects your age, gender, weight, activity level, and tropical climate setting.',
    );

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const { WaterIntake } = highlightedData;
  const { description, instructions, statisticalInterpretation, medicalInterpretation } = WaterIntake;
  const weightUnits = ['kg', 'lbs'];

  const formatIntake = (intake: string) => {
    if (!intake) return [];

    const values = intake
      .replace(' oz', '')
      .split('-')
      .map(Number);
    const formatRange = (unit: (ounces: number) => number | string) =>
      values.length === 2
        ? `${unit(values[0])}-${unit(values[1])}`
        : unit(values[0]);

    return [
      { label: 'Ounces', value: intake },
      { label: 'Milliliters', value: `${formatRange(ounces => Math.round(ounces * 29.5735))} ml` },
      { label: 'Cups', value: `${formatRange(ounces => Math.round(ounces / 8))}` },
    ];
  };

  const getWaterIntakeInterpretations = (category: string) => {
    return {
      medical: medicalInterpretation[category as keyof typeof medicalInterpretation] || 'No interpretation available',
      statistical: statisticalInterpretation[category as keyof typeof statisticalInterpretation] || 'No interpretation available',
    };
  };

  const handleCalculate = () => {
    const weightValue = Number(weight);
    const ageValue = Number(age);

    if (!isValidWaterIntakeNumber(weight, Number.MIN_VALUE)) {
      toast.error('Please enter a valid weight value.');
      return;
    }
    if (!age.trim() || !isValidWaterIntakeNumber(age, 0)) {
      toast.error('Please enter a valid age.');
      return;
    }
    if (ageValue >= 14 && !gender) {
      toast.error('Please select a gender.');
      return;
    }

    const waterIntake = getWaterIntake(
      weightValue,
      ageValue,
      gender,
      activityLevel,
      weightUnit,
      isTropical === 'Yes',
    );

    setIntakeResult(waterIntake);
    const interpretations = getWaterIntakeInterpretations(
      getWaterIntakeCategory(waterIntake, ageValue, isTropical === 'Yes'),
    );
    setIntakeMedicalInterpretation(interpretations.medical);
    setIntakeStatisticalInterpretation(interpretations.statistical);

    if (resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  };

  const handleClear = () => {
    setWeight('');
    setAge('');
    setGender('');
    setIsTropical('No');
    setIntakeResult('');
    setIntakeMedicalInterpretation(
      'After calculating your daily water needs, this section will provide a general medical interpretation of your result. It will explain how your hydration level may affect bodily functions, such as energy, digestion, and circulation. This is intended as educational guidance and not a clinical diagnosis.',
    );
    setIntakeStatisticalInterpretation(
      'Once your result is calculated, this section will explain how the recommendation reflects your age, gender, weight, activity level, and tropical climate setting.',
    );
  };

  const activityVariant = [
    'Sedentary (Little to No Exercise)',
    'Light Exercise (1-2 times/week)',
    'Moderate Exercise (3-5 times/week)',
    'High Exercise (6-7 times/week)',
    'Extreme (2x per day)',
  ];

  const citations = [
    {
      name: '[1] El Milad, H. S., Chughtai, M., & Stoinski, S. (2020). Hydration and kidney stone risk: A systematic review. Nutrition Reviews, 78(7), 535–546. ',
      link: 'https://doi.org/10.1093/nutrit/nuz082',
    },
    {
      name: '[2] European Food Safety Authority. (2010). Scientific opinion on dietary reference values for water. EFSA Journal, 8(3), 1459. ',
      link: 'https://doi.org/10.2903/j.efsa.2010.1459',
    },
    {
      name: '[3] Institute of Medicine. (2005). Dietary reference intakes for water, potassium, sodium, chloride, and sulfate. The National Academies Press. ',
      link: 'https://doi.org/10.17226/10925',
    },
    {
      name: '[4] Popkin, B. M., D’Anci, K. E., & Rosenberg, I. H. (2010). Water, hydration, and health. Nutrition Reviews, 68(8), 439–458. ',
      link: 'https://doi.org/10.1111/j.1753-4887.2010.00304.x',
    },
  ];

  return (
    <>
      <CalculatorDetails name='Water Intake Calculator' details={description} />

      <RowContainer>
        <CalculatorContainer heading='Water Intake Calculator' onCalculate={handleCalculate} onClear={handleClear}>
          <div className='flex flex-col gap-3'>
            <CalculatorInput label='Age' setValue={setAge} value={age} />
            <GenderSelector gender={gender} setGender={setGender} />
            <CalculatorInput
              label='Weight'
              setUnit={(value) => setWeightUnit(value as WeightUnit)}
              unit={weightUnit}
              setValue={setWeight}
              value={weight}
              units={weightUnits}
            />
            <RadioButton
              choices={activityVariant}
              name='activity-variants'
              value={activityLevel}
              setValue={(value) =>
                setActivityLevel(value as WaterIntakeActivityLevel)
              }
              text='Activity Level'
              showBodyFat={false}
            />
            <RadioButton
              choices={['No', 'Yes']}
              name='tropical-climate'
              value={isTropical}
              setValue={setIsTropical}
              text='Tropical Climate'
            />
          </div>
        </CalculatorContainer>
        <Container heading='Instructions'>
          <ol className='list-decimal text-justify font-content mx-2 mb-3 md:mb-5 text-xs md:text-base'>
            {instructions.map((instruction) => (
              <li key={instruction}>{renderHtml(instruction)}</li>
            ))}
          </ol>
        </Container>
      </RowContainer>

      <div className='mx-2 mb-3 md:mb-5 text-xs md:text-base font-content flex flex-row mt-10 justify-between self-center'>
        <Container heading='Results' ref={resultsRef}>
          <div className='right-0 border-b-2 border-primary-yellow w-25 absolute' />
          <p className='mt-5 text-center text-xs md:text-base'>
            {' '}
            Estimated Water Intake:{' '}
          </p>
          <div className='mb-3 flex flex-col gap-1 text-xs md:text-base'>
            {formatIntake(intakeResult).map(({ label, value }) => (
              <div className='flex justify-between gap-8' key={label}>
                <span className='font-medium'>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </Container>
      </div>

      <div className='w-full flex flex-col gap-10 mt-10'>
        <Content content={intakeMedicalInterpretation} title='Medical Interpretation' />
        <Content content={intakeStatisticalInterpretation} title='Statistical Interpretation' />
        <Citation citations={citations} title='References' />
      </div>
    </>
  );
}
