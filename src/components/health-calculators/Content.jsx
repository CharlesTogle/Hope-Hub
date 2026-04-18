export default function Content ({ title, content }) {
  return (
    <div className='w-full flex flex-col text-wrap'>
      <h2 className='text-xl md:text-2xl text-primary-blue font-content font-bold'>
        {title}:
      </h2>
      <hr className='h-0 w-60 border-1 border-primary-yellow mt-2 mb-4' />
      <div className='font-content text-justify text-wrap text-xs md:text-base [&_a]:inline-block [&_a]:max-w-full [&_a]:truncate [&_a]:align-top'>
        {content}
      </div>
    </div>
  );
}
