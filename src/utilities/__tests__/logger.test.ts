import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from '@/utilities/logger';

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('strips email from meta', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test', new Error('fail'), { email: 'user@example.com', quizId: 5 });
    const arg = spy.mock.calls[0][0];
    expect(typeof arg).toBe('string');
    expect(arg).not.toContain('user@example.com');
    expect(arg).toContain('quizId');
  });

  it('strips password from meta', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test', 'msg', { password: 'secret' });
    const arg = spy.mock.calls[0][0];
    expect(typeof arg).toBe('string');
    expect(arg).not.toContain('secret');
  });

  it('normalizes Error objects', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test', new Error('my message'));
    const arg = spy.mock.calls[0][0];
    expect(typeof arg).toBe('string');
    expect(arg).toContain('my message');
    expect(arg).toContain('Error');
  });

  it('handles non-Error objects', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test', 'plain string error');
    const arg = spy.mock.calls[0][0];
    expect(typeof arg).toBe('string');
    expect(arg).toContain('plain string error');
  });
});
