function shuffleArray(array) {
  const arr = [...array]; // copy to avoid mutating original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function calculatePoints(isCorrect, timeRemaining, totalTime) {
  const basePoints = isCorrect ? 1000 : 500;
  const timeDeduction = Math.round((timeRemaining / totalTime) * basePoints);
  return timeDeduction < 100 ? 100 : Math.round(timeDeduction / 100) * 100;
}

export { shuffleArray, calculatePoints };
