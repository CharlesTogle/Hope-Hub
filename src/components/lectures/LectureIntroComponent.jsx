import { motion } from 'motion/react';

export default function LectureIntroduction ({
  lectureKey,
  title,
  introduction,
  status,
  onClick = () => {},
  isTeacher = false,
}) {
  const getStatusClass = () => {
    if (status === 'Incomplete') return 'bg-red';
    if (status === 'Done') return 'bg-green';
    if (status === 'Pending') return 'bg-accent-orange';
    return ''; // Default class if no match
  };

  return (
    <motion.div
      whileHover={{
        scale: 1.03,
        transition: { duration: 0.3 },
      }}
      whileTap={{
        scale: 0.97,
        transition: { duration: 0.3 },
      }}
    >
      <div
        id='lecture-introduction'
        className='border-3 border-black rounded-md cursor-pointer group'
        onClick={() => onClick()}
      >
        <div id='content' className='flex flex-col  pb-5'>
          <div
            id='heading'
            className='flex flex-row justify-between py-5 px-3 items-center bg-secondary-dark-blue mb-3 lg:px-5 group-hover:brightness-110'
          >
            <p className='text-white font-content font-bold text-sm lg:text-lg'>
              Lecture #{lectureKey}:{' '}
              <span className='font-semibold text-white ml-3'>{title}</span>
            </p>
            {!isTeacher && (
              <p
                className={`${getStatusClass()} ml-1.5 mr-1.5 font-content text-white w-[12%] min-w-fit text-center text-md py-1 font-medium px-2 lg:mr-5`}
              >
                {status}
              </p>
            )}
          </div>
          <div
            id='introduction'
            className='px-3 font-content text-xs lg:text-base lg:px-5'
          >
            <p className='font-bold'>Introduction</p>
            <ul className='list-disc text-justify mt-2 px-5 lg:px-10'>
              <li> {introduction}</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
