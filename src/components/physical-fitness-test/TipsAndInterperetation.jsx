import { memo } from "react";

const TipsAndInterpretation = ({ testResults, testName, tips }) => {
  return (
    <div
      id='interpretation-and-tips'
      className='border-2 p-5 border-black rounded-2xl relative lg:p-10 overflow-x-hidden'
    >
      <div id='heading' className='flex flex-row items-center justify-between'>
        <h1 className='text-3xl font-md mb-3 font-bold font-content pr-2'>
          Interpretation
        </h1>
        <hr className='w-[50%] border-1 border-black -mr-10' />
      </div>
      <hr className='w-[50%] border-1 border-black mb-1' />
      <div id='interpretation' className='mb-3'>
        <h2 className='font-semibold text-lg font-content'>{testName}</h2>
        <p className='ml-2 font-bold text-lg font-content'>
          {testResults.reps} : {testResults.classification}
        </p>
      </div>
      <div id='tips' className='pb-10'>
        <h2 className='font-content text-sm font-semibold'>Tips to Improve</h2>
        <ul className='list-decimal ml-6 font-content text-sm font-medium'>
          {tips && tips.length > 0 ? (
            tips.map((tip, index) => <li key={index}>{tip}</li>)
          ) : (
            <>
              <li>No Available Tip</li>
            </>
          )}
        </ul>
      </div>
      <hr className='-ml-10 border-1 border-black w-[50%]' />
    </div>
  );
};

export default memo(TipsAndInterpretation);
