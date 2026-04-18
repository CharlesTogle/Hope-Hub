import { useEffect } from 'react';

export function AlertMessage ({
  text,
  onConfirm = () => {},
  onCancel = () => {},
}) {
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown); // Cleanup on unmount
    };
  }, [onCancel, onConfirm]);

  return (
    <div
      id='modal'
      className='w-full h-[100dvh] lg:h-screen transition-all duration-300 fixed top-0 flex justify-center items-center z-1 font-content'
    >
      <div
        id='background'
        className='w-full h-full bg-black opacity-50 absolute'
      ></div>
      <div
        id='modal-content'
        className='bg-secondary-dark-blue lg:w-[40%] h-fit z-2 flex flex-col justify-start items-center relative p-10 text-center rounded-md drop-shadow-sm'
      >
        <p className='text-white text-2xl font-semibold'>WARNING</p>
        <hr className='w-full mb-5' />
        <p className='text-white mb-15 text-wrap'>{text}</p>
        <div
          id='buttons'
          className='absolute bottom-10 right-10 flex space-x-5'
        >
          <button
            className='px-5 py-1 border-1 border-primary-yellow text-primary-yellow hover:brightness-80'
            onClick={() => onCancel()}
          >
            Cancel
          </button>
          <button
            className='px-5 py-1 border-1 border-primary-yellow bg-primary-yellow text-black hover:brightness-80'
            onClick={() => onConfirm()}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
