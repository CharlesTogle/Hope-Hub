import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
export default function FormInput ({
  setValue = () => {},
  value,
  type = 'text',
  placeholder = '',
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className='relative flex items-center'>
      <input
        type={
          type === 'password' ? (showPassword ? 'text' : 'password') : `${type}`
        }
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className={`w-full border-b-1 border-accent-gray pb-3 pt-3 pr-10 pl-5 font-content text-base 
          rounded-sm shadow-md bg-white placeholder:text-accent-gray placeholder:font-content 
          disabled:brightness-90 not-valid:border-1 not-valid:border-red`}
        disabled={disabled}
      />
      {type === 'password' && (
        <>
          <button
            className='absolute right-4 scale-120'
            onClick={() => setShowPassword(prev => !prev)}
          >
            {showPassword ? (
              <Eye className='h-4 w-4' />
            ) : (
              <EyeOff className='h-4 w-4' />
            )}
          </button>
        </>
      )}
    </div>
  );
}
