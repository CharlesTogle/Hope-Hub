export default function PageHeading ({ text, className }) {
  return (
    <div
      id='page-heading'
      className={`${className} min-h-fit py-3 flex justify-center items-center flex-col border-b-2 border-black text-center lg:min-h-[25vh]`}
    >
      <h1 className='text-center text-primary-blue font-heading text-xl md:text-3xl lg:text-5xl '>
        {text}
      </h1>
      <hr className='w-[40%] lg:w-[20%] border-1 border-primary-yellow m-3' />
      <p className='text-xl font-heading lg:text-2xl md:text-xl'>
        Power of Physical Education
      </p>
    </div>
  );
}
