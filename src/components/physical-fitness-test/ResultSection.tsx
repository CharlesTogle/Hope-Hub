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
      className='relative mt-5 mb-5 overflow-x-hidden rounded-2xl border border-[#c4d4f2] bg-[#111c4e] p-5 font-content text-white shadow-[0_14px_35px_rgba(17,28,78,0.2)] lg:mt-0 lg:mb-5 lg:p-10'
    >
      <div id='heading' className='flex flex-row  justify-between items-center'>
        <h1 className='text-3xl font-bold mb-3'>Results</h1>
        <hr className='font-md text-2xl -mr-10 mb-1 w-[50%] border-1 border-primary-yellow' />
      </div>
      <hr className='w-[50%] border-1 border-primary-yellow' />
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
                    className='border-r border-r-[#6573a5] p-1 text-white lg:text-lg md:text-sm sm:text-xs'
                  >
                    {label}
                  </label>
                  <div className='ml-2 flex min-w-0 items-center gap-2'>
                     <input
                       onClick={(event) => {
                         if (label === 'Time End') {
                           event.currentTarget.showPicker?.();
                         }
                       }}
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
                       step={label === 'Time End' ? 60 : undefined}
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
                      className={`min-w-0 flex-1 rounded-lg border border-[#b7c9ed] bg-white px-2 py-2 text-center font-content text-[#111c4e] outline-none focus:border-primary-yellow focus:ring-2 focus:ring-primary-yellow ${
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
        <hr className='absolute -bottom-3 right-0 w-[35%] border-1 border-[#6573a5]' />
      </div>
      <div id='button' className='flex flex-row items-center justify-between'>
        {isTeacher && (
          <button
            onClick={() => handleBack()}
            type='button'
            className={`mt-5 rounded-lg border border-[#ffbc13] bg-[#ffbc13] px-5 py-2 text-sm font-semibold text-[#111c4e] hover:bg-[#ffd45c] cursor-pointer ${
              isTeacher && 'mt-8!'
            } disabled:border-[#6573a5] disabled:bg-[#6573a5] disabled:text-white disabled:hover:bg-[#6573a5] disabled:cursor-not-allowed`}
            disabled={testNumber === 0}
          >
            Back
          </button>
        )}
        {!isTeacher && <hr className='-ml-10 w-[50%] border-1 border-[#6573a5]' />}
        <button
          onClick={() => handleSubmit()}
          type='button'
          className={`mt-5 rounded-lg border border-[#ffbc13] bg-[#ffbc13] px-5 py-2 text-sm font-semibold text-[#111c4e] hover:bg-[#ffd45c] cursor-pointer ${
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
