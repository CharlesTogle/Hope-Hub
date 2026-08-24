import { PhysicalFitnessData } from '@/utilities/PhysicalFitnessData';
import type { PFTColumnName, PFTSessionData } from '@/types/physical-fitness';

export const PFT_STORAGE_KEY = 'physicalFitnessData';
export const PFT_TIMEOUT_SECONDS = 1200;

export interface PFTStatus {
  isTaken: boolean;
  testType: PFTColumnName;
}

export interface PFTRecordRow {
  pre_physical_fitness_test: PFTSessionData | null;
  post_physical_fitness_test: PFTSessionData | null;
}

export function isFinishedTestIndexes(
  finishedIndexes: number[] | null | undefined,
): boolean {
  const indexes = finishedIndexes ?? [];
  return (
    indexes.length === PhysicalFitnessData.finishedTestIndex.length &&
    indexes.every((index, position) => index === position)
  );
}

export function isFinishedTestSession(session: PFTSessionData | null): boolean {
  return isFinishedTestIndexes(session?.finishedTestIndex);
}

export function isPftQuizUnlocked(
  preSession: PFTSessionData | null,
  postSession: PFTSessionData | null,
): boolean {
  return isFinishedTestSession(preSession) && isFinishedTestSession(postSession);
}

export function getNextUnfinishedTestIndex(finishedIndexes: number[]): number {
  const nextIndex = finishedIndexes.findIndex((index) => index === -1);
  return nextIndex === -1 ? 0 : nextIndex;
}

export function derivePftStatus(record: PFTRecordRow | null): PFTStatus {
  const preSession = record?.pre_physical_fitness_test ?? null;
  const postSession = record?.post_physical_fitness_test ?? null;

  if (!isFinishedTestSession(preSession)) {
    return { isTaken: false, testType: 'pre_physical_fitness_test' };
  }

  if (!isFinishedTestSession(postSession)) {
    return { isTaken: false, testType: 'post_physical_fitness_test' };
  }

  return { isTaken: true, testType: 'pre_physical_fitness_test' };
}

export function getStoredOrDefaultPftSessionData(
  storedSessionData: PFTSessionData | null,
): PFTSessionData {
  return storedSessionData ?? PhysicalFitnessData;
}

export function resetPftProgress(sessionData: PFTSessionData): PFTSessionData {
  return {
    ...PhysicalFitnessData,
    gender: sessionData.gender,
    category: sessionData.category,
    isPARQFinished: sessionData.isPARQFinished,
  };
}
