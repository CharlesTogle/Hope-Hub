import { useEffect, useRef, useState, memo } from 'react';
import timerIcon from '@/assets/icons/timer_pft.png';

const SimpleTimer = ({
  onEnd = () => {},
  onStart = () => {},
  time = 320,
  className,
  testName,
}) => {
  const [currentTime, setCurrentTime] = useState(time);
  const timerRef = useRef(null);
  const onEndRef = useRef(onEnd);
  const onStartRef = useRef(onStart);
  useEffect(() => {
    onEndRef.current = onEnd;
    onStartRef.current = onStart;
  }, [onEnd, onStart]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    setCurrentTime(time);

    timerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          onEndRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);

    onStartRef.current();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [time, testName]);

  return (
    <div className={`${className} w-fit`}>
      <img src={timerIcon} alt='rest-timer' className='w-[15%]' />
      <p className='text-nowrap text-sm'>
        {Math.floor(currentTime / 60)}:{' '}
        {String(currentTime % 60).padStart(2, '0')}{' '}
        <span>{currentTime < 60 ? 'seconds' : 'mins'}</span>
      </p>
    </div>
  );
};

export default memo(SimpleTimer);
