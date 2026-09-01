import { memo } from 'react';

interface TipsAndInterpretationProps {
  testResults: { reps: string; classification: string };
  testName: string;
  tips?: string[];
}

const TipsAndInterpretation = ({
  testResults,
  testName,
  tips,
}: TipsAndInterpretationProps) => {
  return (
    <div
      id='interpretation-and-tips'
      className='relative overflow-x-hidden rounded-2xl border border-[#c4d4f2] bg-white p-5 text-[#111c4e] shadow-[0_14px_35px_rgba(17,28,78,0.09)] lg:p-10'
    >
      <div id='heading' className='flex flex-row items-center justify-between'>
        <h1 className='text-3xl font-md mb-3 font-bold font-content pr-2'>
          Interpretation
        </h1>
        <hr className='-mr-10 w-[50%] border-1 border-primary-yellow' />
      </div>
      <hr className='mb-1 w-[50%] border-1 border-primary-yellow' />
      <div id='interpretation' className='mb-3'>
        <h2 className='font-semibold text-lg font-content'>{testName}</h2>
        {testResults.reps && (
          <p className='ml-2 font-bold text-lg font-content'>
            {testResults.reps} : {testResults.classification}
          </p>
        )}
      </div>
      <div id='tips' className='pb-10'>
        <h2 className='font-content text-sm font-semibold'>Tips to Improve</h2>
        <ul className='list-decimal ml-6 font-content text-sm font-medium'>
          {tips && tips.length > 0 ? (
            tips.map((tip) => <li key={tip}>{tip}</li>)
          ) : (
            <li>No Available Tip</li>
          )}
        </ul>
      </div>
      <hr className='-ml-10 w-[50%] border-1 border-[#c4d4f2]' />
    </div>
  );
};

export default memo(TipsAndInterpretation);
