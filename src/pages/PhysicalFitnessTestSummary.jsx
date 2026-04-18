import PageHeading from '@/components/PageHeading';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import { Fragment, useEffect, useState } from 'react';
import supabase from '@/client/supabase';
import { useUserId } from '@/hooks/useUserId';
import { useParams, useSearchParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import { getBMI } from '@/services/Calculations';
import { getBMICategory } from './HealthCalculators/BMICalculator';

export function PhysicalFitnessTestSummary () {
  const { testType } = useParams();
  const [searchParams] = useSearchParams();
  const [isDataReady, setIsDataReady] = useState(false);
  const [dataResults, setDataResults] = useState([]);
  const [isBadRequest, setIsBadRequest] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const userId = useUserId();
  // Check if this is a teacher viewing a student's record
  const studentId = searchParams.get('student');
  const targetUserId = studentId || userId;
  const isTeacherView = !!studentId;

  let columnName = '';
  if (testType === 'pre-test') {
    columnName = 'pre_physical_fitness_test';
  } else if (testType === 'post-test') {
    columnName = 'post_physical_fitness_test';
  } else {
    columnName = 'pre_physical_fitness_test';
  }
  useEffect(() => {
    async function checkConstraints () {
      if (!userId) {
        return;
      }
      // If teacher is viewing student data, validate access
      if (isTeacherView) {
        // For now, we'll proceed if teacher is logged in

        // Check if the student exists
        const { data: studentExists, error: studentCheckError } = await supabase
          .from('profile')
          .select('uuid')
          .eq('uuid', targetUserId)
          .single();

        if (studentCheckError || !studentExists) {
          ('this 1');
          setIsBadRequest(true);
          return;
        }
      }

      const { data: existing, error: fetchError } = await supabase
        .from('physical_fitness_test')
        .select(columnName)
        .eq('uuid', targetUserId)
        .single();

      if (fetchError) {
        ('this 2');
        setIsBadRequest(true);
        return;
      }

      const finishedTests = existing[columnName]?.finishedTestIndex;
      if (!finishedTests) {
        ('this 3');
        setIsBadRequest(true);
        return;
      }

      const max = finishedTests.length - 1;
      if (!finishedTests.includes(max)) {
        ('this 4');
        setIsBadRequest(true);
      }
    }
    checkConstraints();
  }, [targetUserId, userId, isTeacherView, columnName]);
  useEffect(() => {
    if (isDataReady) {
      return;
    }

    if (!targetUserId) return;
    async function getDataFromDatabase () {
      // If in teacher view, fetch student information first
      const { data: studentData, error: studentError } = await supabase
        .from('profile')
        .select('full_name, email')
        .eq('uuid', targetUserId)
        .single();

      if (!studentError && studentData) {
        setStudentInfo(studentData);
      }

      //handle pre test or post test
      const data = await getPhysicalFitnessData(targetUserId, columnName);
      if (data) {
        setDataResults(getSummary(data));
        setIsDataReady(true);
      }
    }

    getDataFromDatabase();
  }, [isDataReady, targetUserId, isTeacherView, columnName]);

  if (isBadRequest) {
    return <ErrorMessage text={'Error 400'} subText={'Bad Request'} />;
  }

  if (!isDataReady) {
    return <Loading />;
  }

  if (!dataResults) {
    return <ErrorMessage text={'Error 400'} subText={'Bad Request'} />;
  }
  return (
    <section id='physical-fitness-test-summary' className='parent-container'>
      <PageHeading text={'Physical Fitness Test'}></PageHeading>
      <div id='summary-content' className='content-container'>
        <h1 className='w-full text-left text-3xl lg:text-4xl font-heading lg:-ml-20 lg:mb-5 font-medium text-primary-blue'>
          {testType === 'pre-test' ? 'Pre Test' : 'Post Test'} Record
        </h1>
        {studentInfo && (
          <div className='w-full mb-5 p-4 bg-gray-100 rounded-lg lg:-ml-20'>
            <h2 className='text-xl font-medium text-gray-800 mb-2'>
              Student Information
            </h2>
            <p className='text-gray-700'>
              <strong>Name:</strong> {studentInfo.full_name}
            </p>
            <p className='text-gray-700'>
              <strong>Email:</strong> {studentInfo.email}
            </p>
          </div>
        )}
        <div className='w-full flex flex-col space-y-5 mb-10'>
          {dataResults.map((summary, index) => (
            <Fragment key={`${summary.title} ${index}`}>
              {(() => {
                const sectionHeadings = {
                  0: 'A. Body Mass Index',
                  1: 'B. Cardiovascular Endurance',
                  2: 'C. Strength',
                  3: 'D. Flexibility',
                };
                const heading = sectionHeadings[index];
                return (
                  heading && (
                    <Fragment>
                      <h1 className=' text-2xl lg:text-3xl font-heading lg:-ml-5 mb-0 font-medium'>
                        {heading}
                      </h1>
                      <hr className='w-1/3 border-1 border-primary-yellow mb-4 -ml-5' />
                    </Fragment>
                  )
                );
              })()}
              <TableSummary summary={summary} />
            </Fragment>
          ))}
        </div>
      </div>
      <Footer></Footer>
    </section>
  );
}

const TableColumn = ({ columnContent }) => (
  <tr>
    {columnContent.map((content, index) => (
      <td
        className={`${
          index === 0 ? 'border-l-0!' : ''
        } text-xs font-semibold lg:text-base text-center font-content w-15 h-15 border-l-2 lg:border-l-4 border-t-4 border-secondary-dark-blue`}
        key={`data ${index}`}
      >
        {content}
      </td>
    ))}
  </tr>
);

const TableHeading = ({ headings }) => (
  <tr>
    {headings.map((heading, index) => (
      <th
        className={`${
          index === 0 ? 'border-l-0!' : ''
        } text-xs lg:text-base h-10 lg:h-20 text-center font-content border-l-2 lg:border-l-4 text-white bg-secondary-dark-blue border-white`}
        key={heading}
      >
        {heading}
      </th>
    ))}
  </tr>
);

const TableSummary = ({ summary }) => (
  <div id='summary'>
    <div className='flex flex-row font-heading space-x-2 lg:text-lg'>
      <p>{summary.number}.</p>
      <p>{summary.title}</p>
    </div>
    <hr className='w-20 border-1 border-primary-yellow mb-3' />
    <div
      id='table-container'
      className='rounded-md overflow-hidden border-5 border-secondary-dark-blue h-fit w-full'
    >
      <table className='w-full h-full'>
        <tbody>
          <tr className={`${summary.hasParentHeading ? '' : 'hidden'}`}>
            <th
              className='lg:text-base text-sm text-center font-bold font-content h-10  border-b-4 border-white'
              colSpan={summary.headings.length}
            >
              {summary.parentHeading}
            </th>
          </tr>
          <TableHeading headings={summary.headings} />
          <TableColumn columnContent={summary.content} />
        </tbody>
      </table>
    </div>
  </div>
);

function handleData ({
  data,
  hasParentHeading = false,
  parentHeading = '',
  number,
  unit = '',
}) {
  return {
    hasParentHeading: hasParentHeading,
    parentHeading: [parentHeading],
    title: data.title,
    number: number.toString(),
    headings: ['Record', 'Classification', 'Time Started', 'Time Ended'],
    content: [
      `${data.record} ${unit}`,
      data.classification,
      data.timeStarted,
      data.timeEnd,
    ],
  };
}

function customHandleData ({
  title,
  hasParentHeading = false,
  parentHeading = '',
  headings = [],
  content = [],
  number,
}) {
  return {
    hasParentHeading: hasParentHeading,
    parentHeading: parentHeading,
    title: title,
    number: number,
    headings: headings,
    content: content,
  };
}

const getSummary = dataGathered => {
  let dataResults = [];
  const bmi = getBMI(
    dataGathered.bmiHeight?.record,
    dataGathered.bmiWeight?.record,
    'cm',
    'kg',
  );
  dataResults.push(
    customHandleData({
      title: 'Body Mass Index',
      headings: ['Height', 'Weight', 'BMI', 'Classification'],
      content: [
        `${dataGathered.bmiHeight?.record} cm`,
        `${dataGathered.bmiWeight?.record} kg`,
        `${bmi.toFixed(2)}`,
        `${getBMICategory(bmi)}`,
      ],
      number: 1,
    }),
  );
  dataResults.push(
    customHandleData({
      title: '3 Minute Step Test',
      hasParentHeading: true,
      parentHeading: ['Heart Rate per Minute'],
      headings: ['Before the Activity', 'After the Activity'],
      content: [
        `${dataGathered.preStepTest.record} Beats per Minute`,
        `${dataGathered.stepTest.record} Beats per Minute`,
      ],
      number: 2,
    }),
  );

  dataResults.push(handleData({ data: dataGathered.pushUp, number: 3 }));
  dataResults.push(
    handleData({ data: dataGathered.basicPlank, unit: 'Second(s)', number: 4 }),
  );
  dataResults.push(
    handleData({
      data: dataGathered.zipperTestRight,
      hasParentHeading: true,
      unit: 'cm',
      parentHeading: 'Overlap/Gap (centimeters)',
      number: 5,
    }),
  );
  dataResults.push(
    handleData({
      data: dataGathered.zipperTestLeft,
      hasParentHeading: true,
      unit: 'cm',
      parentHeading: 'Overlap/Gap (centimeters)',
      number: 6,
    }),
  );
  dataResults.push(
    handleData({
      data: dataGathered.sitAndReachFirst,
      hasParentHeading: true,
      unit: 'cm',
      parentHeading: 'Score (centimeters)',
      number: 7,
    }),
  );
  dataResults.push(
    handleData({
      data: dataGathered.sitAndReachSecond,
      hasParentHeading: true,
      unit: 'cm',
      parentHeading: 'Score (centimeters)',
      number: 8,
    }),
  );
  return dataResults;
};

async function getPhysicalFitnessData (userId, column) {
  const { data, error } = await supabase
    .from('physical_fitness_test')
    .select(column)
    .eq('uuid', userId);

  if (data) {
    return data[0][column];
  } else {
    return error;
  }
}
