import { Link } from 'react-router-dom';

interface HealthCalculatorButtonProps {
  text: string;
  className?: string;
  linkTo: string;
}

export default function HealthCalculatorButton({
  text,
  className,
  linkTo,
}: HealthCalculatorButtonProps) {
  return (
    <Link to={linkTo} className='block hover:contrast-125'>
      <div
        id='calculator-button'
        className={`${className} bg-secondary-dark-blue text-white py-6 rounded mb-6`}
      >
        <p className='font-content text-xs md:text-base lg:text-2xl text-center text-white'>
          {text}
        </p>
      </div>
    </Link>
  );
}
