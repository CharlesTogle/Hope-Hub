import PageHeading from '@/components/PageHeading';
import Logo from '../assets/logos/hopehub_logo_v2.png';
import EmailIcon from '../assets/icons/email_about.png';
import ContactIcon from '../assets/icons/contact_about.png';
import FacebookIcon from '../assets/icons/facebook_about.png';
import InstagramIcon from '../assets/icons/instagram_about.png';
import Footer from '@/components/Footer';

export default function About () {
  const AboutText = `The Hope Hub, we believe in the Power of Physical Education to inspire
          change and create a lasting impact on well-being. Whether you're
          teaching the next generation of students or building your own fitness
          knowledge, we're here to guide you every step of the way.`;

  const Contacts = [
    {
      type: 'Email',
      text: 'HopeHub@sample.com',
      icon: EmailIcon,
    },
    {
      type: 'Facebook',
      text: 'The Hope Hub',
      icon: FacebookIcon,
    },
    {
      type: 'Contact',
      text: 'Maureen Del Rosario',
      icon: ContactIcon,
    },

    {
      type: 'Instagram',
      text: 'The Hope Hub',
      icon: InstagramIcon,
    },
  ];
  return (
    <section id='about' className='h-screen bg-background'>
      <PageHeading text='About Us'></PageHeading>
      <div
        id='about-content'
        className='w-[90%] pt-[5%] pb-[5%] mr-auto ml-auto flex flex-col'
      >
        <img src={Logo} alt='' className='lg:w-2/3 lg:m-auto' />
        <hr className='mt-7 mb-7 w-[80%] border-1 border-primary-yellow m-auto' />
        <h2 className='text-3xl font-content font-medium mb-5'>The Hope Hub</h2>
        <p className='text-lg font-content font-normal text-justify lg:text-center'>
          {AboutText}
        </p>
        <hr className='mt-7 mb-7 w-[50%] border-1 border-primary-yellow m-auto' />
        <div
          id='contacts'
          className='relative pt-15 lg:grid lg:grid-cols-2 font-content'
        >
          <h2 className='absolute top-0 left-0 font-medium text-3xl'>
            Contact Us:
          </h2>
          {Contacts.map((item, index) => (
            <div
              id='contact'
              key={index}
              className='flex flex-row w-full justify-center items-center mb-5'
            >
              <img src={item.icon} alt={item.type} className='w-[7%] mr-3' />
              <p className='w-full'>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer></Footer>
    </section>
  );
}
