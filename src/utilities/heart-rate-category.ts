import type { HeartRateResult } from '@/types/calculations';

export function getHeartRateCategory(index: number): HeartRateResult['zone'] {
  const zones: HeartRateResult['zone'][] = [
    'Very Light',
    'Light',
    'Moderate',
    'Hard',
    'Very Hard',
  ];

  return zones[index] ?? 'Very Hard';
}
