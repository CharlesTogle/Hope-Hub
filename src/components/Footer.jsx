import React from 'react';
import InstagramIcon from '@/assets/icons/instagram_icon.png';
import TwitterIcon from '@/assets/icons/twitter_icon.png';
import YoutubeIcon from '@/assets/icons/youtube_icon.png';
import FacebookIcon from '@/assets/icons/facebook_icon.png';

const Icons = [InstagramIcon, TwitterIcon, YoutubeIcon, FacebookIcon];

export default function Footer () {
  return (
    <footer className='mt-10 flex flex-col lg:flex-row bg-[#121212] lg:min-h-[30vh] lg:max-h-[30vh] lg:h-[30vh] w-full lg:items-center justify-evenly p-5'>
      <p className='text-primary-blue font-content w-full lg:w-1/3 lg:pl-10 text-lg lg:text-3xl font-semibold italic'>
        Discover your health strenghten your body unlock your potential
      </p>
      <hr className='lg:h-30 lg:w-px w-full border-1 border-primary-yellow my-4 lg:my-0 lg:mx-10' />
      <div className='lg:w-6/10 flex flex-col'>
        <p className='text-white text-left lg:text-center lg:mt-5 text-xs lg:text-sm'>
          The Hope Hub, we believe in the Power of Physical Education to inspire
          change and create a lasting impact on well-being. Whether you're
          teaching the next generation of students or building your own fitness
          knowledge, we're here to guide you every step of the way.{' '}
        </p>
        <div className='flex flex-row w-full justify-center gap-2 mt-4'>
          {Icons.map((icon, index) => (
            <img src={icon} key={index} className='w-10 cursor-pointer' />
          ))}
        </div>
      </div>
    </footer>
  );
}
