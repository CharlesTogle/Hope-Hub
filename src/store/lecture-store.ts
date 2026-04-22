import { create } from 'zustand';
import type { LectureProgressItem } from '@/types/lecture';

interface LectureState {
  lectureProgress: LectureProgressItem[];
  setLectureProgress: (progress: LectureProgressItem[]) => void;
  markDone: (key: number) => void;
  reset: () => void;
}

const initialState = {
  lectureProgress: [] as LectureProgressItem[],
};

export const useLectureStore = create<LectureState>((set) => ({
  ...initialState,

  setLectureProgress: (lectureProgress) => set({ lectureProgress }),

  markDone: (key) =>
    set((s) => ({
      lectureProgress: s.lectureProgress.map((item) =>
        item.key === key ? { ...item, status: 'Done' as const } : item,
      ),
    })),

  reset: () => set(initialState),
}));
