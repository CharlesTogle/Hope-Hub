import { useContext } from 'react';
import { createContext } from 'react';

export const LectureProgressContext = createContext();

export const useLectureProgress = () => {
  const context = useContext(LectureProgressContext);

  if (!context) {
    throw new Error('usePhysicalFitnessData must be used within a provider');
  }
  return context;
};

export default useLectureProgress
