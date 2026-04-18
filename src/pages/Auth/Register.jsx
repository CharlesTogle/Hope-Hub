import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormInput from '@/components/auth/FormInput';
import InputContainer from '../../components/auth/InputContainer';
import FormButton from '../../components/auth/FormButton';
import { useState } from 'react';
import useRateLimiter from '@/hooks/useRateLimiter';
import supabase from '@/client/supabase';
import LectureProgress from '@/utilities/LectureProgress';

export default function Register () {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataPrivacyChecked, setIsDataPrivacyChecked] = useState(false);

  // Rate limiting hook
  const isRateLimited = useRateLimiter();

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
  const handleRegister = async () => {
    setErrorMessage('');
    setIsLoading(true);
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Trim all inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const trimmedName = name.trim();

    const fields = [
      trimmedEmail,
      trimmedPassword,
      trimmedConfirmPassword,
      trimmedName,
    ];

    const rateLimited = isRateLimited().type;

    const areAllFieldsFilled = fields.every(field => field !== '');
    if (!areAllFieldsFilled) {
      setErrorMessage('Please fill up all required fields');
      setSuccessMessage('');
      setIsLoading(false);
      return;
    }

    if (!isDataPrivacyChecked) {
      setErrorMessage('Please agree to the data collection consent');
      setSuccessMessage('');
      setIsLoading(false);
      return;
    }

    if (rateLimited === 'exceeded') {
      setErrorMessage(
        'Too many registration attempts. Please wait 5 minutes or try again in a few seconds.',
      );
      setIsLoading(false);
      return;
    }

    if (rateLimited === 'too-fast') {
      setErrorMessage(
        'You are attempting too fast. Please wait for 10 seconds and try again',
      );
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: trimmedPassword,
      options: {
        emailRedirectTo:
          'https://hope-hub-fitness.vercel.app/auth/account-verification',
        data: {
          fullName: trimmedName,
          userType: userType,
          classCode: null,
          lectureProgress: LectureProgress(),
          password: trimmedPassword,
        },
      },
    });
    if (error) {
      setErrorMessage(error.message);
      setSuccessMessage('');
      setIsLoading(false);
      return;
    }

    if (!data || !data.user) {
      setErrorMessage('Registration succeeded, but user info is missing.');
      setSuccessMessage('');
      setIsLoading(false);
      return;
    }

    setSuccessMessage('Verification has been sent to your email');
    setIsLoading(false);
  };

  return (
    <AuthContainer>
      <FormContainer className='scale-40'>
        <FormHeading
          heading='SIGN UP'
          link='/auth/login'
          callToAction='Already have an account?'
          action='Login'
        ></FormHeading>
        <InputContainer>
          <FormInput
            value={email}
            placeholder='Email'
            setValue={setEmail}
            type='email'
          />
          <FormInput value={name} placeholder='Name' setValue={setName} />
          <FormInput
            value={password}
            placeholder='Password'
            setValue={handlePasswordChange}
            type='password'
          />
          <FormInput
            value={confirmPassword}
            placeholder='Confirm Password'
            setValue={handleConfirmPasswordChange}
            type='password'
          />
          <div className='flex flex-col text-accent-gray font-content'>
            <p className=''>I am creating account for a</p>
            <div className='flex flex-col'>
              <label htmlFor='student'>
                <input
                  type='radio'
                  name='userType'
                  id='student'
                  className='mr-2 cursor-pointer'
                  checked={userType === 'student'}
                  onChange={() => setUserType('student')}
                />
                Student
              </label>
              <label htmlFor='teacher'>
                <input
                  type='radio'
                  name='userType'
                  id='teacher'
                  className='mr-2 cursor-pointer'
                  checked={userType === 'teacher'}
                  onChange={() => setUserType('teacher')}
                />
                Teacher
              </label>
            </div>
          </div>
        </InputContainer>
        {errorMessage && (
          <p className='text-red font-content font-semibold'>{errorMessage}</p>
        )}
        {successMessage && (
          <p className='text-green font-content font-semibold'>
            {successMessage}
          </p>
        )}
        <div className='relative flex items-start flex-row gap-3'>
          <input
            type='checkbox'
            className='scale-110'
            id='consent-checkbox'
            onChange={() => setIsDataPrivacyChecked(prev => !prev)}
          />
          <div className='flex flex-col'>
            <label
              htmlFor='consent-checkbox'
              className='text-accent-gray font-content text-xs text-justify'
            >
              I agree to Hope Hub collecting and using my data for educational
              purposes, in line with the Data Privacy Act of the Philippines
              (Republic Act. 10173).
            </label>
            <span className='text-red-500 font-content text-xs font-semibold mt-1'>
              * Required
            </span>
          </div>
        </div>
        <FormButton
          text={isLoading ? 'Signing you up...' : 'Sign Up'}
          onClick={handleRegister}
          disabled={isLoading}
        />{' '}
      </FormContainer>
    </AuthContainer>
  );
}
