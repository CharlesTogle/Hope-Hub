export function CalculatorDetails ({ name, details }) {
  return (
    <div className='w-full flex flex-col'>
      <h2 className='text-2xl md:text-3xl text-primary-blue font-heading-small'>{name}:</h2>
      <hr className='h-0 w-60 border-1 border-primary-yellow mt-2 mb-3' />
      <p dangerouslySetInnerHTML={{ __html: details}} className='font-content mb-10 text-xs md:text-base text-justify ml-10'/>
    </div>
  );
}
