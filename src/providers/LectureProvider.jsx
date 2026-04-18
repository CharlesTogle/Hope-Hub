import { LectureProgressContext } from '@/hooks/useLectureProgress';
import { useState } from 'react';
import LectureProgress from '@/utilities/LectureProgress';

export const LectureProgressProvider = ({ children }) => {
  const [lectureProgress, setLectureProgress] = useState(LectureProgress);

  return (
    <LectureProgressContext.Provider
      value={{ lectureProgress, setLectureProgress }}
    >
      {children}
    </LectureProgressContext.Provider>
  );
};

export default LectureProgressProvider;
