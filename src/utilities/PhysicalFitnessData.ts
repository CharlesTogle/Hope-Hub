import { PhysicalFitnessTestList } from './PhysicalFitnessTestList';
import type { PFTSessionData } from '@/types/physical-fitness';

export const numberOfTests = PhysicalFitnessTestList.length;

export const PhysicalFitnessData: PFTSessionData = {
  gender: '',
  category: '',
  isPARQFinished: false,
  finishedTestIndex: Array.from({ length: numberOfTests }, () => -1),
};
