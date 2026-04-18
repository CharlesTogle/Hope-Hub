import { getBMI } from '@/services/Calculations';
import { CalculatorData, highlightedData } from '@/utilities/CalculatorData';
import Container from '@/components/health-calculators/Container';
import CalculatorContainer from '@/components/health-calculators/CalculatorContainer';
import { CalculatorDetails } from '@/components/health-calculators/CalculatorDetails';
import { useState, useRef } from 'react';
import CalculatorInput from '@/components/health-calculators/CalculatorInput';
import Content from '@/components/health-calculators/Content';
import RowContainer from '@/components/health-calculators/RowContainer';
import useMobile from '@/hooks/useMobile';
import Citation from '@/components/Citations';

export const getBMICategory = bmi => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export default function BMICalculator () {
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmiResult, setBmiResult] = useState(null);
  const [bmiCategory, setBmiCategory] = useState('No data');
  const [bmiMedicalInterpretation, setBmiMedicalInterpretation] = useState(
    'Perform a BMI calculation to receive personalized medical interpretation based on your results. This will include information about health risks, recommended actions, and medical considerations specific to your BMI category.',
  );
  const [bmiStatisticalInterpretation, setBmiStatisticalInterpretation] =
    useState(
      'After calculating your BMI, you will see how your result compares to population distributions and statistical norms. This provides context for understanding where your BMI falls within broader health statistics.',
    );

  const resultsRef = useRef(null);
  const isMobile = useMobile();

  const { BMI } = highlightedData;
  const {
    description,
    instructions,
    statisticalInterpretation,
    medicalInterpretation,
  } = BMI;

  const heightUnits = ['cm', 'ft', 'm'];
  const weightUnits = ['kg', 'lbs'];

  const getBMICategoryColor = category => {
    switch (category) {
      case 'Underweight':
      case 'Obese':
        return 'text-red-600';
      case 'Overweight':
        return 'text-orange-500';
      case 'Normal':
        return 'text-green-600';
      default:
        return 'text-gray-500';
    }
  };

  const getBMIInterpretations = category => {
    const categoryKey = category.toLowerCase().replace(' weight', '');
    return {
      medical:
        medicalInterpretation[categoryKey] || 'No interpretation available',
      statistical:
        statisticalInterpretation[categoryKey] || 'No interpretation available',
    };
  };
  const handleCalculate = () => {
    if (!height || !weight || height <= 0 || weight <= 0) {
      alert('Please enter valid height and weight values');
      return;
    }

    const bmi = getBMI(
      parseFloat(height),
      parseFloat(weight),
      heightUnit,
      weightUnit,
    );

    const roundedBmi = Math.round(bmi * 10) / 10;
    const category = getBMICategory(roundedBmi);
    const interpretations = getBMIInterpretations(category);

    setBmiResult(roundedBmi);
    setBmiCategory(category);
    setBmiMedicalInterpretation(interpretations.medical);
    setBmiStatisticalInterpretation(interpretations.statistical);

    // Scroll to results on mobile after successful calculation
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
    setHeight('');
    setWeight('');
    setBmiResult(null);
    setBmiCategory('No data');
    setBmiMedicalInterpretation(
      'Perform a BMI calculation to receive personalized medical interpretation based on your results. This will include information about health risks, recommended actions, and medical considerations specific to your BMI category.',
    );
    setBmiStatisticalInterpretation(
      'After calculating your BMI, you will see how your result compares to population distributions and statistical norms. This provides context for understanding where your BMI falls within broader health statistics.',
    );
  };

  const citations = [
    {
      name: '[1] Centers for Disease Control and Prevention. (2022). About adult BMI. U.S. Department of Health & Human Services. ',
      link: 'https://www.cdc.gov/bmi/faq/?CDC_AAref_Val=https://www.cdc.gov/healthyweight/assessing/bmi/adult_bmi/index.html',
    },
    {
      name: '[2] Di Angelantonio, E., Bhupathiraju, S. N., Wormser, D., Gao, P., Kaptoge, S., Berrington de Gonzalez, A., … Woodward, M. (2016). Body-mass index and all-cause mortality: Individual‑participant-data meta‑analysis of 239 prospective studies in four continents. The Lancet, 388(10046), 776–786. ',
      link: 'https://pubmed.ncbi.nlm.nih.gov/27423262/',
    },
    {
      name: '[3] Flegal, K. M., Kit, B. K., Orpana, H., & Graubard, B. I. (2013). Association of all‑cause mortality with overweight and obesity using standard body mass index categories: A systematic review and meta‑analysis. JAMA, 309(1), 71–82. ',
      link: 'https://doi.org/10.1001/jama.2012.113905',
    },
    {
      name: '[4] National Institutes of Health. (1998). Clinical guidelines on the identification, evaluation, and treatment of overweight and obesity in adults: The evidence report (NIH Publication No. 98–4083). ',
      link: 'https://www.nhlbi.nih.gov/files/docs/guidelines/ob_gdlns.pdf',
    },
    {
      name: '[5] Prospective Studies Collaboration. (2009). Body-mass index and cause-specific mortality in 900,000 adults: Collaborative analyses of 57 prospective studies. The Lancet, 373(9669), 1083–1096. ',
      link: 'https://doi.org/10.1016/S0140-6736(09)60318-4',
    },
    {
      name: '[6] World Health Organization. (2021). Obesity and overweight: Key facts. ',
      link: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
    },
  ];

  return (
    <>
      <CalculatorDetails
        name='Body Mass Index Calculator'
        details={description}
      />
      <RowContainer>
        <CalculatorContainer
          heading='Body Mass Index (BMI) Calculator'
          onCalculate={handleCalculate}
          onClear={handleClear}
        >
          <div className='flex flex-col gap-3'>
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
          </div>{' '}
        </CalculatorContainer>
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
      <RowContainer>
        <Container heading='Results' ref={resultsRef}>
          <p className='font-content w-full text-center text-xs md:text-base'>
            BMI: {bmiResult || '0.00'} kg/m²{' '}
            <span className={getBMICategoryColor(bmiCategory)}>
              ({bmiCategory})
            </span>
          </p>
        </Container>
        <Container heading='BMI POINTERS' className='w-1/2'>
          <ol className='list-decimal font-content mx-2 mb-3 md:mb-5 text-xs md:text-base'>
            <li>Healthy Range: 18.5 – 24.9</li>
            <li>Underweight: Below 18.5</li>
            <li>Overweight: 25.0 – 29.9</li>
            <li>Obese: 30.0 and above</li>
          </ol>
          <p className='font-content text-red mt-2 text-xs md:text-base'>
            Note: BMI doesn't account for muscle mass or body composition.
          </p>
        </Container>
      </RowContainer>
      <div className='w-full flex flex-col gap-10 mt-10 sm:text-xs md:text-sm'>
        <Content
          content={bmiMedicalInterpretation}
          title='Medical Interpretation'
        />
        <Content
          content={bmiStatisticalInterpretation}
          title='Statistical Interpretation'
        />{' '}
        <Citation citations={citations} title='References' />
      </div>
    </>
  );
}
