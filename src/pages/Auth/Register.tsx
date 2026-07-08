import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormInput from '@/components/auth/FormInput';
import InputContainer from '@/components/auth/InputContainer';
import FormButton from '@/components/auth/FormButton';
import { useReducer } from 'react';
import LectureProgress from '@/utilities/LectureProgress';
import type { UserType } from '@/types/auth';

interface RegisterState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
  errorMessage: string;
  successMessage: string;
  isLoading: boolean;
  isDataPrivacyChecked: boolean;
}

type RegisterAction =
  | { type: 'set-field'; field: 'name' | 'email' | 'password' | 'confirmPassword'; value: string }
  | { type: 'set-user-type'; value: UserType }
  | { type: 'set-error'; value: string }
  | { type: 'set-success'; value: string }
  | { type: 'set-loading'; value: boolean }
  | { type: 'set-consent'; value: boolean }
  | { type: 'clear-messages' };

const initialState: RegisterState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  userType: 'student',
  errorMessage: '',
  successMessage: '',
  isLoading: false,
  isDataPrivacyChecked: false,
};

function reducer(state: RegisterState, action: RegisterAction): RegisterState {
  switch (action.type) {
    case 'set-field':
      return { ...state, [action.field]: action.value };
    case 'set-user-type':
      return { ...state, userType: action.value };
    case 'set-error':
      return { ...state, errorMessage: action.value };
    case 'set-success':
      return { ...state, successMessage: action.value };
    case 'set-loading':
      return { ...state, isLoading: action.value };
    case 'set-consent':
      return { ...state, isDataPrivacyChecked: action.value };
    case 'clear-messages':
      return { ...state, errorMessage: '', successMessage: '' };
    default:
      return state;
  }
}

export default function Register() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handlePasswordChange = (value: string) => {
    dispatch({ type: 'set-field', field: 'password', value });
    if (state.confirmPassword && value !== state.confirmPassword) {
      dispatch({ type: 'set-error', value: 'Passwords do not match' });
    } else {
      dispatch({ type: 'set-error', value: '' });
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    dispatch({ type: 'set-field', field: 'confirmPassword', value });
    if (state.password && value !== state.password) {
      dispatch({ type: 'set-error', value: 'Passwords do not match' });
    } else {
      dispatch({ type: 'set-error', value: '' });
    }
  };

  const handleRegister = async () => {
    dispatch({ type: 'clear-messages' });
    dispatch({ type: 'set-loading', value: true });

    if (state.password !== state.confirmPassword) {
      dispatch({ type: 'set-error', value: 'Passwords do not match' });
      dispatch({ type: 'set-loading', value: false });
      return;
    }

    if (state.password.length < 8) {
      dispatch({ type: 'set-error', value: 'Password must be at least 8 characters' });
      dispatch({ type: 'set-loading', value: false });
      return;
    }

    const trimmedEmail = state.email.trim();
    const trimmedPassword = state.password.trim();
    const trimmedConfirmPassword = state.confirmPassword.trim();
    const trimmedName = state.name.trim();

    const fields = [
      trimmedEmail,
      trimmedPassword,
      trimmedConfirmPassword,
      trimmedName,
    ];

    const areAllFieldsFilled = fields.every((field) => field !== '');
    if (!areAllFieldsFilled) {
      dispatch({ type: 'set-error', value: 'Please fill up all required fields' });
      dispatch({ type: 'set-loading', value: false });
      return;
    }

    if (!state.isDataPrivacyChecked) {
      dispatch({
        type: 'set-error',
        value: 'Please agree to the data collection consent',
      });
      dispatch({ type: 'set-loading', value: false });
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          userData: {
            email: trimmedEmail,
            password: trimmedPassword,
            name: trimmedName,
            userType: state.userType,
            lectureProgress: LectureProgress(),
          },
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        const message =
          res.status === 429
            ? 'Too many registration attempts. Please wait a moment and try again.'
            : body?.message ?? 'Registration failed. Please try again.';
        dispatch({ type: 'set-error', value: message });
        dispatch({ type: 'set-loading', value: false });
        return;
      }

      if (!body?.data?.user) {
        dispatch({
          type: 'set-error',
          value: 'Registration succeeded, but user info is missing.',
        });
        dispatch({ type: 'set-loading', value: false });
        return;
      }

      dispatch({
        type: 'set-success',
        value: 'Verification has been sent to your email',
      });
      dispatch({ type: 'set-loading', value: false });
    } catch {
      dispatch({ type: 'set-error', value: 'Network error. Please check your connection and try again.' });
      dispatch({ type: 'set-loading', value: false });
    }
  };

  return (
    <AuthContainer>
      <FormContainer className='scale-40'>
        <FormHeading
          heading='SIGN UP'
          link='/auth/login'
          callToAction='Already have an account?'
          action='Login'
        />
        <InputContainer>
          <FormInput
            value={state.email}
            placeholder='Email'
            setValue={(value) => dispatch({ type: 'set-field', field: 'email', value })}
            type='email'
          />
          <FormInput
            value={state.name}
            placeholder='Name'
            setValue={(value) => dispatch({ type: 'set-field', field: 'name', value })}
          />
          <FormInput
            value={state.password}
            placeholder='Password'
            setValue={handlePasswordChange}
            type='password'
          />
          <FormInput
            value={state.confirmPassword}
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
                  checked={state.userType === 'student'}
                  onChange={() => dispatch({ type: 'set-user-type', value: 'student' })}
                />
                Student
              </label>
              <label htmlFor='teacher'>
                <input
                  type='radio'
                  name='userType'
                  id='teacher'
                  className='mr-2 cursor-pointer'
                  checked={state.userType === 'teacher'}
                  onChange={() => dispatch({ type: 'set-user-type', value: 'teacher' })}
                />
                Teacher
              </label>
            </div>
          </div>
        </InputContainer>
        {state.errorMessage && (
          <p className='text-red font-content font-semibold'>{state.errorMessage}</p>
        )}
        {state.successMessage && (
          <p className='text-green font-content font-semibold'>
            {state.successMessage}
          </p>
        )}
        <div className='relative flex items-start flex-row gap-3'>
          <input
            type='checkbox'
            className='scale-110'
            id='consent-checkbox'
            checked={state.isDataPrivacyChecked}
            onChange={(e) => dispatch({ type: 'set-consent', value: e.target.checked })}
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
          text={state.isLoading ? 'Signing you up...' : 'Sign Up'}
          onClick={handleRegister}
          disabled={state.isLoading}
        />
      </FormContainer>
    </AuthContainer>
  );
}
