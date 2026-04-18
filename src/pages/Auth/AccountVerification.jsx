import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormButton from '../../components/auth/FormButton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useState } from 'react';
import ErrorMessage from '@/components/utilities/ErrorMessage';
import supabase from '@/client/supabase';
import { useRef } from 'react';
import Loading from '@/components/Loading';

export default function AccountVerification () {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isBadRequest, setIsBadRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpiredLink, setIsExpiredLink] = useState(false);
  const [shouldShowLogin, setShouldShowLogin] = useState(false);
  const [shouldShowRegister, setShouldShowRegister] = useState(false);
  const userRegistered = useRef(false);

  const handleRegister = async (retryCount = 0) => {
    setIsLoading(true);

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
              .select('user_id')
              .eq('user_id', user.id)
              .single();

            if (profileData && !profileError) {
              setErrorMessage(
                'Email verification link has expired. Your account still exists. Please try logging in instead.',
              );
              setShouldShowLogin(true);
            } else {
              try {
                await supabase.auth.admin.deleteUser(user.id);
              } catch (deleteError) {
                // Handle error silently
              }
              setErrorMessage(
                'Email verification link has expired. Account has been reset. Please register again.',
              );
            }
          } else {
            setErrorMessage(
              'Email verification link has expired. Please register again.',
            );
          }
        } catch (checkError) {
          setErrorMessage(
            'Email verification link has expired. Please try registering again.',
          );
        }

        await supabase.auth.signOut();
        setIsExpiredLink(true);
        setIsLoading(false);
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
        setErrorMessage('Error setting session: ' + sessionError.message);
        setIsLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.user_metadata) {
      if (retryCount < 3) {
        setTimeout(() => {
          handleRegister(retryCount + 1);
        }, (retryCount + 1) * 1000);
        return;
      }

      setErrorMessage('User data not found. Please try registering again.');
      setShouldShowRegister(true);
      setIsLoading(false);
      return;
    }

    // Check if user is already registered in profile table
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profile')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile && !profileCheckError) {
      setErrorMessage('User is already logged in');
      setIsLoading(false);
      return;
    }

    const { fullName, userType, classCode, lectureProgress } =
      user.user_metadata;
    const userId = user.id;
    const email = user.email;

    if (user.id !== userId) {
      localStorage.removeItem('userData');
      setIsBadRequest(true);
      setTimeout(() => {
        navigate('auth/register');
      }, 1000);
      setIsLoading(false);
      return;
    }
    const { error: rpcError } = await supabase.rpc('register_user', {
      p_user_id: userId,
      p_full_name: fullName,
      p_email: email,
      p_user_type: userType,
      p_class_code: classCode || null,
      p_lecture_progress: lectureProgress,
    });

    if (rpcError) {
      setErrorMessage('Error during registration: ' + rpcError.message);
      setIsLoading(false);
      setTimeout(() => {
        supabase.auth.signOut();
      }, 1500);
      return;
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!userRegistered.current) {
      userRegistered.current = true;
      handleRegister();
    }
  }, []);

  if (isExpiredLink) {
    return (
      <AuthContainer>
        <FormContainer>
          <FormHeading
            heading='Verification Link Expired'
            callToAction='Your email verification link has expired'
          />
          <div className='text-center'>
            <p className='text-red font-content font-semibold'>
              {errorMessage}
            </p>
          </div>
          <FormButton
            text={shouldShowLogin ? 'Go to Login' : 'Register Again'}
            onClick={() =>
              navigate(shouldShowLogin ? '/auth/login' : '/auth/register')
            }
            disabled={false}
          />
        </FormContainer>
      </AuthContainer>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  if (isBadRequest) {
    return <ErrorMessage text='Error 400' subText='Bad Request'></ErrorMessage>;
  }

  return (
    <AuthContainer>
      <FormContainer>
        <FormHeading
          heading='Account Verified'
          callToAction='Thank you for choosing hope hub'
        ></FormHeading>

        {(shouldShowRegister && (
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
              !!errorMessage && errorMessage !== 'User is already logged in'
            }
          ></FormButton>
        )}
        {errorMessage && (
          <p
            className={`font-content font-semibold mt-2 ${
              errorMessage === 'User is already logged in'
                ? 'text-green'
                : 'text-red'
            }`}
          >
            {errorMessage}
          </p>
        )}
      </FormContainer>
    </AuthContainer>
  );
}
