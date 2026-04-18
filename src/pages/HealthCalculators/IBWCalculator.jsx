import { getIBW } from '@/services/Calculations';
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

export default function IBWCalculator () {
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [height, setHeight] = useState('');
  const [results, setResults] = useState(null);
  const [ibwMedicalInterpretation, setIbwMedicalInterpretation] = useState(
    'After calculating your Ideal Body Weight (IBW), this section will provide a medical interpretation of what your result may indicate. It will explain how your estimated IBW can be used in clinical contexts, such as for medication dosing, nutritional planning, or assessing health risk. This information is general and not a substitute for medical advice.',
  );
  const [ibwStatisticalInterpretation, setIbwStatisticalInterpretation] =
    useState(
      'Once your IBW is calculated, this section will help you understand how your current weight compares to population-based weight expectations for your height and sex. It provides context on whether you are below, within, or above typical reference ranges used in health assessments.',
    );

  const resultsRef = useRef(null);
  const isMobile = useMobile();

  const { IBW } = highlightedData;
  const { description, instructions } = IBW;

  const heightUnits = ['cm', 'ft', 'm'];

  const handleCalculate = () => {
    if (!height || height <= 0) {
      alert('Please enter valid height values');
      return;
    }

    setIbwMedicalInterpretation(IBW.medicalInterpretation);
    setIbwStatisticalInterpretation(IBW.statisticalInterpretation);

    try {
      const result = getIBW(height, heightUnit, gender);

      setResults(result);

      if (resultsRef.current) {
        setTimeout(() => {
          resultsRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 100);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClear = () => {
    setGender('');
    setAge('');
    setHeight('');
    setResults(null);
    setIbwMedicalInterpretation(
      'After calculating your Ideal Body Weight (IBW), this section will provide a medical interpretation of what your result may indicate. It will explain how your estimated IBW can be used in clinical contexts, such as for medication dosing, nutritional planning, or assessing health risk. This information is general and not a substitute for medical advice.',
    );
    setIbwStatisticalInterpretation(
      'Once your IBW is calculated, this section will help you understand how your current weight compares to population-based weight expectations for your height and sex. It provides context on whether you are below, within, or above typical reference ranges used in health assessments.',
    );
  };

  const citations = [
    {
      name: '[1] Chumlea, W. C., Guo, S. S., Steinbaugh, M. L. (1998). Prediction of body weight for the nonambulatory elderly population. Journal of the American Dietetic Association, 98(9), 1028–1031. ',
      link: 'https://doi.org/10.1016/S0002-8223(98)00236-3',
    },
    {
      name: '[2] Danowski, T.S. (1964) Diabetes Mellitus: Diagnosis and Treatment. Vol. 1, American Diabetes Association, New York, 73-78. ',
      link: 'https://www.scirp.org/reference/referencespapers?referenceid=3110698',
    },
    {
      name: '[3] Devine, B. J. (1974). Gentamicin therapy. Drug Intelligence & Clinical Pharmacy, 8, 650–655. ',
      link: 'https://journals.sagepub.com/doi/10.1177/106002807400801104',
    },
    {
      name: '[4] Kyriakopoulos, C., & Gupta, V. (2024, July 27). Renal failure drug dose adjustments. StatPearls - NCBI Bookshelf. ',
      link: 'https://www.ncbi.nlm.nih.gov/books/NBK560512/',
    },
    {
      name: '[5] Robinson, J. D., Lupkiewicz, S. M., Palenik, L., Lopez, L. M., & Ariet, M. (1983). Determination of ideal body weight for drug dosage calculations. The American Journal of Hospital Pharmacy, 40(6), 1016–1019. ',
      link: 'https://pubmed.ncbi.nlm.nih.gov/6869387/',
    },
  ];

  return (
    <>
      <CalculatorDetails
        name='Ideal Body Weight Calculator'
        details={description}
      />
      <RowContainer>
        <CalculatorContainer
          heading='Ideal Body Weight (IBW) Calculator'
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
          </div>
        </CalculatorContainer>{' '}
        <Container heading='Instructions'>
          <div className=''>
            <ol className='list-decimal text-justify font-content mx-2 mb-3 md:mb-5 text-xs md:text-base'>
              {instructions.map((instruction, index) => (
                <li
                  dangerouslySetInnerHTML={{ __html: instruction }}
                  key={`Instruction ${index}`}
                />
              ))}
            </ol>
          </div>
        </Container>
      </RowContainer>

      <div className='text-xs md:text-base font-content flex flex-row mt-10 justify-between self-center'>
        <Container heading='Results' ref={resultsRef}>
          <div className='right-0 border-b-2 border-primary-yellow w-35 absolute' />
          <div className='w-auto mx-2 mb-3 md:mb-5 border-b-2 border-primary-blue pb-2 text-center'>
            <p className='p-2 pt-5 text-xs md:text-base'>
              {' '}
              Ideal weight based on popular formulas:
            </p>
          </div>

          <table className='border-collapse w-full'>
            <thead>
              <tr>
                <th className='text-left w-1/2'>
                  <p className='mt-5 text-red-400 font-content text-xs md:text-base'>
                    {' '}
                    Formula{' '}
                  </p>
                  <div className='border-b-2 mb-3 border-primary-blue w-10 font-content' />
                </th>
                <th className='pl-3 text-left w-1/2'>
                  <p className='mt-5 text-green-400 font-content text-xs md:text-base'>
                    {' '}
                    Ideal Weight{' '}
                  </p>
                  <div className='border-b-2 mb-3 border-primary-blue w-10 font-content' />
                </th>
              </tr>
            </thead>

            <tbody>
              {results && (
                <>
                  {Object.entries(results.IBW).map(([formula, value]) => (
                    <tr key={formula}>
                      <td className='pl-1 md:pl-3 text-xs md:text-base font-content border-r-2 border-primary-yellow'>
                        {formula}
                      </td>
                      <td className='pl-5 md:pl-6 text-xs md:text-base'>
                        {value} kg
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {results?.HealthyBMIRange && (
                <tr className='text-xs md:text-base font-content'>
                  <td className='p-1 md:p-3'>Healthy Weight Range:</td>
                  <td className='p-5 md:pl-6'>
                    <p>
                      {' '}
                      {results.HealthyBMIRange.min} -{' '}
                      {results.HealthyBMIRange.max} kg{' '}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Container>
      </div>
      <div className='w-full flex flex-col gap-10 mt-10'>
        <Content
          content={ibwMedicalInterpretation}
          title='Medical Interpretation'
        />
        <Content
          content={ibwStatisticalInterpretation}
          title='Statistical Interpretation'
        />
        <Citation citations={citations} title='References' />
      </div>
    </>
  );
}
