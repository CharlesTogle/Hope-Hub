export default function CalculatorContainer ({
  children,
  heading,
  onClear,
  onCalculate,
}) {
  return (
    <div>
      <h1 className='text-lg md:text-xl px-5 py-3 md:px-15 md:py-7 rounded-t-lg bg-secondary-dark-blue text-white font-content text-center'>
        {heading}
      </h1>
      <div className='flex flex-col rounded-b-lg border-2 border-secondary-dark-blue pr-3 pl-3 pt-5 pb-3 md:pr-15 md:pl-15 md:pt-8 md:pb-5 relative'>
        <hr className='h-0 w-[40%] border-1 border-primary-yellow absolute top-4 self-center' />
        {children}{' '}
        <div className='font-content mb-3 mt-7 flex flex-col md:flex-row justify-center gap-2 md:gap-4 relative items-center'>
          <button
            className='text-xs md:text-base py-1 w-full border-1 rounded-sm border-secondary-dark-blue cursor-pointer hover:brightness-90 bg-white'
            onClick={() => onClear()}
          >
            Clear
          </button>
          <button
            className='text-xs md:text-base border-1 py-1 w-full rounded-sm text-white border-secondary-dark-blue bg-secondary-dark-blue cursor-pointer hover:brightness-90'
            onClick={() => onCalculate()}
          >
            Calculate
          </button>
        </div>
      </div>
    </div>
  );
}
