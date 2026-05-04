import { useNavigate } from 'react-router-dom';

interface PageHeadingProps {
  className?: string;
}

export default function PageHeading({ className }: PageHeadingProps) {
  const navigate = useNavigate();
  return (
    <div
      id='page-heading'
      className={`${className} h-[15vh] md:h-[20vh] flex justify-center items-center flex-col text-center lg:h-[20vh]`}
    >
      <h1
        className='text-center font-heading text-4xl lg:text-5xl text-white cursor-pointer'
        onClick={() => navigate('/home')}
      >
        Hope Hub
      </h1>
      <hr className='w-[40%] lg:w-[20%] border-1 border-primary-yellow m-3' />
      <p className='text-2xl font-heading lg:text-2xl text-primary-yellow'>
        Power of Physical Education
      </p>
    </div>
  );
}
