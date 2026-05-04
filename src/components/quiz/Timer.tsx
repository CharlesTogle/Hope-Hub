import { useEffect, useState } from 'react';
import TimerIcon from '@/assets/icons/timer_quiz.png';
import { useRemainingTimeRef } from '@/providers/QuizContext';
import { updateRemainingTime } from '@/mutations/quiz-mutations';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';

interface TimerProps {
  duration: number;
  color: string;
  onTimerEnd: () => void;
}

export default function Timer({ duration, color, onTimerEnd }: TimerProps) {
  const { quizId } = useParams();
  const [time, setTime] = useState(0);
  const [hasTimerEnded, setHasTimerEnded] = useState(false);
  const remainingTimeRef = useRemainingTimeRef();
  remainingTimeRef.current = time;

  useEffect(() => {
    const startTime = Date.now();
    setTime(duration);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remainingTime = duration - elapsed;
      if (elapsed > duration) {
        clearInterval(interval);
        setHasTimerEnded(true);
      } else setTime(remainingTime);
      if (quizId) {
        void updateRemainingTime(quizId, remainingTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, quizId]);

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
        className={`text-base font-content text-${color}`}
      >
        {time} {time > 1 ? 'seconds' : 'second'}
      </motion.span>
    </div>
  );
}
