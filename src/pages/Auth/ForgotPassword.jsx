import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormInput from '@/components/auth/FormInput';
import InputContainer from '../../components/auth/InputContainer';
import FormButton from '../../components/auth/FormButton';
import { useState } from 'react';
import supabase from '@/client/supabase';
import { useNavigate } from 'react-router-dom';
import useRateLimiter from '@/hooks/useRateLimiter';

export default function ForgotPassword () {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isRateLimited = useRateLimiter({ minIntervalMs: 5000, maxAttempts: 7 });

  const handleForgotPassword = async () => {
    setSuccessMessage('');
    setErrorMessage('');

    const rateLimited = isRateLimited().type;

    if (rateLimited === 'exceeded') {
      setErrorMessage(
        'Too many Login attempts. Please wait 5 minutes or try again in a few seconds.',
      );
      return;
    }

    if (rateLimited === 'too-fast') {
      setErrorMessage(
        'You are attempting too fast. Please wait for 5 seconds and try again',
      );
      return;
    }
    if (email.trim() === '') {
      setErrorMessage('Please fill out all fields');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://hope-hub-dcvm.vercel.app/auth/change-password',
    });
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage('A reset link has been sent to your email');
    }
  };

  return (
    <AuthContainer>
      <FormContainer>
        <FormHeading
          callToAction={`Don't have an account?`}
          action='Sign up'
          link='/auth/register'
          heading='FORGOT PASSWORD'
        ></FormHeading>
        <InputContainer>
          <FormInput
            value={email}
            setValue={setEmail}
            placeholder='Email Address'
            type='email'
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
        )}{' '}
        <FormButton
          text={isLoading ? 'Hang in there...' : 'Confirm'}
          onClick={() => handleForgotPassword()}
          disabled={isLoading}
        ></FormButton>
        <FormButton
          text='Back to login'
          className='bg-white! border-2 border-accent-blue box-border inset text-accent-blue!'
          onClick={() => navigate('/auth/login')}
        ></FormButton>
      </FormContainer>
    </AuthContainer>
  );
}
