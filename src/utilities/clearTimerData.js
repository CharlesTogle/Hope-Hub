/**
 * Clears all timer-related data from localStorage
 * This should be called when a user logs out to clean up persisted timer data
 */
export function clearAllTimerData () {
  const keys = Object.keys(localStorage);

  // Find all keys that contain timer data patterns
  const timerKeys = keys.filter(
    key =>
      key.includes('Timer') &&
      (key.endsWith('RemainingTime') || key.endsWith('IsRunning')),
  );

  // Remove all timer-related keys
  timerKeys.forEach(key => {
    localStorage.removeItem(key);
  });

}
