import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LectureVideo ({
  lectureNumber,
  title,
  introduction,
  quizLink,
  videoLink,
  isLectureDone = false,
  onVideoFinish = () => {},
}) {
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const intervalRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const startOrToggleProgress = () => {
    if (intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        if (videoRef.current) {
          setProgressSeconds(Math.floor(videoRef.current.currentTime));
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopProgress = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const handleSeeked = () => {
    if (videoRef.current) {
      const actualTime = Math.floor(videoRef.current.currentTime);
      setProgressSeconds(actualTime);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && intervalRef.current === null) {
      const actualTime = Math.floor(videoRef.current.currentTime);
      setProgressSeconds(actualTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      setDuration(Math.floor(videoRef.current.duration));
    }
  };

  useEffect(() => {
    if (!isDone && progressSeconds >= duration - 1 && duration > 0) {
      setIsDone(true);
      if (!isSaved) {
        onVideoFinish();
        setIsSaved(true);
      }
    }
  }, [progressSeconds, duration, isDone, isSaved, onVideoFinish]);

  return (
    <div
      id='video-lecture'
      className='w-full border-secondary-dark-blue border-3 rounded-2xl overflow-clip'
    >
      <h2 className='bg-secondary-dark-blue text-white py-3 px-5 font-content font-medium text-xl'>
        Lecture #{lectureNumber}:{' '}
        <span className='font-normal ml-3'>{title}</span>
      </h2>
      <div
        id='lecture-content'
        className='flex flex-col min-h-full justify-center p-10'
      >
        <video
          src={videoLink}
          controls
          onPlay={startOrToggleProgress}
          onPause={stopProgress}
          onSeeked={handleSeeked}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          ref={videoRef}
          className='h-full lg:h-120 md:h-70 md:w-fit self-center'
        >
          Your browser does not support the video tag.
        </video>
        <div
          id='lecture-description'
          className=' flex flex-col items-center h-fit mt-10 relative font-content lg:flex-row'
        >
          <p className='absolute top-0 left-0 text-accent-blue text-lg font-medium'>
            Introduction
          </p>
          <ul className='w-full pt-7 lg:pt-10'>
            <li className='ml-7 text-sm list-disc text-justify lg:text-base'>
              {introduction}
            </li>
          </ul>
          <hr className='w-full m-5 border-1 border-black lg:w-0 lg:h-45 lg:mt-0 lg:mb-0 lg:mr-10 lg:ml-10' />
          <div
            id='button-group'
            className='flex justify-center items-center flex-col'
          >
            <p className='text-center mb-5 font-md '>
              Done Learning? Test your knowledge and take the quiz!
            </p>
            <button
              onClick={() => {
                if (!isLectureDone) {
                  navigate('not-found');
                  return;
                }
                navigate(quizLink);
              }}
              disabled={isLectureDone ? undefined : true}
              className='w-[45%] py-2 text-lg text-white bg-secondary-dark-blue hover:brightness-90 disabled:brightness-50 lg:w-full lg:py-5 cursor-pointer'
            >
              TAKE QUIZ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
