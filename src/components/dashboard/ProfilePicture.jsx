import { useEffect, useRef, useState } from 'react';
import { UserCircle, Pencil } from 'lucide-react';

export default function ProfilePicture ({
  initialImage,
  initialFile,
  onProfileChange,
}) {
  const [image, setImage] = useState(initialImage || null);
  const inputRef = useRef();

  const handleImageClick = () => {
    inputRef.current.click();
  };

  useEffect(() => {
    if (initialFile instanceof Blob) {
      const reader = new FileReader();
      reader.onload = ev => {
        setImage(ev.target.result);
      };
      reader.readAsDataURL(initialFile);
    } else if (typeof initialImage === 'string' && initialImage.length > 0) {
      setImage(initialImage);
    } else {
      setImage(null);
    }
  }, [initialFile, initialImage]);

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setImage(ev.target.result);
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
          onChange={e => handleImageChange(e)}
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
