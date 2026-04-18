import React from 'react';

const Container = React.forwardRef(({ children, heading, className }, ref) => {
  return (
    <div className={`${className} w-full`} ref={ref}>
      <h1 className='text-lg md:text-xl px-5 py-3 md:px-15 md:py-7 rounded-t-lg bg-secondary-dark-blue text-white font-content text-center'>
        {heading}
      </h1>
      <div className='text-base flex flex-col rounded-b-lg border-2 border-secondary-dark-blue pr-6 pl-6 md:pr-10 md:pl-10 pt-8 pb-10 relative'>
        {children}
        <hr className='w-[50%] h-0 absolute border-1 border-primary-yellow bottom-7 left-0' />
      </div>
    </div>
  );
});

Container.displayName = 'Container';

export default Container;
