import { useEffect, useState } from 'react';
import TimerIcon from '@/assets/icons/timer_quiz.png';
import { updateRemainingTime } from '@/mutations/quiz-mutations';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useQuizStore } from '@/store/quiz-store';

interface TimerProps {
  duration: number;
  color: 'red';
  onTimerEnd: () => void;
}

const colorClassNames: Record<TimerProps['color'], string> = {
  red: 'text-red',
};

export default function Timer({ duration, color, onTimerEnd }: TimerProps) {
  const { quizId } = useParams();
  const [time, setTime] = useState(0);
  const [hasTimerEnded, setHasTimerEnded] = useState(false);
  const setRemainingTime = useQuizStore((state) => state.setRemainingTime);

  useEffect(() => {
    const startTime = Date.now();
    setTime(duration);
    setRemainingTime(duration);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remainingTime = duration - elapsed;
      if (elapsed > duration) {
        clearInterval(interval);
        setHasTimerEnded(true);
      } else {
        setTime(remainingTime);
        setRemainingTime(remainingTime);
      }
      if (quizId) {
        updateRemainingTime(quizId, remainingTime).then((error) => {
          if (error) console.error('Failed to sync timer', { quizId, remainingTime, error });
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, quizId, setRemainingTime]);

  useEffect(() => {
    if (!hasTimerEnded) return;
    onTimerEnd();
    setHasTimerEnded(false);
  }, [hasTimerEnded, onTimerEnd]);

  return (
    <div className='flex items-center gap-4'>
      <motion.img
        animate={{
          rotate: [-5, 5, -5, 5],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className='size-7 lg:size-8'
        src={TimerIcon}
        alt='timer'
      />
      <motion.span
        animate={{
          scale: [1, 1.08, 1],
          opacity: [1, 0.9, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`text-base font-content ${colorClassNames[color]}`}
      >
        {time} {time > 1 ? 'seconds' : 'second'}
      </motion.span>
    </div>
  );
}
