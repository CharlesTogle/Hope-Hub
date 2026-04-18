import bannerHome from '@/assets/banner_home.svg';
import HomePageHero from '@/assets/images/gym_homepage.png';
import HopeHubPicture from '@/assets/images/home-pic.png';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
export default function Home () {
  const navigate = useNavigate();
  const handleStart = () => {
    navigate('/dashboard');
  };

  return (
    <div
      id='home'
      className='flex items-center w-full font-content h-full flex-col pt-5'
    >
      <section id='hero' className='relative w-full flex items-center flex-col'>
        <img
          src={bannerHome}
          alt='home-banner'
          className='w-[95%] lg:w-[85%]'
        />
        <div className='absolute  aspect-square border-2 border-primary-yellow lg:w-40 lg:right-275 lg:top-50 -z-1'></div>
        <div className='absolute border-2 border-secondary-dark-blue lg:w-70 lg:h-40 lg:top-55 lg:right-110 -z-1'></div>
        <div className='absolute aspect-square border-2 border-primary-yellow lg:w-40 lg:top-25 lg:right-60 -z-1'></div>
        <div className='hidden absolute border-2 border-primary-yellow w-70 h-50 top-170 right-250 -z-1 lg:block'></div>
        <div className='hidden absolute border-2 border-secondary-dark-blue w-40 h-30 top-200 right-135 -z-1 lg:block'></div>
        <div className='hidden absolute border-2 border-primary-yellow w-40 h-30 top-170 right-50 -z-1 lg:block'></div>
        <div
          id='content'
          className='w-[95%] flex flex-row justify-center gap-5 mt-10 mb-10 lg:mt-25 lg:mb-25 lg:gap-30 '
        >
          <img
            src={HomePageHero}
            alt='UMak Gym'
            className='w-[60%] h-fit lg:w-[40%] aspect-square'
          />
          <div className='flex flex-col justify-center items-start'>
            <h1 className='font-heading text-lg text-primary-blue lg:text-4xl'>
              Fuel your future <br /> with movement
            </h1>
            <hr className='w-2/3 border-1 border-primary-yellow mt-2 mb-3' />
            <p className='text-xs lg:text-xl'>
              "Building a community of <br /> health, fitness, and <br />{' '}
              lifelong learning."
            </p>
            <button
              className='py-1 px-2 text-sm mt-3 bg-secondary-dark-blue text-white mr-auto ml-auto rounded-lg hover:brightness-85 lg:text-base lg:px-6 lg:py-3  lg:mt-10 '
              onClick={() => handleStart()}
            >
              Start your Journey
            </button>
          </div>
        </div>
      </section>
      <section className='w-full flex justify-center flex-col items-center pb-10'>
        <iframe
          src='https://www.youtube.com/embed/IGxerNuSnoo?si=GA9kKbt6alZFR-lQ&loop=1'
          className='mb-10 w-full aspect-video'
        ></iframe>

        <p className='text-base mb-2 lg:text-lg'>With us, you are home</p>
        <h2 className='text-4xl pr-3 pl-3 text-primary-yellow font-heading text-center lg:p-0 lg:text-6xl '>
          Welcome to Hope Hub Web!
        </h2>
        <p className='lg:text-center text-justify w-[90%] mt-5 mb-10'>
          The Hope Hub, we believe in the Power of Physical Education to inspire
          change and create a lasting impact on well-being. Whether you're
          teaching the next generation of students or building your own fitness
          knowledge, we're here to guide you every step of the way.
        </p>
        <div className='px-3 lg:pt-10 md:flex md:items-center md:justify-center md:flex-col lg:flex lg:flex-row lg:justify-center lg:items-center lg:space-x-15'>
          <img
            src={HopeHubPicture}
            alt='Hope Hub Picture'
            className='lg:w-1/2 w-full lg:h-[120%] object-cover '
          />
          <p className='mt-10 text-justify lg:mt-0 lg:w-4/10 pr-2 pl-2 lg:p-0 lg:text-justify'>
            The Hope Hub is dedicated to supporting both teachers and students
            in the field of Physical Education and Health. This platform
            provides resources designed to enhance learning experience and
            promote a healthy, active lifestyle. For educators, we offer
            innovative lesson plans, teaching strategies, and professional
            development materials to foster engaging and effective physical
            education programs. For students, we provide fitness tips, injury
            prevention guidance, and motivation to help them succeed in their
            physical education journey.
          </p>
        </div>
      </section>
      <Footer></Footer>
    </div>
  );
}
