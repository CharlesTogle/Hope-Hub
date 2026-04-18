import { getBodyFatPercentage } from '@/services/Calculations';
import { CalculatorData, highlightedData } from '@/utilities/CalculatorData';
import Container from '@/components/health-calculators/Container';
import CalculatorContainer from '@/components/health-calculators/CalculatorContainer';
import { CalculatorDetails } from '@/components/health-calculators/CalculatorDetails';
import GenderSelector from '@/components/health-calculators/GenderSelector';
import { useState, useRef } from 'react';
import CalculatorInput from '@/components/health-calculators/CalculatorInput';
import Content from '@/components/health-calculators/Content';
import RowContainer from '@/components/health-calculators/RowContainer';
import useMobile from '@/hooks/useMobile';
import Citation from '@/components/Citations';

export default function BodyFatPercentageCalculator () {
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [neckUnit, setNeckUnit] = useState('cm');
  const [waistUnit, setWaistUnit] = useState('cm');
  const [hipsUnit, setHipsUnit] = useState('cm');
  const [results, setResults] = useState(null);
  const [bodyFatPercentageCategory, setBodyFatPercentageCategory] =
    useState('...');
  const [bodyFatPercentageResult, setBodyFatPercentageResult] = useState('');
  const [
    fatPercentageMedicalInterpretation,
    setFatPercentageMedicalInterpretation,
  ] = useState(
    'Once you calculate your result, this section will provide a general medical interpretation of your body fat percentage. It will explain what your level may mean for your health, including potential benefits or risks, based on established clinical guidelines. Always consult a healthcare provider for personal advice.',
  );
  const [
    fatPercentageStatisticalInterpretation,
    setFatPercentageStatisticalInterpretation,
  ] = useState(
    "After calculating your body fat percentage, this section will show how your result compares to typical ranges in the general population. It helps you understand where your number falls statistically — whether it's common, rare, or above average — and offers context based on observed health trends.",
  );

  const resultsRef = useRef(null);
  const isMobile = useMobile();

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

  const getBodyFatPercentageCategory = (gender, bodyFatPercentage) => {
    switch (gender) {
      case 'female':
      case 'male':
        if (bodyFatPercentage > 69) return 'Obese';
        if (bodyFatPercentage > 44) return 'Average';
        if (bodyFatPercentage > 26) return 'Fitness';
        if (bodyFatPercentage > 10) return 'Athletes';
        if (bodyFatPercentage >= 4) return 'Essential';
        return 'Below';
      default:
        alert('Gender must be "male" or "female".');
        break;
    }
  };

  const getFatPercentageInterpretations = category => {
    return {
      medical: medicalInterpretation[category] || 'No interpretation available',
      statistical:
        statisticalInterpretation[category] || 'No interpretation available',
    };
  };

  const handleCalculate = () => {
    if (!weight || weight <= 0) {
      alert('Please enter a valid weight value.');
      return;
    }

    const bodyFatPercentage = getBodyFatPercentage(
      age,
      gender,
      parseFloat(height),
      parseFloat(weight),
      parseFloat(neck),
      parseFloat(waist),
      parseFloat(hips),
      heightUnit,
      weightUnit,
      neckUnit,
      waistUnit,
      hipsUnit,
    );

    const raw = bodyFatPercentage.results['Body Fat: U.S. Navy Method'];
    const category = getBodyFatPercentageCategory(gender, parseFloat(raw));
    const interpretations = getFatPercentageInterpretations(category);

    setResults(bodyFatPercentage);
    setBodyFatPercentageResult(raw);
    setBodyFatPercentageCategory(category);
    setFatPercentageMedicalInterpretation(interpretations.medical);
    setFatPercentageStatisticalInterpretation(interpretations.statistical);

    if (resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  };

  const raw =
    results?.results?.['Body Fat: U.S. Navy Method']?.replace('%', '') || '0';
  const rawNum = parseFloat(raw);
  const rawPercent = Math.min(Math.max(rawNum, 0), 100);

  const handleClear = () => {
    setGender('');
    setAge('');
    setWeight('');
    setHeight('');
    setHips('');
    setWaist('');
    setNeck('');
    setResults(null);
    setBodyFatPercentageResult('');
    setBodyFatPercentageCategory('...');
    setFatPercentageMedicalInterpretation(
      'Once you calculate your result, this section will provide a general medical interpretation of your body fat percentage. It will explain what your level may mean for your health, including potential benefits or risks, based on established clinical guidelines. Always consult a healthcare provider for personal advice.',
    );
    setFatPercentageStatisticalInterpretation(
      "After calculating your body fat percentage, this section will show how your result compares to typical ranges in the general population. It helps you understand where your number falls statistically — whether it's common, rare, or above average — and offers context based on observed health trends.",
    );
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
        name='Body Fat Percentage Calculator'
        details={description}
      />

      <RowContainer>
        <CalculatorContainer
          heading='Body Fat Percentage Calculator'
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
            <CalculatorInput
              label='Waist'
              setUnit={setWaistUnit}
              unit={waistUnit}
              setValue={setWaist}
              value={waist}
              units={waistUnits}
            />
            <CalculatorInput
              label='Neck'
              setUnit={setNeckUnit}
              unit={neckUnit}
              setValue={setNeck}
              value={neck}
              units={neckUnits}
            />
            <CalculatorInput
              label='Hips'
              setUnit={setHipsUnit}
              unit={hipsUnit}
              setValue={setHips}
              value={hips}
              units={hipsUnits}
            />
          </div>
        </CalculatorContainer>{' '}
        <Container heading='Instructions'>
          <ol className='list-decimal text-justify mx-2 mb-3 md:mb-5 font-content text-xs md:text-base'>
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
        <Container heading='Results'>
          <span className='mt-5 font-content text-xs md:text-base text-center font-bold'>
            {' '}
            Body Fat: {raw}%{' '}
          </span>
          <div className='mt-2 border-b-2 border-primary-blue w-25 self-center' />
          <div className='mt-5 w-[100%] h-16 rounded overflow-hidden flex relative'>
            <div className='h-8 shadow-md bg-red-800 w-[4%]' />{' '}
            {/* Below essential */}
            <div className='h-8 shadow-md bg-yellow-400 w-[6%]' />{' '}
            {/* Essential */}
            <div className='h-8 shadow-md bg-green-400 w-[16%]' />{' '}
            {/* Athlete */}
            <div className='h-8 shadow-md bg-green-600 w-[18%]' />{' '}
            {/* Fitness */}
            <div className='h-8 shadow-md bg-yellow-400 w-[25%]' />{' '}
            {/* Average */}
            <div className='h-8 shadow-md bg-red-800 w-[31%]' /> {/* Obese */}
            <span
              style={{ marginLeft: `${rawPercent}%` }}
              className='w-auto mt-6 absolute font-extrabold text-xl text-shadow-black'
            >
              ◣
            </span>
          </div>

          {/* <span className = {getPercentCategoryLevel(BodyFatPercentageResult)}> ◣ </span> */}

          <table className='border-collapse font-content text-xs md:text-base w-full'>
            <tbody>
              {results?.results &&
                Object.entries(results.results).map(([label, value]) => (
                  <tr key={label}>
                    <td className='p-2'>{label}</td>
                    <td className='p-2'>
                      <span className='ml-10'> {value} </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className='right-0 border-b-2 border-primary-yellow w-25 absolute' />
        </Container>

        <Container heading='Data Reference'>
          <div className='mx-2 mb-3 md:mb-5 w-auto font-content text-xs md:text-base'>
            <div className='relative grid grid-cols-2 fr gap-3 items-center'>
              <span className='text-xs md:text-base font-bold'>
                {' '}
                Percentage{' '}
              </span>{' '}
              <span className='text-xs md:text-base font-bold'>
                {' '}
                Bar Visualizer{' '}
              </span>
              <div className='border-b-2 border-primary-blue w-10 self-center' />{' '}
              <div className='border-b-2 border-primary-blue w-10 self-center' />
              <span className='flex  text-red-800'>
                {' '}
                less than 4% <br /> Below Essential
              </span>{' '}
              <div className='h-6 flex shadow-md bg-red-800 w-[4%]' />
              <span className='flex  text-yellow-400 '>
                {' '}
                4% - 10% <br /> Essential{' '}
              </span>{' '}
              <div className='h-6 shadow-md bg-yellow-400 w-[6%]' />
              <span className='flex  text-green-400 '>
                {' '}
                11% - 26% <br /> Athlete{' '}
              </span>{' '}
              <div className='h-6 shadow-md bg-green-400 w-[16%]' />
              <span className='flex  text-green-600 '>
                {' '}
                27% - 44% <br /> Fitness{' '}
              </span>{' '}
              <div className='h-6 shadow-md bg-green-600 w-[18%]' />
              <span className='flex  text-yellow-400'>
                {' '}
                45% - 69% <br /> Average{' '}
              </span>{' '}
              <div className='h-6 shadow-md bg-yellow-400 w-[25%]' />
              <span className='flex  text-red-800'>
                {' '}
                more than 70% <br /> Obese{' '}
              </span>{' '}
              <div className='h-6 shadow-md bg-red-800 w-[31%]' />
            </div>
          </div>
        </Container>
      </RowContainer>

      <div className='w-full flex flex-col gap-10 mt-10'>
        <Content
          content={fatPercentageMedicalInterpretation}
          title='Medical Interpretation'
        />
        <Content
          content={fatPercentageStatisticalInterpretation}
          title='Statistical Interpretation'
        />
        <Citation citations={citations} title='References' />
      </div>
    </>
  );
}
