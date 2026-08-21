import { Fragment, memo } from 'react';

interface TestResults {
  reps: string;
  timeStarted: string;
  timeEnded: string;
  classification: string;
}

interface ResultSectionProps {
  testResults: TestResults;
  testName: string;
  handleResultChange: (
    label: 'Record' | 'Time Started' | 'Time End',
    value: string | number,
  ) => void;
  handleSubmit: () => void;
  handleBack: () => void;
  unit?: string;
  isTeacher: boolean;
  testNumber: number;
}

const ResultSection = ({
  testResults,
  testName,
  handleResultChange,
  handleSubmit,
  handleBack,
  unit,
  isTeacher,
  testNumber,
}: ResultSectionProps) => {
  return (
    <div
      id='results'
      className='p-5 mt-5 mb-5 overflow-x-hidden border-2 border-black rounded-2xl relative font-content lg:p-10 lg:mb-5 lg:mt-0'
    >
      <div id='heading' className='flex flex-row  justify-between items-center'>
        <h1 className='text-3xl font-bold mb-3'>Results</h1>
        <hr className='font-md text-2xl w-[50%] border-1 border-black -mr-10 mb-1' />
      </div>
      <hr className='w-[50%] border-1 border-black' />
      <div id='data' className='flex flex-col relative ml-3'>
        <h2 className='font-semibold text-lg pointer-events-none'>
          {testName}
        </h2>
        <div id='inputs' className={`ml-2 grid ${!isTeacher && 'grid-cols-2'}`}>
          {isTeacher && (
            <div className='w-full text-center h-full xl:p-10 lg:p-5 md:px-20 sm:p-2 bg-gray-800 flex justify-center items-center font-semibold text-white'>
              <p>Teachers are to conduct PFTs only</p>
            </div>
          )}
          {!isTeacher && (
            <>
              {(['Record', 'Time Started', 'Time End'] as const).map((label, index) => (
                <Fragment key={`${index} ${label}`}>
                  <label
                    htmlFor={label}
                    className='p-1 lg:text-lg md:text-sm sm:text-xs border-r border-r-black'
                  >
                    {label}
                  </label>
                  <div className='ml-2 flex min-w-0 items-center gap-2'>
                    <input
                      onChange={(e) => {
                        let value: string | number = e.target.value;
                        if (label !== 'Time Started' && label !== 'Time End') {
                          value = Math.max(-1, Math.min(999, Number(value)));
                        }
                        handleResultChange(label, value);
                      }}
                      type={
                        label === 'Time Started' || label === 'Time End'
                          ? 'time'
                          : 'number'
                      }
                      min={
                        label === 'Time Started' || label === 'Time End'
                          ? undefined
                          : '-1'
                      }
                      max={
                        label !== 'Time Started' && label !== 'Time End'
                          ? '999'
                          : undefined
                      }
                      value={
                        label === 'Record'
                          ? testResults.reps
                          : label === 'Time Started'
                          ? testResults.timeStarted
                          : testResults.timeEnded
                      }
                      disabled={label === 'Time Started' || isTeacher}
                      name={label}
                      id={label}
                      className={`min-w-0 flex-1 h-fit border-1 border-black text-center font-content rounded-sm lg:px-2 ${
                        label === 'Time End'
                          ? '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator:hover]:opacity-60'
                          : ''
                      }`}
                    />
                    {label === 'Record' && unit && (
                      <span className='shrink-0 font-semibold'>
                        {unit}
                      </span>
                    )}
                  </div>
                </Fragment>
              ))}
            </>
          )}
        </div>
        <hr className='absolute -bottom-3 right-0 w-[35%] border-1 border-black' />
      </div>
      <div id='button' className='flex flex-row items-center justify-between'>
        {isTeacher && (
          <button
            onClick={() => handleBack()}
            type='button'
            className={`border-1 border-black rounded-md px-5 py-2 mt-5 text-sm bg-white hover:brightness-95 cursor-pointer ${
              isTeacher && 'mt-8!'
            } disabled:bg-gray-200 disabled:hover:brightness-100 disabled:cursor-not-allowed`}
            disabled={testNumber === 0}
          >
            Back
          </button>
        )}
        {!isTeacher && <hr className='-ml-10 border-1 border-black w-[50%]' />}
        <button
          onClick={() => handleSubmit()}
          type='button'
          className={`border-1 border-black rounded-md px-5 py-2 mt-5 text-sm bg-white hover:brightness-95 cursor-pointer ${
            isTeacher && 'mt-8!'
          }`}
        >
          {isTeacher ? 'Next' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default memo(ResultSection);
