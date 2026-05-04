import Logo from '@/assets/logos/hopehub_logo_v1.png';

export default function Loading() {
  return (
    <div className='w-full flex flex-col gap-5 items-center justify-center h-screen'>
      <img src={Logo} alt='logo' className='w-1/4 animate-opacity' />
    </div>
  );
}
