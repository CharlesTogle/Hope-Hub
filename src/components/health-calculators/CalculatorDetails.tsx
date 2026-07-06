import { renderHtml } from '@/utilities/render-html';

interface CalculatorDetailsProps {
  name: string;
  details: string;
}

export function CalculatorDetails({ name, details }: CalculatorDetailsProps) {
  return (
    <div className='w-full flex flex-col'>
      <h2 className='text-2xl md:text-3xl text-primary-blue font-heading-small'>{name}:</h2>
      <hr className='h-0 w-60 border-1 border-primary-yellow mt-2 mb-3' />
      <p className='font-content mb-10 text-xs md:text-base text-justify ml-10'>
        {renderHtml(details)}
      </p>
    </div>
  );
}
