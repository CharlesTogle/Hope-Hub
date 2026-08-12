interface ErrorMessageProps {
  title: string;
  description: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export default function ErrorMessage({
  title,
  description,
  onRetry,
  onBack,
}: ErrorMessageProps) {
  return (
    <section
      role='alert'
      className='w-full h-screen flex flex-col justify-center items-center px-6 text-center'
    >
      <h1 className='text-3xl font-content font-bold'>{title}</h1>
      <p className='text-2xl font-content mt-3'>{description}</p>
      {(onRetry || onBack) && (
        <div className='flex gap-3 mt-6'>
          {onRetry && (
            <button
              type='button'
              className='px-5 py-2 bg-accent-blue text-white rounded-sm hover:brightness-90'
              onClick={onRetry}
            >
              Try again
            </button>
          )}
          {onBack && (
            <button
              type='button'
              className='px-5 py-2 border border-accent-blue text-accent-blue rounded-sm hover:brightness-90'
              onClick={onBack}
            >
              Go back
            </button>
          )}
        </div>
      )}
    </section>
  );
}
