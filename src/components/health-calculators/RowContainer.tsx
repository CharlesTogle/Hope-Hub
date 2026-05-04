import React from 'react';
import type { ReactNode } from 'react';

const RowContainer = React.forwardRef<HTMLDivElement, { children: ReactNode }>(
  ({ children }, ref) => {
  return (
    <div
      className='grid grid-cols-1 lg:grid-cols-2 gap-5 my-2 md:gap-10 md:my-5 w-[95%]'
      ref={ref}
    >
      {children}
    </div>
  );
});

RowContainer.displayName = 'RowContainer';

export default RowContainer;
