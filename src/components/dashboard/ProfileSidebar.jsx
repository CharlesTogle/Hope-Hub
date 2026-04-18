import ProfilePicture from '@/components/dashboard/ProfilePicture';
import Container from '@/components/dashboard/Container';
import { LogOut } from 'lucide-react';

export default function ProfileSidebar ({
  onProfileChange,
  memoizedFile,
  name,
  userType,
  handleLogout,
}) {
  return (
    <Container className='h-full relative left mt-0! flex flex-col items-center pt-5 space-y-5'>
      <ProfilePicture
        onProfileChange={onProfileChange}
        initialFile={memoizedFile}
      />
      <div
        id='profile-details'
        className='w-full flex flex-col items-center space-y-2'
      >
        <p className='text-neutral-dark-blue font-bold text-xl'>{name}</p>
        <hr className='w-[50%] border-1 border-primary-yellow' />
        <p className='text-neutral-dark-blue font-md text-base'>{userType}</p>
      </div>
      <button
        className='font-bold text-red text-xl absolute bottom-1 mb-10 flex items-center gap-2 hover:brightness-75 cursor-pointer'
        onClick={() => handleLogout()}
      >
        <LogOut className='w-6 h-6' /> Logout
      </button>
    </Container>
  );
}
