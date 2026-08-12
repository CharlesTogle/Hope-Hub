import { describe, expect, it } from 'vitest';
import { getUserFacingError } from '@/utilities/user-facing-errors';
import type { ErrorContext } from '@/utilities/user-facing-errors';

const contexts: ErrorContext[] = [
  'login',
  'registration',
  'password-reset',
  'verification-resend',
  'join-class',
  'leave-class',
  'class-management',
  'pft-save',
  'profile-upload',
  'calculation',
  'load',
];

describe('getUserFacingError', () => {
  it('maps network failures to a retry instruction', () => {
    expect(getUserFacingError(new TypeError('Failed to fetch'), 'password-reset')).toBe(
      "We can't reach the server right now. Check your internet connection and try again in a moment.",
    );
  });

  it('maps network signals from strings and unknown objects', () => {
    expect(getUserFacingError('Request timed out', 'load')).toContain('try again');
    expect(getUserFacingError({ message: 'NETWORK_ERROR' }, 'load')).toContain('internet connection');
  });

  it('maps rate limits to context-specific wait instructions', () => {
    expect(getUserFacingError({ status: 429, message: 'rate limit exceeded' }, 'registration')).toBe(
      'Too many registration attempts. Please wait a moment and try again.',
    );
    expect(getUserFacingError({ statusCode: '429' }, 'password-reset')).toBe(
      "You've requested several reset links. Please wait a few minutes before trying again.",
    );
    expect(getUserFacingError(new Error('too many requests'), 'join-class')).toBe(
      'Too many attempts. Please wait a moment and try again.',
    );
  });

  it('maps known authentication failures without exposing provider text', () => {
    expect(getUserFacingError(new Error('Invalid login credentials'), 'login')).toBe(
      'Invalid email or password. Please try again.',
    );
    expect(getUserFacingError(new Error('email not confirmed'), 'login')).toBe(
      'Please verify your email before logging in.',
    );
  });

  it('maps permission failures to safe action-oriented copy', () => {
    expect(getUserFacingError({ status: 403, message: 'permission denied: SQL policy' }, 'load')).toBe(
      "You don't have permission to complete this action. Please contact your teacher if you need access.",
    );
    expect(getUserFacingError(new Error('Unauthorized PostgREST response'), 'class-management')).toContain(
      'permission',
    );
  });

  it('maps unknown errors to the specified context-specific safe copy', () => {
    expect(getUserFacingError(new Error('SQL relation profile missing'), 'pft-save')).toBe(
      'We could not save your fitness test data. Check your connection and try saving again.',
    );
  });

  it.each(contexts)('has a safe fallback for the %s context', (context) => {
    expect(getUserFacingError({}, context)).toBeTruthy();
  });

  it('never returns technical input for any context or error shape', () => {
    const technicalInput = 'AuthApiError: SQL relation profile missing; Failed to fetch token=secret';
    for (const context of contexts) {
      const message = getUserFacingError({ message: technicalInput, status: 500 }, context);
      expect(message).not.toContain('AuthApiError');
      expect(message).not.toContain('SQL');
      expect(message).not.toContain('Failed to fetch');
      expect(message).not.toContain('secret');
    }
    expect(getUserFacingError(technicalInput, 'load')).not.toContain(technicalInput);
    expect(getUserFacingError({ detail: technicalInput }, 'load')).not.toContain(technicalInput);
    expect(getUserFacingError(null, 'load')).not.toContain('null');
  });
});
