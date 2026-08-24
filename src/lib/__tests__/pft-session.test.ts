import { describe, it, expect } from 'vitest';
import { PhysicalFitnessData } from '@/utilities/PhysicalFitnessData';
import {
  isFinishedTestSession,
  isFinishedTestIndexes,
  getNextUnfinishedTestIndex,
  derivePftStatus,
  resetPftProgress,
  isPftQuizUnlocked,
} from '@/lib/pft-session';
import type { PFTSessionData } from '@/types/physical-fitness';
import type { PFTRecordRow } from '@/lib/pft-session';

const finishedTestIndexes = PhysicalFitnessData.finishedTestIndex.map((_, index) => index);

describe('isFinishedTestSession', () => {
  it('returns false for null', () => {
    expect(isFinishedTestSession(null)).toBe(false);
  });

  it('returns false when empty array', () => {
    const session: PFTSessionData = { ...PhysicalFitnessData, finishedTestIndex: [] };
    expect(isFinishedTestSession(session)).toBe(false);
  });

  it('returns false when contains -1', () => {
    const session: PFTSessionData = { ...PhysicalFitnessData, finishedTestIndex: [0, -1, 2] };
    expect(isFinishedTestSession(session)).toBe(false);
  });

  it('returns false when only some tests are listed as finished', () => {
    const session: PFTSessionData = { ...PhysicalFitnessData, finishedTestIndex: [0, 1, 2] };
    expect(isFinishedTestSession(session)).toBe(false);
  });

  it('returns true when all finished', () => {
    const session: PFTSessionData = { ...PhysicalFitnessData, finishedTestIndex: finishedTestIndexes };
    expect(isFinishedTestSession(session)).toBe(true);
  });
});

describe('isFinishedTestIndexes', () => {
  it('rejects arrays that only contain the last index', () => {
    const lastIndex = PhysicalFitnessData.finishedTestIndex.length - 1;
    expect(isFinishedTestIndexes([lastIndex])).toBe(false);
    expect(isFinishedTestIndexes([0, lastIndex])).toBe(false);
  });
});

describe('getNextUnfinishedTestIndex', () => {
  it('returns 0 for empty array', () => {
    expect(getNextUnfinishedTestIndex([])).toBe(0);
  });

  it('returns index of first -1', () => {
    expect(getNextUnfinishedTestIndex([0, 1, -1, -1])).toBe(2);
  });

  it('returns 0 when all finished', () => {
    expect(getNextUnfinishedTestIndex([0, 1, 2])).toBe(0);
  });
});

describe('derivePftStatus', () => {
  it('returns pre_physical_fitness_test for null record', () => {
    expect(derivePftStatus(null)).toEqual({ isTaken: false, testType: 'pre_physical_fitness_test' });
  });

  it('returns pre when pre not finished', () => {
    const record: PFTRecordRow = {
      pre_physical_fitness_test: { ...PhysicalFitnessData, finishedTestIndex: [] },
      post_physical_fitness_test: null,
    };
    expect(derivePftStatus(record)).toEqual({ isTaken: false, testType: 'pre_physical_fitness_test' });
  });

  it('returns post when pre done but post not finished', () => {
    const record: PFTRecordRow = {
      pre_physical_fitness_test: { ...PhysicalFitnessData, finishedTestIndex: finishedTestIndexes },
      post_physical_fitness_test: { ...PhysicalFitnessData, finishedTestIndex: [] },
    };
    expect(derivePftStatus(record)).toEqual({ isTaken: false, testType: 'post_physical_fitness_test' });
  });

  it('returns isTaken true when both done', () => {
    const done = { ...PhysicalFitnessData, finishedTestIndex: finishedTestIndexes };
    const record: PFTRecordRow = {
      pre_physical_fitness_test: done,
      post_physical_fitness_test: done,
    };
    expect(derivePftStatus(record)).toEqual({ isTaken: true, testType: 'pre_physical_fitness_test' });
  });
});

describe('isPftQuizUnlocked', () => {
  const done = { ...PhysicalFitnessData, finishedTestIndex: finishedTestIndexes };

  it('keeps the PFT quiz locked until both tests are complete', () => {
    expect(isPftQuizUnlocked(done, null)).toBe(false);
    expect(isPftQuizUnlocked(done, done)).toBe(true);
  });
});

describe('resetPftProgress', () => {
  it('resets test fields but keeps gender/category/PARQ', () => {
    const session: PFTSessionData = {
      ...PhysicalFitnessData,
      gender: 'Female',
      category: 'secondaryGirls',
      isPARQFinished: true,
      finishedTestIndex: finishedTestIndexes,
    };
    const result = resetPftProgress(session);
    expect(result.gender).toBe('Female');
    expect(result.category).toBe('secondaryGirls');
    expect(result.isPARQFinished).toBe(true);
    expect(result.finishedTestIndex).toEqual(PhysicalFitnessData.finishedTestIndex);
  });
});
