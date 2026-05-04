import AuthBG from '@/assets/images/generic_bg.png';
import PageHeading from '@/components/auth/PageHeading';
import type { ReactNode } from 'react';

interface AuthContainerProps {
  children: ReactNode;
}

export default function AuthContainer({ children }: AuthContainerProps) {
  return (
    <section
      id='auth-container relative'
      className='min-h-screen min-w-screen  bg-cover bg-center bg-no-repeat'
      style={{ backgroundImage: `url(${AuthBG})` }}
    >
      <PageHeading className={'border-0'} />
      <div className='flex justify-center max-w-screen overflow-x-hidden items-center w-full min-h-[65svh] lg:min-h-0 md:scale-75 lg:scale-100 bg-cover bg-center bg-no-repeat'>
        {children}
      </div>
    </section>
  );
}
