import PageHeading from '@/components/PageHeading';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import { Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import { getBMI } from '@/services/Calculations';
import { getBMICategory } from '@/utilities/bmi-category';
import { useQuery } from '@tanstack/react-query';
import { pftKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import type { PFTSessionData, PFTTestResult } from '@/types/physical-fitness';
import {
  fetchPftSummaryForViewer,
  type PFTSummaryRouteType,
} from '@/queries/pft-queries';
import { fetchTeacherClassOwnership } from '@/queries/dashboard-queries';
import { isFinishedTestIndexes } from '@/lib/pft-session';

export function PhysicalFitnessTestSummary() {
  const { testType, classCode, studentId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const userId = profile?.uuid ?? null;
  const isTeacher = profile?.user_type === 'teacher';
  const isTeacherView = Boolean(classCode && studentId);
  const isValidTestType =
    testType === 'pre-test' || testType === 'post-test';
  const targetUserId = isTeacherView ? studentId ?? null : userId;

  const {
    data: hasClassOwnership = false,
    isLoading: ownershipLoading,
    isError: ownershipError,
    refetch: refetchOwnership,
  } =
    useQuery({
      queryKey: ['class', 'ownership', userId ?? '', classCode ?? ''],
      queryFn: () =>
        fetchTeacherClassOwnership(userId ?? '', classCode ?? ''),
      enabled: isTeacherView && isTeacher && !!userId && !!classCode,
      retry: false,
    });

  const canLoadSummary =
    isValidTestType &&
    !!targetUserId &&
    (!isTeacherView || (isTeacher && hasClassOwnership));

  const {
    data: summaryRow,
    isLoading,
    isError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: pftKeys.summary(
      isTeacherView ? classCode ?? '' : 'self',
      targetUserId ?? '',
      testType ?? '',
    ),
    queryFn: () =>
      fetchPftSummaryForViewer(
        targetUserId ?? '',
        testType as PFTSummaryRouteType,
      ),
    enabled: canLoadSummary,
    retry: false,
  });

  const studentInfo = summaryRow
    ? {
        full_name: summaryRow.full_name,
        email: summaryRow.email,
      }
    : null;
  const pftResult = summaryRow?.pft_data ?? null;
  const dataResults = pftResult ? getSummary(pftResult) : null;
  const isCompleted = isFinishedTestIndexes(pftResult?.finishedTestIndex);

  if (!isValidTestType) {
    return (
      <ErrorMessage
        title='We could not find that test summary'
        description='The requested test type is not available.'
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  if (isTeacherView && !isTeacher) {
    return (
      <ErrorMessage
        title='You do not have access to this summary'
        description='Return to the dashboard to continue.'
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  if (isLoading || ownershipLoading || !userId) return <Loading />;
  if (ownershipError || isError) {
    return (
      <ErrorMessage
        title="We couldn't load your test summary"
        description='Check your connection and try again.'
        onRetry={() => void (ownershipError ? refetchOwnership() : refetchSummary())}
      />
    );
  }
  if (isTeacherView && !hasClassOwnership) {
    return (
      <ErrorMessage
        title='Class not found'
        description='We could not find that class or you may not have access to it.'
        onBack={() => navigate('/dashboard')}
      />
    );
  }
  if (isError || !dataResults || !isCompleted) {
    return (
      <ErrorMessage
        title='Your test summary is not ready'
        description='Complete the test before viewing its results.'
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <section id="physical-fitness-test-summary" className="min-h-[100dvh] bg-[#eef4ff] text-[#111c4e]">
      <PageHeading text="Physical Fitness Test" className="bg-[#111c4e] text-white border-[#111c4e] [&_h1]:text-white [&_p]:text-[#dce8ff]" />
      <div id="summary-content" className="content-container">
        <h1 className="w-full text-left text-3xl lg:text-4xl font-heading lg:-ml-20 lg:mb-5 font-medium text-primary-blue">
          {testType === 'pre-test' ? 'Pre Test' : 'Post Test'} Record
        </h1>
        {studentInfo && (
          <div className="mb-5 w-full rounded-2xl border border-[#c4d4f2] bg-white p-5 shadow-[0_12px_30px_rgba(17,28,78,0.08)] lg:-ml-20">
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
                    <h1 className="mb-0 font-heading text-2xl font-medium text-[#111c4e] lg:-ml-5 lg:text-3xl">{heading}</h1>
                    <hr className="mb-4 -ml-5 w-1/3 border-1 border-primary-yellow" />
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
        className={`${index === 0 ? 'border-l-0!' : ''} h-15 w-15 border-t-4 border-l-2 border-secondary-dark-blue text-center font-content text-xs font-semibold lg:border-l-4 lg:text-base`}
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
        className={`${index === 0 ? 'border-l-0!' : ''} h-10 border-l-2 border-white bg-secondary-dark-blue text-center font-content text-xs text-white lg:h-20 lg:border-l-4 lg:text-base`}
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
    <div id="table-container" className="h-fit w-full overflow-hidden rounded-xl border-4 border-secondary-dark-blue bg-white shadow-[0_10px_24px_rgba(17,28,78,0.1)]">
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
