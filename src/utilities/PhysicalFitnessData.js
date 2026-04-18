import { PhysicalFitnessTestList } from './PhysicalFitnessTestList';

export const numberOfTests = PhysicalFitnessTestList.length;
export const PhysicalFitnessData = {
  gender: '',
  category: '',
  isPARQFinished: false,
  finishedTestIndex: Array.from({ length: numberOfTests }, () => -1),
};
