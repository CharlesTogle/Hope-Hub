import PageHeading from '@/components/PageHeading';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import { Fragment } from 'react';
import supabase from '@/client/supabase';
import { useParams, useSearchParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import { getBMI } from '@/services/Calculations';
import { getBMICategory } from './HealthCalculators/BMICalculator';
import { useQuery } from '@tanstack/react-query';
import { pftKeys, profileKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import type { PFTSessionData, PFTTestResult } from '@/types/physical-fitness';

export function PhysicalFitnessTestSummary() {
  const { testType } = useParams();
  const [searchParams] = useSearchParams();
  const { profile } = useAuthStore();
  const userId = profile?.uuid ?? null;
  const studentId = searchParams.get('student');
  const targetUserId = studentId || userId;
  const isTeacherView = !!studentId;

  const columnName: 'pre_physical_fitness_test' | 'post_physical_fitness_test' =
    testType === 'pre-test' ? 'pre_physical_fitness_test' : 'post_physical_fitness_test';

  const { data: studentInfo } = useQuery({
    queryKey: [...profileKeys.detail(targetUserId ?? ''), 'info'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profile')
        .select('full_name, email')
        .eq('uuid', targetUserId)
        .single();
      return data;
    },
    enabled: !!targetUserId,
  });

  const { data: pftResult, isLoading, isError } = useQuery({
    queryKey: [...pftKeys.session(targetUserId ?? ''), columnName],
    queryFn: async (): Promise<PFTSessionData> => {
      if (isTeacherView) {
        const { data: exists } = await supabase
          .from('profile')
          .select('uuid')
          .eq('uuid', targetUserId)
          .single();
        if (!exists) throw new Error('Student not found');
      }

      const { data, error } = await supabase
        .from('physical_fitness_test')
        .select(columnName)
        .eq('uuid', targetUserId)
        .single();
      if (error) throw error;

      const pftData = data?.[columnName] as PFTSessionData | null;
      const finishedTests = pftData?.finishedTestIndex;
      if (!finishedTests) throw new Error('No test data');
      const max = finishedTests.length - 1;
      if (!finishedTests.includes(max)) throw new Error('Test not completed');

      return pftData;
    },
    enabled: !!targetUserId,
    retry: false,
  });

  const dataResults = pftResult ? getSummary(pftResult) : null;

  if (isLoading || !userId) return <Loading />;
  if (isError || !dataResults) return <ErrorMessage text="Error 400" subText="Bad Request" />;

  return (
    <section id="physical-fitness-test-summary" className="parent-container">
      <PageHeading text="Physical Fitness Test" />
      <div id="summary-content" className="content-container">
        <h1 className="w-full text-left text-3xl lg:text-4xl font-heading lg:-ml-20 lg:mb-5 font-medium text-primary-blue">
          {testType === 'pre-test' ? 'Pre Test' : 'Post Test'} Record
        </h1>
        {studentInfo && (
          <div className="w-full mb-5 p-4 bg-gray-100 rounded-lg lg:-ml-20">
            <h2 className="text-xl font-medium text-gray-800 mb-2">Student Information</h2>
            <p className="text-gray-700"><strong>Name:</strong> {studentInfo.full_name}</p>
            <p className="text-gray-700"><strong>Email:</strong> {studentInfo.email}</p>
          </div>
        )}
        <div className="w-full flex flex-col space-y-5 mb-10">
          {dataResults.map((summary, index) => (
            <Fragment key={`${summary.title} ${index}`}>
              {(() => {
                const sectionHeadings: Record<number, string> = {
                  0: 'A. Body Mass Index',
                  1: 'B. Cardiovascular Endurance',
                  2: 'C. Strength',
                  3: 'D. Flexibility',
                };
                const heading = sectionHeadings[index];
                return heading ? (
                  <Fragment>
                    <h1 className="text-2xl lg:text-3xl font-heading lg:-ml-5 mb-0 font-medium">{heading}</h1>
                    <hr className="w-1/3 border-1 border-primary-yellow mb-4 -ml-5" />
                  </Fragment>
                ) : null;
              })()}
              <TableSummary summary={summary} />
            </Fragment>
          ))}
        </div>
      </div>
      <Footer />
    </section>
  );
}

const TableColumn = ({ columnContent }: { columnContent: string[] }) => (
  <tr>
    {columnContent.map((content, index) => (
      <td
        key={`data ${index}`}
        className={`${index === 0 ? 'border-l-0!' : ''} text-xs font-semibold lg:text-base text-center font-content w-15 h-15 border-l-2 lg:border-l-4 border-t-4 border-secondary-dark-blue`}
      >
        {content}
      </td>
    ))}
  </tr>
);

const TableHeading = ({ headings }: { headings: string[] }) => (
  <tr>
    {headings.map((heading, index) => (
      <th
        key={heading}
        className={`${index === 0 ? 'border-l-0!' : ''} text-xs lg:text-base h-10 lg:h-20 text-center font-content border-l-2 lg:border-l-4 text-white bg-secondary-dark-blue border-white`}
      >
        {heading}
      </th>
    ))}
  </tr>
);

interface SummaryRow {
  hasParentHeading: boolean;
  parentHeading: string | string[];
  title: string;
  number: string;
  headings: string[];
  content: string[];
}

const TableSummary = ({ summary }: { summary: SummaryRow }) => (
  <div id="summary">
    <div className="flex flex-row font-heading space-x-2 lg:text-lg">
      <p>{summary.number}.</p>
      <p>{summary.title}</p>
    </div>
    <hr className="w-20 border-1 border-primary-yellow mb-3" />
    <div id="table-container" className="rounded-md overflow-hidden border-5 border-secondary-dark-blue h-fit w-full">
      <table className="w-full h-full">
        <tbody>
          <tr className={`${summary.hasParentHeading ? '' : 'hidden'}`}>
            <th className="lg:text-base text-sm text-center font-bold font-content h-10 border-b-4 border-white" colSpan={summary.headings.length}>
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

interface HandleDataParams {
  data: PFTTestResult;
  hasParentHeading?: boolean;
  parentHeading?: string;
  number: number;
  unit?: string;
}

function handleData({ data, hasParentHeading = false, parentHeading = '', number, unit = '' }: HandleDataParams): SummaryRow {
  return {
    hasParentHeading,
    parentHeading: [parentHeading],
    title: data.title,
    number: number.toString(),
    headings: ['Record', 'Classification', 'Time Started', 'Time Ended'],
    content: [`${data.record} ${unit}`, data.classification, data.timeStarted, data.timeEnd],
  };
}

interface CustomHandleDataParams {
  title: string;
  hasParentHeading?: boolean;
  parentHeading?: string | string[];
  headings?: string[];
  content?: string[];
  number: number;
}

function customHandleData({ title, hasParentHeading = false, parentHeading = '', headings = [], content = [], number }: CustomHandleDataParams): SummaryRow {
  return { hasParentHeading, parentHeading, title, number: number.toString(), headings, content };
}

function getSummary(data: PFTSessionData): SummaryRow[] {
  const bmi = getBMI(
    Number(data.bmiHeight?.record),
    Number(data.bmiWeight?.record),
    'cm',
    'kg',
  );
  return [
    customHandleData({
      title: 'Body Mass Index',
      headings: ['Height', 'Weight', 'BMI', 'Classification'],
      content: [
        `${data.bmiHeight?.record} cm`,
        `${data.bmiWeight?.record} kg`,
        `${bmi.toFixed(2)}`,
        `${getBMICategory(bmi)}`,
      ],
      number: 1,
    }),
    customHandleData({
      title: '3 Minute Step Test',
      hasParentHeading: true,
      parentHeading: ['Heart Rate per Minute'],
      headings: ['Before the Activity', 'After the Activity'],
      content: [
        `${data.preStepTest?.record} Beats per Minute`,
        `${data.stepTest?.record} Beats per Minute`,
      ],
      number: 2,
    }),
    handleData({ data: data.pushUp!, number: 3 }),
    handleData({ data: data.basicPlank!, unit: 'Second(s)', number: 4 }),
    handleData({ data: data.zipperTestRight!, hasParentHeading: true, unit: 'cm', parentHeading: 'Overlap/Gap (centimeters)', number: 5 }),
    handleData({ data: data.zipperTestLeft!, hasParentHeading: true, unit: 'cm', parentHeading: 'Overlap/Gap (centimeters)', number: 6 }),
    handleData({ data: data.sitAndReachFirst!, hasParentHeading: true, unit: 'cm', parentHeading: 'Score (centimeters)', number: 7 }),
    handleData({ data: data.sitAndReachSecond!, hasParentHeading: true, unit: 'cm', parentHeading: 'Score (centimeters)', number: 8 }),
  ];
}
