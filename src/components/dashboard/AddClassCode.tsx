import FormContainer from '../auth/FormContainer';
import FormHeading from '../auth/FormHeading';
import FormInput from '../auth/FormInput';
import FormButton from '../auth/FormButton';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { createTeacherClassCode } from '@/mutations/class-mutations';
import type { ClassCode } from '@/types/student';
import { getUserFacingError } from '@/utilities/user-facing-errors';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

// Simple ColorPicker component
function ColorPicker({ value, onChange }: ColorPickerProps) {
  const predefinedColors = [
    'E09C3D', // Darker orange (from #FBB04D)
    'D93C2E', // Darker red (from #F44336)
    '8F4FD6', // Darker purple (from #A569F3)
    '2FA34C', // Darker green (from #39C25D)
    '4AB8B9', // Darker teal (from #70D9DA)
    'C77800', // Dark amber/golden
    'A0522D', // Sienna brown
    '6A5ACD', // Slate blue
    '008B8B', // Dark cyan
    '228B22', // Forest green
  ];

  return (
    <div className='flex flex-col gap-2'>
      <label className='text-sm font-content font-semibold'>Class Color:</label>
      <div className='grid grid-cols-6 gap-2'>
        {predefinedColors.map(color => (
          <button
            key={color}
            type='button'
            className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
              value === color ? 'border-gray-800 border-4' : 'border-gray-300'
            }`}
            style={{ backgroundColor: `#${color}` }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
      <div className='flex items-center gap-2 mt-2'>
        <span className='text-sm'>Selected:</span>
        <div
          className='w-6 h-6 rounded border-2 border-gray-300'
          style={{ backgroundColor: `#${value}` }}
        />
        <span className='text-sm font-mono'>#{value}</span>
      </div>
    </div>
  );
}

interface AddClassCodeProps {
  onAdd?: (classCode: ClassCode) => void;
  setModalShown: (shown: boolean) => void;
}

export default function AddClassCode({
  onAdd = () => {},
  setModalShown,
}: AddClassCodeProps) {
  const [error, setError] = useState('');
  const [className, setClassName] = useState('');
  const [classColor, setClassColor] = useState('FFD700');
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const { userId: userID } = useAuthStore();

  function validateClassName(name: string): string | null {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return 'Class name is required';
    }
    if (trimmedName.length < 2) {
      return 'Class name must be at least 2 characters long';
    }
    if (trimmedName.length > 50) {
      return 'Class name must be 50 characters or less';
    }
    return null;
  }

  const handleCreateClass = async () => {
    const trimmedClassName = className.trim();
    const classNameError = validateClassName(trimmedClassName);
    if (classNameError) {
      setError(classNameError);
      return;
    }

    if (!userID) {
      setError('User not authenticated. Please try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newClassCode = await createTeacherClassCode(
        userID,
        trimmedClassName,
        classColor,
      );

      onAdd(newClassCode);
      setModalShown(false);
      setClassName('');
      setClassColor('FFD700');
    } catch (error) {
      setError(getUserFacingError(error, 'class-management'));
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (
        formRef.current &&
        target instanceof Node &&
        !formRef.current.contains(target)
      ) {
        setModalShown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setModalShown]);

  return (
    <div className='w-full h-screen fixed top-0 z-999'>
      <div className='w-full h-full flex justify-center items-center'>
        <div
          id='backdrop'
          className='w-full h-full absolute top-0 bg-black opacity-40 -z-1'
        ></div>
        <div className='md:scale-90 scale-90 lg:scale-100'>
          <FormContainer ref={formRef} className='max-w-full! '>
            <FormHeading heading='Create a New Class'></FormHeading>{' '}
            <FormInput
              value={className}
              setValue={setClassName}
              placeholder='Enter class name (e.g., "PE 101 - Physical Education")'
              disabled={isLoading}
            />
            <ColorPicker value={classColor} onChange={setClassColor} />
            {error && (
              <p className='text-red-500 text-sm font-content font-semibold'>
                {error}
              </p>
            )}
            <FormButton
              className={`${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              text={isLoading ? 'Creating Class...' : 'Create Class'}
              onClick={handleCreateClass}
              disabled={isLoading}
            />
          </FormContainer>
        </div>
      </div>
    </div>
  );
}
