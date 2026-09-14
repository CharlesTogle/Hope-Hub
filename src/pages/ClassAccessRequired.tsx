import { useLocation, useNavigate } from 'react-router-dom';

export default function ClassAccessRequired() {
  const navigate = useNavigate();
  const location = useLocation();
  const restrictedArea = location.pathname.startsWith('/lectures')
    ? 'lectures'
    : location.pathname.startsWith('/quizzes')
      ? 'quizzes'
      : 'this area';

  return (
    <section className='w-full h-screen flex flex-col justify-center items-center px-6 text-center bg-gray-background'>
      <h1 className='text-3xl font-heading text-primary-blue'>
        Please Join a Class first before accessing {restrictedArea}
      </h1>
      <p className='max-w-xl text-lg font-content mt-4'>
        Lectures, quizzes, and physical fitness tests are available after you join a class.
      </p>
      <button
        type='button'
        className='mt-6 px-6 py-3 bg-accent-blue text-white rounded-sm font-content font-semibold hover:brightness-90'
        onClick={() => navigate('/dashboard')}
      >
        Go to Dashboard to Join a Class
      </button>
    </section>
  );
}
