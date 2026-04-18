import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormInput from '@/components/auth/FormInput';
import InputContainer from '../../components/auth/InputContainer';
import FormButton from '../../components/auth/FormButton';
import { useState, useRef } from 'react';
import supabase from '@/client/supabase';
import { useNavigate } from 'react-router-dom';
import useRateLimiter from '@/hooks/useRateLimiter';

export default function Login () {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const isRateLimited = useRateLimiter({ minIntervalMs: 5000, maxAttempts: 7 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDebounced, setIsDebounced] = useState(false);
  const debounceRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const handleLogin = async () => {
    if (isDebounced || isSubmitting) return; // ignore rapid clicks or duplicate submits

    setErrorMessage('');
    setIsSubmitting(true);

    const rateLimited = isRateLimited().type;

    if (rateLimited === 'exceeded') {
      setErrorMessage(
        'Too many Login attempts. Please wait 5 minutes or try again in a few seconds.',
      );
      setIsSubmitting(false);
      // Clear error message after 5 minutes (300000ms)
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(''), 300000);
      return;
    }

    if (rateLimited === 'too-fast') {
      setErrorMessage(
        'You are attempting too fast. Please wait for 5 seconds and try again',
      );
      setIsSubmitting(false);
      // Clear error message after 5 seconds
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    // Set debounce after rate limit checks pass
    setIsDebounced(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setIsDebounced(false), 1500);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        // Store remember me preference for future sessions
        localStorage.setItem('rememberMe', rememberMe.toString());
        setSuccessMessage('Login Success');
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <AuthContainer>
      <FormContainer>
        <FormHeading
          action='Sign Up'
          callToAction={`Don't have an account?`}
          heading='LOGIN'
          link={'/auth/register'}
        ></FormHeading>
        <InputContainer>
          <FormInput
            value={email}
            placeholder='Email'
            setValue={setEmail}
          ></FormInput>
          <FormInput
            value={password}
            setValue={setPassword}
            placeholder='Password'
            type='password'
          ></FormInput>
        </InputContainer>
        {errorMessage && (
          <p className='text-red-500 text-sm font-semibold font-content mt-2 mb-1'>
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className='text-green font-content font-semibold'>
            {successMessage}
          </p>
        )}
        <div className='flex flex-row justify-between font-content text-sm'>
          <div className='text-accent-gray flex gap-4 pl-2'>
            <input
              type='checkbox'
              id='remember-me'
              onChange={e => setRememberMe(e.target.checked)}
            />
            <label htmlFor='remember-me'>Remember me</label>
          </div>
          <button
            className='text-accent-light-blue cursor-pointer'
            onClick={() => navigate('/auth/forgot-password')}
          >
            Forgot Password?
          </button>
        </div>
        <FormButton
          text={isSubmitting ? 'Logging in...' : 'Login'}
          onClick={handleLogin}
          disabled={isSubmitting || isDebounced}
        ></FormButton>
      </FormContainer>
    </AuthContainer>
  );
}
