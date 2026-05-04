import { useEffect, useRef, useState } from 'react';
import { UserCircle, Pencil } from 'lucide-react';

interface ProfilePictureProps {
  initialImage?: string | null;
  initialFile?: Blob | null;
  onProfileChange?: (file: File, fileName?: string) => void;
}

export default function ProfilePicture({
  initialImage,
  initialFile,
  onProfileChange,
}: ProfilePictureProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleImageClick = () => {
    inputRef.current?.click();
  };

  useEffect(() => {
    if (initialFile instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.readAsDataURL(initialFile);
    } else if (typeof initialImage === 'string' && initialImage.length > 0) {
      setImage(initialImage);
    } else {
      setImage(null);
    }
  }, [initialFile, initialImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(typeof reader.result === 'string' ? reader.result : null);
        if (onProfileChange) {
          onProfileChange(file, 'profilePicture');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className='flex flex-col items-center p-3 border-1 border-black w-fit rounded-full'>
      <div
        className='w-50 h-50 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden border-2 hover:brightness-90 transition-all relative group'
        onClick={handleImageClick}
        title='Click to change profile picture'
      >
        {image ? (
          <img
            src={image}
            alt='Profile'
            className='w-full h-full object-cover'
          />
        ) : (
          <UserCircle size={80} className='text-gray-400' />
        )}
        <input
          type='file'
          accept='image/*'
          ref={inputRef}
          onChange={handleImageChange}
          className='hidden'
        />
        {/* Pen icon overlay on hover */}
        <div className='absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity'>
          <Pencil size={32} className='text-white' />
        </div>
      </div>
    </div>
  );
}
