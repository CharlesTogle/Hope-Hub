import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormInput from '@/components/auth/FormInput';
import InputContainer from '@/components/auth/InputContainer';
import FormButton from '@/components/auth/FormButton';
import { useReducer } from 'react';
import supabase from '@/client/supabase';
import { useNavigate } from 'react-router-dom';
import useRateLimiter from '@/hooks/useRateLimiter';

interface ForgotPasswordState {
  email: string;
  errorMessage: string;
  successMessage: string;
  isLoading: boolean;
}

type ForgotPasswordAction =
  | { type: 'set-email'; value: string }
  | { type: 'set-error'; value: string }
  | { type: 'set-success'; value: string }
  | { type: 'set-loading'; value: boolean }
  | { type: 'clear-messages' };

const initialState: ForgotPasswordState = {
  email: '',
  errorMessage: '',
  successMessage: '',
  isLoading: false,
};

function reducer(
  state: ForgotPasswordState,
  action: ForgotPasswordAction,
): ForgotPasswordState {
  switch (action.type) {
    case 'set-email':
      return { ...state, email: action.value };
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

export default function ForgotPassword() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const isRateLimited = useRateLimiter({ minIntervalMs: 5000, maxAttempts: 7 });

  const handleForgotPassword = async () => {
    dispatch({ type: 'clear-messages' });

    const rateLimitResult = isRateLimited();
    const rateLimited = rateLimitResult !== false ? rateLimitResult.type : null;

    if (rateLimited === 'exceeded') {
      dispatch({
        type: 'set-error',
        value:
        'Too many Login attempts. Please wait 5 minutes or try again in a few seconds.',
      });
      return;
    }

    if (rateLimited === 'too-fast') {
      dispatch({
        type: 'set-error',
        value:
        'You are attempting too fast. Please wait for 5 seconds and try again',
      });
      return;
    }

    if (state.email.trim() === '') {
      dispatch({ type: 'set-error', value: 'Please fill out all fields' });
      return;
    }

    dispatch({ type: 'set-loading', value: true });
    const { error } = await supabase.auth.resetPasswordForEmail(state.email, {
      redirectTo: 'https://hope-hub-dcvm.vercel.app/auth/change-password',
    });
    dispatch({ type: 'set-loading', value: false });

    if (error) {
      dispatch({ type: 'set-error', value: error.message });
    } else {
      dispatch({
        type: 'set-success',
        value: 'A reset link has been sent to your email',
      });
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
        />
        <InputContainer>
          <FormInput
            value={state.email}
            setValue={(value) => dispatch({ type: 'set-email', value })}
            placeholder='Email Address'
            type='email'
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
          text={state.isLoading ? 'Hang in there...' : 'Confirm'}
          onClick={() => handleForgotPassword()}
          disabled={state.isLoading}
        />
        <FormButton
          text='Back to login'
          className='bg-white! border-2 border-accent-blue box-border inset text-accent-blue!'
          onClick={() => navigate('/auth/login')}
        />
      </FormContainer>
    </AuthContainer>
  );
}
