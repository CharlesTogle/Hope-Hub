export type ErrorContext =
  | 'login'
  | 'registration'
  | 'password-reset'
  | 'verification-resend'
  | 'join-class'
  | 'leave-class'
  | 'class-management'
  | 'pft-save'
  | 'profile-upload'
  | 'calculation'
  | 'load';

const networkMessage =
  "We can't reach the server right now. Check your internet connection and try again in a moment.";

const fallbackMessages: Record<ErrorContext, string> = {
  login: 'We could not sign you in. Check your details and try again.',
  registration: 'We could not create your account. Please try again in a moment.',
  'password-reset':
    'We could not send the reset link. Please try again, and contact support if the problem continues.',
  'verification-resend':
    "We couldn't resend the verification email. Check your connection and try again.",
  'join-class':
    "We couldn't join that class right now. Check the code and your connection, then try again.",
  'leave-class': "We couldn't remove you from the class. Check your connection and try again.",
  'class-management':
    "We couldn't update your classes right now. Please try again in a moment.",
  'pft-save':
    'We could not save your fitness test data. Check your connection and try saving again.',
  'profile-upload':
    "We couldn't save your profile picture right now. Check your connection and try again.",
  calculation: "We couldn't calculate your result. Review your entries and try again.",
  load: "We couldn't load this information right now. Check your connection and try again.",
};

function getErrorDetails(error: unknown): { message: string; status?: number } {
  if (error instanceof Error) return { message: error.message.toLowerCase() };
  if (typeof error === 'string') return { message: error.toLowerCase() };
  if (typeof error !== 'object' || error === null) return { message: '' };

  const value = error as { message?: unknown; status?: unknown; statusCode?: unknown };
  const message = typeof value.message === 'string' ? value.message.toLowerCase() : '';
  const rawStatus = value.status ?? value.statusCode;
  const status = typeof rawStatus === 'number' ? rawStatus : Number(rawStatus);

  return { message, status: Number.isFinite(status) ? status : undefined };
}

export function getUserFacingError(error: unknown, context: ErrorContext): string {
  const { message, status } = getErrorDetails(error);

  if (status === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    if (context === 'registration') {
      return 'Too many registration attempts. Please wait a moment and try again.';
    }
    if (context === 'password-reset') {
      return "You've requested several reset links. Please wait a few minutes before trying again.";
    }
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('timed out')
  ) {
    return networkMessage;
  }

  if (
    status === 401 ||
    status === 403 ||
    message.includes('permission') ||
    message.includes('forbidden') ||
    message.includes('not authorized') ||
    message.includes('unauthorized')
  ) {
    return "You don't have permission to complete this action. Please contact your teacher if you need access.";
  }

  if (context === 'login' && message === 'invalid login credentials') {
    return 'Invalid email or password. Please try again.';
  }

  if (context === 'login' && message === 'email not confirmed') {
    return 'Please verify your email before logging in.';
  }

  return fallbackMessages[context];
}
