import AuthContainer from '@/components/auth/AuthContainer';
import FormContainer from '@/components/auth/FormContainer';
import FormHeading from '@/components/auth/FormHeading';
import FormButton from '@/components/auth/FormButton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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

type VerificationResult =
  | {
      status: 'verified';
      errorMessage: string;
      shouldShowRegister: boolean;
    }
  | {
      status: 'expired';
      errorMessage: string;
      shouldShowLogin: boolean;
    }
  | {
      status: 'bad-request';
      errorMessage: string;
    };

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getUserWithMetadataRetry(): Promise<{
  id: string;
  email: string;
  user_metadata: UserMetadata;
} | null> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('AccountVerification getUser failed', { error, attempt });
    }

    if (user?.user_metadata) {
      return {
        id: user.id,
        email: user.email ?? '',
        user_metadata: user.user_metadata as UserMetadata,
      };
    }

    if (attempt < 3) {
      await wait((attempt + 1) * 1000);
    }
  }

  return null;
}

async function verifyAccount(
  searchString: string,
  hashString: string,
): Promise<VerificationResult> {
  const search = new URLSearchParams(searchString);
  const hash = new URLSearchParams(hashString.startsWith('#') ? hashString.slice(1) : hashString);
  const hashError = hash.get('error');
  const errorCode = hash.get('error_code');

  if (hashError && errorCode === 'otp_expired') {
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
          await supabase.auth.signOut();
          return {
            status: 'expired',
            errorMessage:
              'Email verification link has expired. Your account still exists. Please try logging in instead.',
            shouldShowLogin: true,
          };
        }

        try {
          await supabase.auth.admin.deleteUser(user.id);
        } catch (error) {
          console.error('AccountVerification deleteUser failed', {
            userId: user.id,
            error,
          });
        }
      }
    } catch (error) {
      console.error('AccountVerification expired-link handling failed', { error });
    }

    await supabase.auth.signOut();

    return {
      status: 'expired',
      errorMessage:
        'Email verification link has expired. Please register again.',
      shouldShowLogin: false,
    };
  }

  const accessToken = search.get('access_token') ?? hash.get('access_token');
  const refreshToken = search.get('refresh_token') ?? hash.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      console.error('AccountVerification setSession failed', { sessionError });
      return {
        status: 'bad-request',
        errorMessage: 'Verification failed. Please try registering again.',
      };
    }

    await wait(500);
  }

  const user = await getUserWithMetadataRetry();

  if (!user) {
    return {
      status: 'verified',
      errorMessage: 'User data not found. Please try registering again.',
      shouldShowRegister: true,
    };
  }

  const { data: existingProfile, error: profileCheckError } = await supabase
    .from('profile')
    .select('uuid')
    .eq('uuid', user.id)
    .single();

  if (existingProfile && !profileCheckError) {
    return {
      status: 'verified',
      errorMessage: 'User is already logged in',
      shouldShowRegister: false,
    };
  }

  const { fullName, userType, classCode, lectureProgress } = user.user_metadata;
  const { error: rpcError } = await supabase.rpc('register_user', {
    p_user_id: user.id,
    p_full_name: fullName,
    p_email: user.email,
    p_user_type: userType,
    p_class_code: classCode ?? null,
    p_lecture_progress: lectureProgress,
  });

  if (rpcError) {
    console.error('AccountVerification register_user RPC failed', { rpcError });
    await supabase.auth.signOut();
    return {
      status: 'verified',
      errorMessage: 'Registration failed. Please try registering again.',
      shouldShowRegister: true,
    };
  }

  return {
    status: 'verified',
    errorMessage: '',
    shouldShowRegister: false,
  };
}

export default function AccountVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const hashString = useMemo(() => window.location.hash, []);
  const { data: result, isLoading } = useQuery({
    queryKey: ['auth', 'account-verification', searchString, hashString],
    queryFn: () => verifyAccount(searchString, hashString),
    retry: false,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!result || result.status === 'bad-request') {
    return <ErrorMessage text='Error 400' subText='Bad Request' />;
  }

  if (result.status === 'expired') {
    return (
      <AuthContainer>
        <FormContainer>
          <FormHeading
            heading='Verification Link Expired'
            callToAction='Your email verification link has expired'
          />
          <div className='text-center'>
            <p className='text-red font-content font-semibold'>
              {result.errorMessage}
            </p>
          </div>
          <FormButton
            text={result.shouldShowLogin ? 'Go to Login' : 'Register Again'}
            onClick={() =>
              navigate(result.shouldShowLogin ? '/auth/login' : '/auth/register')
            }
            disabled={false}
          />
        </FormContainer>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <FormContainer>
        <FormHeading
          heading='Account Verified'
          callToAction='Thank you for choosing hope hub'
        />

        {(result.shouldShowRegister && (
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
              !!result.errorMessage && result.errorMessage !== 'User is already logged in'
            }
          />
        )}
        {result.errorMessage && (
          <p
            className={`font-content font-semibold mt-2 ${
              result.errorMessage === 'User is already logged in'
                ? 'text-green'
                : 'text-red'
            }`}
          >
            {result.errorMessage}
          </p>
        )}
      </FormContainer>
    </AuthContainer>
  );
}
