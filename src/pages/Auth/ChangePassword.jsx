import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormInput from '@/components/auth/FormInput';
import InputContainer from '../../components/auth/InputContainer';
import FormButton from '../../components/auth/FormButton';
import { useState, useEffect } from 'react';
import supabase from '@/client/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ChangePassword () {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const access_token = searchParams.get('access_token');
  const type = searchParams.get('type');
  const navigate = useNavigate();

  useEffect(() => {
    if (type === 'recovery' && access_token) {
      supabase.auth.setSession({
        access_token,
        refresh_token: searchParams.get('refresh_token') || '',
      });
    }
  }, [searchParams]);

  const handlePasswordChange = value => {
    setPassword(value);
    if (confirmPassword && value !== confirmPassword) {
      setErrorMessage('Passwords do not match');
    } else {
      setErrorMessage('');
    }
  };

  const handleConfirmPasswordChange = value => {
    setConfirmPassword(value);
    if (password && value !== password) {
      setErrorMessage('Passwords do not match');
    } else {
      setErrorMessage('');
    }
  };

  const handleChangePassword = async () => {
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (!password || !confirmPassword) {
      setErrorMessage('Please fill up all fields');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      let counter = 3;
      const countdown = setInterval(() => {
        setSuccessMessage(
          `Password has been changed successfully. Redirecting to login in ${counter}s`,
        );
        counter--;
        if (counter <= 0) {
          clearInterval(countdown);
          navigate('/auth/login');
        }
      }, 1000);
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer>
      <FormContainer>
        <FormHeading
          heading='CHANGE PASSWORD'
          callToAction='Reset your password'
        ></FormHeading>
        <InputContainer>
          <FormInput
            value={password}
            setValue={handlePasswordChange}
            placeholder='New Password'
            type='password'
          ></FormInput>
          <FormInput
            value={confirmPassword}
            setValue={handleConfirmPasswordChange}
            placeholder='Confirm New Password'
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
        <FormButton
          text={isLoading ? 'Changing Password...' : 'Change Password'}
          onClick={() => handleChangePassword()}
          disabled={isLoading}
        ></FormButton>
      </FormContainer>
    </AuthContainer>
  );
}
