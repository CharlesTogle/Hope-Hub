export default function Banner ({
  name = 'name',
  classCode = '123a45',
  onClassLeave = () => {},
  onClassJoinOpen = () => {},
  isStudent = true,
}) {
  return (
    <div
      id='banner'
      className={`bg-gradient-to-r from-[#111C4E] to-[#004AAD] w-full font-content text-white lg:p-10 pl-5 py-5 text-xl rounded-md ${
        isStudent ? 'grid grid-cols-[60%_10%_25%]' : 'flex'
      }`}
    >
      <div className=''>
        <p
          className={`${
            isStudent ? 'text-xs' : 'text-sm mr-2'
          } font-bold lg:text-base`}
        >
          Welcome Back, {name}!
        </p>
        <p
          className={` ${
            isStudent ? 'text-sm' : 'text-base'
          } lg:text-base mr-2`}
        >
          Embark on your journey to achieve your fitness goals and unlock your
          full potential today!
        </p>
      </div>
      {isStudent && (
        <>
          <div className='flex items-center justify-center h-full'>
            <div className='w-px h-full bg-white mx-auto' />
          </div>
          <div
            id='class-code'
            className='flex items-center justify-center flex-col'
          >
            <div className='flex flex-col text-center lg:flex-row lg:gap-1'>
              <p
                className={`font-content italic  ${
                  classCode
                    ? 'text-left lg:mb-5 lg:text-lg text-xs'
                    : 'text-center text-xs lg:text-lg'
                }`}
              >
                {(classCode && 'Class Code: ') ||
                  'Currently not enrolled in a class'}
              </p>
              <span className='text-primary-yellow font-bold text-xs lg:text-lg mb-3 lg:mb-0'>
                {classCode}
              </span>
            </div>

            <button
              className='bg-[#DB4E34] rounded-md w-full lg:py-3 py-2 text-xs italic hover:brightness-90'
              onClick={
                classCode ? () => onClassLeave() : () => onClassJoinOpen()
              }
            >
              {classCode ? 'Leave Class' : 'Join Class'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
