import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormButton from '@/components/auth/FormButton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useReducer, useRef } from 'react';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import supabase from '@/client/supabase';
import Loading from '@/components/Loading';
import type { UserType } from '@/types/auth';
import type { LectureProgressItem } from '@/types/lecture';

interface UserMetadata {
  fullName: string;
  userType: UserType;
  classCode: string | null;
  lectureProgress: LectureProgressItem[];
}

interface AccountVerificationState {
  isBadRequest: boolean;
  isLoading: boolean;
  errorMessage: string;
  isExpiredLink: boolean;
  shouldShowLogin: boolean;
  shouldShowRegister: boolean;
}

type AccountVerificationAction =
  | { type: 'set-bad-request'; value: boolean }
  | { type: 'set-loading'; value: boolean }
  | { type: 'set-error'; value: string }
  | { type: 'set-expired-link'; value: boolean }
  | { type: 'set-show-login'; value: boolean }
  | { type: 'set-show-register'; value: boolean };

const initialState: AccountVerificationState = {
  isBadRequest: false,
  isLoading: false,
  errorMessage: '',
  isExpiredLink: false,
  shouldShowLogin: false,
  shouldShowRegister: false,
};

function reducer(
  state: AccountVerificationState,
  action: AccountVerificationAction,
): AccountVerificationState {
  switch (action.type) {
    case 'set-bad-request':
      return { ...state, isBadRequest: action.value };
    case 'set-loading':
      return { ...state, isLoading: action.value };
    case 'set-error':
      return { ...state, errorMessage: action.value };
    case 'set-expired-link':
      return { ...state, isExpiredLink: action.value };
    case 'set-show-login':
      return { ...state, shouldShowLogin: action.value };
    case 'set-show-register':
      return { ...state, shouldShowRegister: action.value };
    default:
      return state;
  }
}

export default function AccountVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const userRegistered = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signOutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRegister = async (retryCount: number = 0): Promise<void> => {
    dispatch({ type: 'set-loading', value: true });

    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');

      if (error && errorCode === 'otp_expired') {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: profileData, error: profileError } = await supabase
              .from('profile')
              .select('uuid')
              .eq('uuid', user.id)
              .single();

            if (profileData && !profileError) {
              dispatch({
                type: 'set-error',
                value:
                'Email verification link has expired. Your account still exists. Please try logging in instead.',
              });
              dispatch({ type: 'set-show-login', value: true });
            } else {
              try {
                await supabase.auth.admin.deleteUser(user.id);
              } catch {
                // Handle error silently
              }
              dispatch({
                type: 'set-error',
                value:
                'Email verification link has expired. Account has been reset. Please register again.',
              });
            }
          } else {
            dispatch({
              type: 'set-error',
              value:
              'Email verification link has expired. Please register again.',
            });
          }
        } catch {
          dispatch({
            type: 'set-error',
            value:
            'Email verification link has expired. Please try registering again.',
          });
        }

        await supabase.auth.signOut();
        dispatch({ type: 'set-expired-link', value: true });
        dispatch({ type: 'set-loading', value: false });
        return;
      }
    }

    let accessToken = searchParams.get('access_token');
    let refreshToken = searchParams.get('refresh_token');

    if (!accessToken && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      accessToken = hashParams.get('access_token');
      refreshToken = hashParams.get('refresh_token');
    }

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        console.error('AccountVerification setSession failed', { sessionError });
        dispatch({
          type: 'set-error',
          value: 'Verification failed. Please try registering again.',
        });
        dispatch({ type: 'set-loading', value: false });
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.user_metadata) {
      if (retryCount < 3) {
        retryTimeoutRef.current = setTimeout(() => {
          void handleRegister(retryCount + 1);
        }, (retryCount + 1) * 1000);
        return;
      }

      dispatch({
        type: 'set-error',
        value: 'User data not found. Please try registering again.',
      });
      dispatch({ type: 'set-show-register', value: true });
      dispatch({ type: 'set-loading', value: false });
      return;
    }

    // Check if user is already registered in profile table
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profile')
      .select('uuid')
      .eq('uuid', user.id)
      .single();

    if (existingProfile && !profileCheckError) {
      dispatch({ type: 'set-error', value: 'User is already logged in' });
      dispatch({ type: 'set-loading', value: false });
      return;
    }

    const { fullName, userType, classCode, lectureProgress } =
      user.user_metadata as UserMetadata;
    const userId = user.id;
    const email = user.email ?? '';

    const { error: rpcError } = await supabase.rpc('register_user', {
      p_user_id: userId,
      p_full_name: fullName,
      p_email: email,
      p_user_type: userType,
      p_class_code: classCode ?? null,
      p_lecture_progress: lectureProgress,
    });

    if (rpcError) {
      console.error('AccountVerification register_user RPC failed', { rpcError });
      dispatch({
        type: 'set-error',
        value: 'Registration failed. Please try registering again.',
      });
      dispatch({ type: 'set-loading', value: false });
      signOutTimeoutRef.current = setTimeout(() => {
        void supabase.auth.signOut();
      }, 1500);
      return;
    }
    dispatch({ type: 'set-loading', value: false });
  };

  useEffect(() => {
    if (userRegistered.current) {
      return;
    }
    userRegistered.current = true;
    void handleRegister();

    return () => {
      clearTimeout(retryTimeoutRef.current ?? undefined);
      clearTimeout(signOutTimeoutRef.current ?? undefined);
    };
  }, []);

  if (state.isExpiredLink) {
    return (
      <AuthContainer>
        <FormContainer>
          <FormHeading
            heading='Verification Link Expired'
            callToAction='Your email verification link has expired'
          />
          <div className='text-center'>
            <p className='text-red font-content font-semibold'>
              {state.errorMessage}
            </p>
          </div>
          <FormButton
            text={state.shouldShowLogin ? 'Go to Login' : 'Register Again'}
            onClick={() =>
              navigate(state.shouldShowLogin ? '/auth/login' : '/auth/register')
            }
            disabled={false}
          />
        </FormContainer>
      </AuthContainer>
    );
  }

  if (state.isLoading) {
    return <Loading />;
  }

  if (state.isBadRequest) {
    return <ErrorMessage text='Error 400' subText='Bad Request' />;
  }

  return (
    <AuthContainer>
      <FormContainer>
        <FormHeading
          heading='Account Verified'
          callToAction='Thank you for choosing hope hub'
        />

        {(state.shouldShowRegister && (
          <FormButton
            text='Register Again'
            onClick={() => navigate('/auth/register')}
            disabled={false}
          />
        )) || (
          <FormButton
            text='Go to dashboard'
            onClick={() => navigate('/dashboard')}
            disabled={
              !!state.errorMessage && state.errorMessage !== 'User is already logged in'
            }
          />
        )}
        {state.errorMessage && (
          <p
            className={`font-content font-semibold mt-2 ${
              state.errorMessage === 'User is already logged in'
                ? 'text-green'
                : 'text-red'
            }`}
          >
            {state.errorMessage}
          </p>
        )}
      </FormContainer>
    </AuthContainer>
  );
}
