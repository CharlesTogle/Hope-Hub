export default function VideoHeading ({ text = 'This is a heading' }) {
  return (
    <div className='relative'>
      <div>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='265'
          height='52'
          viewBox='0 0 265 52'
          fill='none'
        >
          <path d='M0 0H231L264.5 26L231 52H0V0Z' fill='#FFBC13' />
        </svg>
      </div>
      <p className='absolute right-1/3 bottom-1/2 translate-y-1/2 font-heading text-lg'>
        {text}
      </p>
    </div>
  );
}
