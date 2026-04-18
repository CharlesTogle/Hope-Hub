import { getBMI, getHeartRate } from '@/services/Calculations';
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
import { Result } from 'postcss';

export const getHeartRateCategory = bmi => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export default function HeartRateCalculator () {
  const [age, setAge] = useState();
  const [heartrate, setHeartrate] = useState(70);
  const [thrResult, setThrResult] = useState(null);
  const [thrMedicalInterpretation, setThrMedicalInterpretation] = useState(
    'Target Heart Rate (THR) ranges calculated with the Karvonen method provide structured intensity zones from very light to very hard exercise. Population studies show that most adults achieve improvements in cardiovascular fitness, blood pressure, and overall endurance when training consistently within moderate to hard zones (≈40–85% HRR). Very light activity is statistically common in older adults or beginners, while vigorous activity is more common among trained or athletic individuals. Long-term population data confirm that maintaining activity within these ranges is strongly associated with reduced risk of cardiovascular disease and premature mortality.',
  );
  const [thrStatisticalInterpretation, setThrStatisticalInterpretation] =
    useState(
      'The Karvonen formula adjusts training intensity based on both resting and maximum heart rate, providing a more individualized target zone. Medical evidence indicates that exercising within moderate to vigorous zones supports heart health, blood sugar regulation, and weight control, while very light activity may be appropriate for recovery, older adults, or individuals with chronic conditions. Conversely, consistently training above 85% HRR may increase risk of injury, arrhythmia, or overtraining, particularly without medical clearance. These ranges are intended as general guidance; individual health status, medications (e.g., beta-blockers), and physician recommendations should always be considered when applying target heart rate zones.',
    );

  const resultsRef = useRef(null);
  const isMobile = useMobile();

  const { THR } = highlightedData;
  const { description, instructions } = THR;

  const handleCalculate = () => {
    if (!age || !heartrate) {
      alert('Please enter valid age and heart rate values');
      return;
    }

    const thr = getHeartRate(age, heartrate);

    setThrResult(thr);
    setThrMedicalInterpretation(THR.medicalInterpretation);
    setThrStatisticalInterpretation(THR.statisticalInterpretation);

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
    setThrResult(null);
    setHeartrate(70);
    setAge();
    setThrMedicalInterpretation(
      'Target Heart Rate (THR) ranges calculated with the Karvonen method provide structured intensity zones from very light to very hard exercise. Population studies show that most adults achieve improvements in cardiovascular fitness, blood pressure, and overall endurance when training consistently within moderate to hard zones (≈40–85% HRR). Very light activity is statistically common in older adults or beginners, while vigorous activity is more common among trained or athletic individuals. Long-term population data confirm that maintaining activity within these ranges is strongly associated with reduced risk of cardiovascular disease and premature mortality.',
    );
    setThrStatisticalInterpretation(
      'The Karvonen formula adjusts training intensity based on both resting and maximum heart rate, providing a more individualized target zone. Medical evidence indicates that exercising within moderate to vigorous zones supports heart health, blood sugar regulation, and weight control, while very light activity may be appropriate for recovery, older adults, or individuals with chronic conditions. Conversely, consistently training above 85% HRR may increase risk of injury, arrhythmia, or overtraining, particularly without medical clearance. These ranges are intended as general guidance; individual health status, medications (e.g., beta-blockers), and physician recommendations should always be considered when applying target heart rate zones.',
    );
  };

  const citations = [
    {
      name: '[1] American College of Sports Medicine. (n.d.). Target heart rate zones: Percent of HRR and % of HRmax. In ACSM CPT Chapter 15: Cardiorespiratory Training Programs. PTPioneer.',
      link: 'https://www.ptpioneer.com/personal-training/certifications/acsm/acsm-cpt-chapter-15/',
    },
    {
      name: '[2] Cleveland Clinic. (2023, January 25). Heart rate reserve: How to calculate it & what it means. Cleveland Clinic.',
      link: 'https://my.clevelandclinic.org/health/articles/24649-heart-rate-reserve',
    },
    {
      name: '[3] HeartOnline. (n.d.). Target heart rate calculator.',
      link: 'https://www.heartonline.org.au/resources/calculators/target-heart-rate-calculator',
    },
    {
      name: '[4] Mandal, A. (2023, July 14). Heart rate reserve. News-Medical.',
      link: 'https://www.news-medical.net/health/Heart-Rate-Reserve.aspx',
    },
  ];

  console.log({ thrResult });

  return (
    <>
      <CalculatorDetails
        name='Karvonen Heart Rate Calculator'
        details={description}
      />
      <RowContainer>
        <CalculatorContainer
          heading='Karvonen Heart Rate Calculator'
          onCalculate={handleCalculate}
          onClear={handleClear}
        >
          <div className='flex flex-col gap-3'>
            <CalculatorInput label='Age' value={age} setValue={setAge} />
            <CalculatorInput
              label='Heart Rate'
              value={heartrate}
              setValue={setHeartrate}
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

      <div className='grid grid-cols-1 gap-5 ml-2 mr-2 md:gap-10 md:my-5 w-auto'>
        <Container heading='Results' ref={resultsRef}>
          <div className='right-0 border-b-2 border-primary-yellow w-25 absolute' />

          <table className='justify-around content-around'>
            <thead>
              <th className='text-left align-bottom pr-5'>
                <p className='mt-5 align-text-bottom text-red-400 font-content text-xs md:text-base'>
                  {' '}
                  Intensity{' '}
                </p>
                <div className='border-b-2 mb-3 border-primary-blue w-10 font-content' />
              </th>
              <th className='text-left align-bottom pr-10 md:pr-20 md:pl-20 font-content text-xs md:text-base'>
                <p className='mt-5 text-primary-blue align-text-bottom'>
                  {' '}
                  Heart Rate Reserve{' '}
                </p>
                <div className='border-b-2 mb-3 border-primary-yellow w-10 font-content' />
              </th>
              <th className='text-left align-bottom pr-5'>
                <p className='mt-5 text-green-400 align-text-bottom font-content text-xs md:text-base'>
                  {' '}
                  Target Heart Rate{' '}
                </p>
                <div className='border-b-2 mb-3 border-primary-blue w-10 font-content' />
              </th>
            </thead>
            <tbody>
              <tr>
                <td>
                  <li className='list-none font-content text-xs md:text-base'>
                    <ol> Very Light </ol>
                    <ol> Light </ol>
                    <ol> Moderate </ol>
                    <ol> Hard </ol>
                    <ol> Very Hard </ol>
                  </li>
                </td>
                <td className='text-left mr-5 md:text-center md:pr-20 md:pl-20 font-content text-xs md:text-base'>
                  <ol> 19% & less </ol>
                  <ol> 20% - 39% </ol>
                  <ol> 40% - 59% </ol>
                  <ol> 60% - 84% </ol>
                  <ol> 85% & more </ol>
                </td>
                <td>
                  <p className='text-left font-content md:text-center text-xs md:text-base'>
                    {thrResult?.map((results, index) => (
                      <li key={`${index}`} className='list-none'>
                        {results}
                      </li>
                    ))}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </Container>
      </div>

      <div className='w-full flex flex-col gap-10 mt-10 sm:text-xs md:text-sm'>
        <Content
          content={thrMedicalInterpretation}
          title='Medical Interpretation'
        />
        <Content
          content={thrStatisticalInterpretation}
          title='Statistical Interpretation'
        />{' '}
        <Citation citations={citations} title='References' />
      </div>
    </>
  );
}
