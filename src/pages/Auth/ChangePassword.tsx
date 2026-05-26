import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormInput from '@/components/auth/FormInput';
import InputContainer from '@/components/auth/InputContainer';
import FormButton from '@/components/auth/FormButton';
import { useEffect, useReducer, useRef } from 'react';
import supabase from '@/client/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface ChangePasswordState {
  password: string;
  confirmPassword: string;
  errorMessage: string;
  successMessage: string;
  isLoading: boolean;
}

type ChangePasswordAction =
  | { type: 'set-field'; field: 'password' | 'confirmPassword'; value: string }
  | { type: 'set-error'; value: string }
  | { type: 'set-success'; value: string }
  | { type: 'set-loading'; value: boolean }
  | { type: 'clear-messages' };

const initialState: ChangePasswordState = {
  password: '',
  confirmPassword: '',
  errorMessage: '',
  successMessage: '',
  isLoading: false,
};

function reducer(
  state: ChangePasswordState,
  action: ChangePasswordAction,
): ChangePasswordState {
  switch (action.type) {
    case 'set-field':
      return { ...state, [action.field]: action.value };
    case 'set-error':
      return { ...state, errorMessage: action.value };
    case 'set-success':
      return { ...state, successMessage: action.value };
    case 'set-loading':
      return { ...state, isLoading: action.value };
    case 'clear-messages':
      return { ...state, errorMessage: '', successMessage: '' };
    default:
      return state;
  }
}

export default function ChangePassword() {
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const accessToken = searchParams.get('access_token') ?? '';
  const refreshToken = searchParams.get('refresh_token') ?? '';
  const type = searchParams.get('type');
  const navigate = useNavigate();
  const redirectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleChangePassword = async () => {
    dispatch({ type: 'clear-messages' });

    if (state.password !== state.confirmPassword) {
      dispatch({ type: 'set-error', value: 'Passwords do not match' });
      return;
    }
    if (!state.password || !state.confirmPassword) {
      dispatch({ type: 'set-error', value: 'Please fill up all fields' });
      return;
    }

    dispatch({ type: 'set-loading', value: true });

    if (type === 'recovery') {
      if (!accessToken || !refreshToken) {
        dispatch({
          type: 'set-error',
          value: 'This password reset link is invalid or incomplete.',
        });
        dispatch({ type: 'set-loading', value: false });
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        console.error('ChangePassword setSession failed', { sessionError });
        dispatch({
          type: 'set-error',
          value: 'This password reset link is invalid or has expired.',
        });
        dispatch({ type: 'set-loading', value: false });
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({
      password: state.password,
    });

    if (error) {
      console.error('ChangePassword failed', { error });
      dispatch({
        type: 'set-error',
        value: 'Failed to update password. Please try again.',
      });
      dispatch({ type: 'set-loading', value: false });
    } else {
      let counter = 3;
      redirectIntervalRef.current = setInterval(() => {
        dispatch({
          type: 'set-success',
          value: `Password has been changed successfully. Redirecting to login in ${counter}s`,
        });
        counter--;
        if (counter <= 0) {
          clearInterval(redirectIntervalRef.current ?? undefined);
          navigate('/auth/login');
        }
      }, 1000);
      dispatch({ type: 'set-loading', value: false });
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(redirectIntervalRef.current ?? undefined);
    };
  }, []);

  return (
    <AuthContainer>
      <FormContainer>
        <FormHeading
          heading='CHANGE PASSWORD'
          callToAction='Reset your password'
        />
        <InputContainer>
          <FormInput
            value={state.password}
            setValue={handlePasswordChange}
            placeholder='New Password'
            type='password'
          />
          <FormInput
            value={state.confirmPassword}
            setValue={handleConfirmPasswordChange}
            placeholder='Confirm New Password'
            type='password'
          />
        </InputContainer>
        {state.errorMessage && (
          <p className='text-red-500 text-sm font-semibold font-content mt-2 mb-1'>
            {state.errorMessage}
          </p>
        )}
        {state.successMessage && (
          <p className='text-green font-content font-semibold'>
            {state.successMessage}
          </p>
        )}
        <FormButton
          text={state.isLoading ? 'Changing Password...' : 'Change Password'}
          onClick={() => handleChangePassword()}
          disabled={state.isLoading}
        />
      </FormContainer>
    </AuthContainer>
  );
}
