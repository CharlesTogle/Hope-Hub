import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormInput from '@/components/auth/FormInput';
import InputContainer from '@/components/auth/InputContainer';
import FormButton from '@/components/auth/FormButton';
import { useEffect, useReducer, useRef } from 'react';
import { AuthApiError } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import supabase, { setRememberMePreference } from '@/client/supabase';
import { authKeys } from '@/lib/query-keys';
import { fetchAuthenticatedProfile } from '@/queries/auth-queries';
import { useAuthStore } from '@/store/auth-store';
import { useNavigate } from 'react-router-dom';
import useRateLimiter from '@/hooks/useRateLimiter';
import { logger } from '@/utilities/logger';

interface LoginState {
  email: string;
  password: string;
  errorMessage: string;
  successMessage: string;
  rememberMe: boolean;
  isSubmitting: boolean;
  isDebounced: boolean;
}

type LoginAction =
  | { type: 'set-field'; field: 'email' | 'password'; value: string }
  | { type: 'set-error'; value: string }
  | { type: 'set-success'; value: string }
  | { type: 'set-remember-me'; value: boolean }
  | { type: 'set-submitting'; value: boolean }
  | { type: 'set-debounced'; value: boolean }
  | { type: 'clear-messages' };

const initialState: LoginState = {
  email: '',
  password: '',
  errorMessage: '',
  successMessage: '',
  rememberMe: localStorage.getItem('rememberMe') === 'true',
  isSubmitting: false,
  isDebounced: false,
};

function reducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case 'set-field':
      return { ...state, [action.field]: action.value };
    case 'set-error':
      return { ...state, errorMessage: action.value };
    case 'set-success':
      return { ...state, successMessage: action.value };
    case 'set-remember-me':
      return { ...state, rememberMe: action.value };
    case 'set-submitting':
      return { ...state, isSubmitting: action.value };
    case 'set-debounced':
      return { ...state, isDebounced: action.value };
    case 'clear-messages':
      return { ...state, errorMessage: '', successMessage: '' };
    default:
      return state;
  }
}

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.message === 'Invalid login credentials') {
      return 'Invalid email or password. Please try again.';
    }

    if (error.message === 'Email not confirmed') {
      return 'Please verify your email before logging in.';
    }

    return 'Authentication failed. Please try again.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

export default function Login() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuthState = useAuthStore((store) => store.setAuthState);

  const isRateLimited = useRateLimiter({ minIntervalMs: 5000, maxAttempts: 7 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogin = async () => {
    if (state.isDebounced || state.isSubmitting) return;

    dispatch({ type: 'clear-messages' });
    dispatch({ type: 'set-submitting', value: true });

    const rateLimitResult = isRateLimited();
    const rateLimited = rateLimitResult !== false ? rateLimitResult.type : null;

    if (rateLimited === 'exceeded') {
      dispatch({
        type: 'set-error',
        value:
        'Too many Login attempts. Please wait 5 minutes or try again in a few seconds.',
      });
      dispatch({ type: 'set-submitting', value: false });
      clearTimeout(errorTimeoutRef.current ?? undefined);
      errorTimeoutRef.current = setTimeout(
        () => dispatch({ type: 'set-error', value: '' }),
        300000,
      );
      return;
    }

    if (rateLimited === 'too-fast') {
      dispatch({
        type: 'set-error',
        value:
        'You are attempting too fast. Please wait for 5 seconds and try again',
      });
      dispatch({ type: 'set-submitting', value: false });
      clearTimeout(errorTimeoutRef.current ?? undefined);
      errorTimeoutRef.current = setTimeout(
        () => dispatch({ type: 'set-error', value: '' }),
        5000,
      );
      return;
    }

    dispatch({ type: 'set-debounced', value: true });
    clearTimeout(debounceRef.current ?? undefined);
    debounceRef.current = setTimeout(
      () => dispatch({ type: 'set-debounced', value: false }),
      1500,
    );

    try {
      setRememberMePreference(state.rememberMe);

      const { error } = await supabase.auth.signInWithPassword({
        email: state.email,
        password: state.password,
      });

      if (error) {
        logger.error('Login failed', error);
        dispatch({
          type: 'set-error',
          value: getLoginErrorMessage(error),
        });
        return;
      }

      const authSession = await fetchAuthenticatedProfile();

      if (!authSession.userId || !authSession.profile) {
        logger.error('Login succeeded but profile could not be loaded', 'missing profile', { email: state.email });
        await supabase.auth.signOut();
        queryClient.setQueryData(authKeys.current(), {
          userId: null,
          profile: null,
        });
        dispatch({
          type: 'set-error',
          value: 'Login succeeded, but your account could not be loaded. Please try again.',
        });
        return;
      }

      queryClient.setQueryData(authKeys.current(), authSession);
      setAuthState(authSession);
      dispatch({ type: 'set-success', value: 'Login Success' });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      logger.error('Unexpected login error', error);
      dispatch({
        type: 'set-error',
        value: getLoginErrorMessage(error),
      });
    } finally {
      dispatch({ type: 'set-submitting', value: false });
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current ?? undefined);
      clearTimeout(errorTimeoutRef.current ?? undefined);
    };
  }, []);

  return (
    <AuthContainer>
      <FormContainer>
        <FormHeading
          action='Sign Up'
          callToAction={`Don't have an account?`}
          heading='LOGIN'
          link={'/auth/register'}
        />
        <InputContainer>
          <FormInput
            value={state.email}
            placeholder='Email'
            setValue={(value) => dispatch({ type: 'set-field', field: 'email', value })}
          />
          <FormInput
            value={state.password}
            setValue={(value) =>
              dispatch({ type: 'set-field', field: 'password', value })
            }
            placeholder='Password'
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
        <div className='flex flex-row justify-between font-content text-sm'>
          <div className='text-accent-gray flex gap-4 pl-2'>
            <input
              type='checkbox'
              id='remember-me'
              checked={state.rememberMe}
              onChange={(e) =>
                dispatch({ type: 'set-remember-me', value: e.target.checked })
              }
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
          text={state.isSubmitting ? 'Logging in...' : 'Login'}
          onClick={handleLogin}
          disabled={state.isSubmitting || state.isDebounced}
        />
      </FormContainer>
    </AuthContainer>
  );
}
