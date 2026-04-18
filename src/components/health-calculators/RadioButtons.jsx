import { useState } from 'react';

export default function RadioButton ({
  choices,
  value,
  setValue,
  name,
  text,
  showBodyFat = false,
  bodyFatValue = '',
  onBodyFatChange,
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const handleChange = selectedValue => {
    setDisplayValue(selectedValue);
    setValue(selectedValue);
  };

  const [shown, setShown] = useState(false);

  return (
    <div className='radio-group font-content border-1 border-black rounded-2xl px-3 pt-3 pb-2'>
      <div
        className='flex flex-col md:flex-row gap-2 md:gap-5 items-center justify-between md:mb-3 cursor-pointer'
        onClick={() => setShown(prev => !prev)}
      >
        {text && (
          <label className='text-xs md:text-base w-full font-medium text-gray cursor-pointer text-justify'>
            {text}
          </label>
        )}
        <span className='text-xs md:text-base w-full text-justify'>
          <span className='font-semibold'>Selected:</span> {displayValue}
        </span>
        <p className='contrast-25 cursor-pointer'>{shown ? '▲' : '▼'}</p>
      </div>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          shown ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className='overflow-hidden'>
          <div className='space-y-2 font-content'>
            {choices.map((choice, index) => {
              const isLastChoice = index === choices.length - 1;

              return (
                <div
                  key={index}
                  className={`flex items-center ${
                    isLastChoice && showBodyFat ? 'justify-between' : ''
                  }`}
                >
                  <div className='flex items-center'>
                    <input
                      type='radio'
                      id={`${name}-${index}`}
                      name={name}
                      value={choice.value || choice}
                      checked={value === (choice.value || choice)}
                      onChange={() => handleChange(choice.value || choice)}
                      className='w-4 h-4 text-primary-blue bg-gray-100'
                    />
                    <label
                      htmlFor={`${name}-${index}`}
                      className='ml-2 text-xs md:text-base text-gray-900 cursor-pointer'
                    >
                      {choice.label || choice}
                    </label>
                  </div>

                  {isLastChoice && showBodyFat && (
                    <div className='flex flex-col md:flex-row p-1 items-center gap-1 bg-gray-50 px-2 rounded-lg border'>
                      <label
                        htmlFor='body-fat'
                        className='text-xs md:text-base text-gray-700'
                      >
                        Body Fat %
                      </label>
                      <input
                        type='number'
                        name='body-fat'
                        id='body-fat'
                        value={bodyFatValue}
                        onChange={onBodyFatChange}
                        min='5'
                        max='50'
                        step='0.1'
                        className='text-xs md:text-base my-1 bg-white border border-gray-300 rounded-md w-20 sm:w-20 px-2 py-1 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue'
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
