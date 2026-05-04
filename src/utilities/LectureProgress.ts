import { Lessons } from './Lessons';
import type { LectureProgressItem } from '@/types/lecture';

const LectureProgress = (): LectureProgressItem[] => {
  return Lessons.map((item) => ({
    title: item.title,
    key: item.key,
    status: 'Incomplete' as const,
  }));
};

export default LectureProgress;
