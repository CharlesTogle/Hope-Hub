import { useNavigate } from 'react-router-dom';

interface FormHeadingProps {
  heading: string;
  callToAction?: string;
  action?: string;
  link?: string;
}

export default function FormHeading({ heading, callToAction, action, link }: FormHeadingProps) {
  const navigate = useNavigate();
  return (
    <div className='text-black text-center font-content flex flex-col gap-1.5'>
      <h1 className='text-4xl font-bold'>{heading}</h1>
      <p className='text-lg font-medium'>
        {callToAction}{' '}
        <span
          className='text-accent-light-blue cursor-pointer'
          onClick={() => navigate(`${link}`)}
        >
          {action}
        </span>
      </p>
    </div>
  );
}
