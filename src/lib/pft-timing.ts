export type PftTimingError =
  | 'end-before-start'
  | 'end-after-current-time'
  | 'too-short'
  | 'too-long';

export function shouldValidatePftTiming(appEnv: string | undefined): boolean {
  return appEnv !== 'DEV';
}

export function getPftTimingValidation(input: {
  appEnv: string | undefined;
  startTimeInMinutes: number;
  endTimeInMinutes: number;
  currentTimeInMinutes: number;
  isBmiTest: boolean;
}): PftTimingError | null {
  if (!shouldValidatePftTiming(input.appEnv)) {
    return null;
  }

  if (input.startTimeInMinutes > input.endTimeInMinutes) {
    return 'end-before-start';
  }

  if (input.endTimeInMinutes > input.currentTimeInMinutes) {
    return 'end-after-current-time';
  }

  const duration = input.endTimeInMinutes - input.startTimeInMinutes;

  if (!input.isBmiTest && duration < 3) {
    return 'too-short';
  }

  if (duration > 20) {
    return 'too-long';
  }

  return null;
}
