import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CalculatorDropdown () {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const calculatorOptions = [

    { label: 'BMI Calculator', value: 'bmi', path: '/health-calculators/bmi' },
    { label: 'BMR Calculator', value: 'bmr', path: '/health-calculators/bmr' },
    { label: 'IBW Calculator', value: 'ibw', path: '/health-calculators/ibw' },
    { label: 'Water Intake Calculator', value: 'waterintake', path: '/health-calculators/waterintake' },
    { label: 'Body Fat Percentage Calculator', value: 'bodyfatpercentage', path: '/health-calculators/bodyfatpercentage'},
    { label: 'Karvonen Heart Rate Calculator', value: 'heartrate', path: '/health-calculators/heartrate'},
  ];

  // Get current calculator based on URL
  const getCurrentCalculator = () => {
    const currentPath = location.pathname;
    const currentCalculator = calculatorOptions.find(
      option => option.path === currentPath,
    );
    return currentCalculator ? currentCalculator.label : 'Select Calculator';
  };

  const handleOptionSelect = option => {
    setIsOpen(false);
    navigate(option.path);
  };
  return (
    <div className='relative w-auto ml-auto mb-10'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='w-full bg-secondary-dark-blue border-2 border-secondary-dark-blue rounded-lg px-4 py-3 flex flex-row flex-1/2 justify-between items-center hover:bg-blue-800 transition-colors pr-3'
      >
        <span className='text-xs md:text-base font-content mr-5 text-white font-medium'>
          {getCurrentCalculator()}
        </span>
        <svg
          className={`w-5 h-5 text-white transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </button>{' '}
      {isOpen && (
        <div className='absolute top-full left-0 right-0 mt-1 bg-secondary-dark-blue border-2 border-secondary-dark-blue rounded-lg shadow-lg z-50'>
          {calculatorOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option)}
              className='w-full px-4 py-3 text-left text-xs md:text-base font-content text-white hover:bg-primary-yellow hover:text-secondary-dark-blue transition-colors first:rounded-t-md last:rounded-b-md'
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
