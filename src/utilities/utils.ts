export function shuffleArray<T>(array: readonly T[]): T[] {
  const arr = [...array]; // copy to avoid mutating original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function calculatePoints(
  isCorrect: boolean,
  timeRemaining: number,
  totalTime: number,
): number {
  const basePoints = isCorrect ? 1000 : 500;
  const timeDeduction = Math.round((timeRemaining / totalTime) * basePoints);
  return timeDeduction < 100 ? 100 : Math.round(timeDeduction / 100) * 100;
}
