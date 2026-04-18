import { getWaterIntake } from '@/services/Calculations';
import { CalculatorData, highlightedData } from '@/utilities/CalculatorData';
import Container from '@/components/health-calculators/Container';
import CalculatorContainer from '@/components/health-calculators/CalculatorContainer';
import { CalculatorDetails } from '@/components/health-calculators/CalculatorDetails';
import { useState, useRef } from 'react';
import CalculatorInput from '@/components/health-calculators/CalculatorInput';
import Content from '@/components/health-calculators/Content';
import RowContainer from '@/components/health-calculators/RowContainer';
import RadioButton from '@/components/health-calculators/RadioButtons';
import useMobile from '@/hooks/useMobile';
import Citation from '@/components/Citations';

export default function WaterIntakeCalculator () {
  const [weightUnit, setWeightUnit] = useState('kg');
  const [weight, setWeight] = useState('');
  const [waterIntakeCategory, setWaterIntakeCategory] = useState('...');
  const [activityLevel, setActivityLevel] = useState(
    'Sedentary (Little to No Exercise)',
  );
  const [intakeResult, setIntakeResult] = useState('');
  const [intakeMedicalInterpretation, setIntakeMedicalInterpretation] =
    useState(
      'After calculating your daily water needs, this section will provide a general medical interpretation of your result. It will explain how your hydration level may affect bodily functions, such as energy, digestion, and circulation. This is intended as educational guidance and not a clinical diagnosis.',
    );
  const [IntakeStatisticalInterpretation, setIntakeStatisticalInterpretation] =
    useState(
      'Once your result is calculated, this section will show how your water intake compares to typical hydration ranges for your weight and activity level. It gives context for whether your current or recommended intake aligns with common population averages.',
    );

  const resultsRef = useRef(null);
  const isMobile = useMobile();

  const { WaterIntake } = highlightedData;
  const {
    description,
    instructions,
    statisticalInterpretation,
    medicalInterpretation,
  } = WaterIntake;

  const weightUnits = ['kg', 'lbs'];
  const getWaterIntakeCategory = waterIntake => {
    if (waterIntake < 2.3) return 'below the recommended intake';
    if (waterIntake > 3.7) return 'above the recommended intake';
    return 'within the recommended intake';
  };

  const getWaterIntakeInterpretations = category => {
    const categoryKey = category
      .toLowerCase()
      .replace(' the recommended intake', '');
    return {
      medical:
        medicalInterpretation[categoryKey] || 'No interpretation available',
      statistical:
        statisticalInterpretation[categoryKey] || 'No interpretation available',
    };
  };

  const getIntakeCategoryColor = categoryKey => {
    switch (categoryKey) {
      case 'below the recommended intake':
      case 'above the recommended intake':
        return 'text-yellow-500 mb-3';
      case 'within the recommended intake':
        return 'text-green-600 mb-3';
    }
  };

  const handleCalculate = () => {
    if (!weight || weight <= 0) {
      alert('Please enter a valid weight value.');
      return;
    }

    const waterIntake = getWaterIntake(
      parseFloat(weight),
      activityLevel,
      weightUnit,
    );

    const category = getWaterIntakeCategory(waterIntake);
    const interpretations = getWaterIntakeInterpretations(category);

    setIntakeResult(waterIntake);
    setWaterIntakeCategory(category);
    setIntakeMedicalInterpretation(interpretations.medical);
    setIntakeStatisticalInterpretation(interpretations.statistical);

    if (resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  };

  const handleClear = () => {
    setWeight('');
    setIntakeResult('');
    setWaterIntakeCategory('...');
    setIntakeMedicalInterpretation(
      'After calculating your daily water needs, this section will provide a general medical interpretation of your result. It will explain how your hydration level may affect bodily functions, such as energy, digestion, and circulation. This is intended as educational guidance and not a clinical diagnosis.',
    );
    setIntakeStatisticalInterpretation(
      'Once your result is calculated, this section will show how your water intake compares to typical hydration ranges for your weight and activity level. It gives context for whether your current or recommended intake aligns with common population averages.',
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
        <CalculatorContainer
          heading='Water Intake Calculator'
          onCalculate={handleCalculate}
          onClear={handleClear}
        >
          <div className='flex flex-col gap-3'>
            <CalculatorInput
              label='Weight'
              setUnit={setWeightUnit}
              unit={weightUnit}
              setValue={setWeight}
              value={weight}
              units={weightUnits}
            />
            <RadioButton
              choices={activityVariant}
              name='activity-variants'
              value={activityLevel}
              setValue={setActivityLevel}
              text='Activity Level'
              showBodyFat={false}
            />
          </div>
        </CalculatorContainer>{' '}
        <Container heading='Instructions'>
          <ol className='list-decimal text-justify font-content mx-2 mb-3 md:mb-5 text-xs md:text-base'>
            {instructions.map((instruction, index) => (
              <li
                dangerouslySetInnerHTML={{ __html: instruction }}
                key={`Instruction ${index}`}
              />
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
          <p className='mb-3 text-center text-xs md:text-base'>
            {' '}
            <p className={getIntakeCategoryColor(waterIntakeCategory)}>
              {intakeResult}L
            </p>
            You are {waterIntakeCategory}.{' '}
          </p>
        </Container>
      </div>

      <div className='w-full flex flex-col gap-10 mt-10'>
        <Content
          content={intakeMedicalInterpretation}
          title='Medical Interpretation'
        />
        <Content
          content={IntakeStatisticalInterpretation}
          title='Statistical Interpretation'
        />
        <Citation citations={citations} title='References' />
      </div>
    </>
  );
}
