import type { ReactNode, Ref } from 'react';

interface FormContainerProps {
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
  className?: string;
}

export default function FormContainer({ children, ref, className }: FormContainerProps) {
  return (
    <div
      className={`md:scale-90 p-8 flex justify-center flex-col bg-white gap-2.5 lg:min-w-[37%] lg:max-w-[37%] md:min-w-[50%] md:max-w-[50%] rounded-md ${className}`}
      ref={ref ?? undefined}
    >
      {children}
    </div>
  );
}
