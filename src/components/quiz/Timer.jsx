import { useEffect, useState, useContext } from 'react';
import TimerIcon from '@/assets/icons/timer_quiz.png';
import { RemainingTimeContext } from '@/providers/QuizContext';
import { motion } from 'motion/react';
import { updateRemainingTime } from '@/utilities/QuizData';
import { useParams } from 'react-router-dom';

export default function Timer ({ duration, color, onTimerEnd }) {
  const { quizId } = useParams();
  const [time, setTime] = useState(0);
  const [hasTimerEnded, setHasTimerEnded] = useState(false);
  const remainingTimeRef = useContext(RemainingTimeContext);
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
      updateRemainingTime(quizId, remainingTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, quizId]);

  // fix for race condition where onTimerEnd is called twice
  if (hasTimerEnded) {
    onTimerEnd();
    setHasTimerEnded(false);
  }

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
