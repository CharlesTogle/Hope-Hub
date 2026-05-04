export function clearAllTimerData(): void {
  const keys = Object.keys(localStorage);

  const timerKeys = keys.filter(
    (key) =>
      key.includes('Timer') &&
      (key.endsWith('RemainingTime') || key.endsWith('IsRunning')),
  );

  timerKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
}
