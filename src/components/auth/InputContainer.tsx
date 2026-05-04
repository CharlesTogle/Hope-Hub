import type { ReactNode } from 'react';

interface InputContainerProps {
  children: ReactNode;
  className?: string;
}

export default function InputContainer({ children, className }: InputContainerProps) {
  return (
    <div id='form-inputs' className={`flex flex-col gap-3 ${className}`}>
      {children}
    </div>
  );
}
