import { describe, expect, it } from 'vitest';
import { shouldStartPendingLectureProgressUpdate } from '../LectureProgress';

describe('shouldStartPendingLectureProgressUpdate', () => {
  it('prevents an automatic retry for the same user and lecture after a failed save', () => {
    const attempt = 'student-1:1';

    expect(shouldStartPendingLectureProgressUpdate(null, attempt)).toBe(true);
    expect(shouldStartPendingLectureProgressUpdate(attempt, attempt)).toBe(false);
  });

  it('allows a new automatic update when the user or lecture changes', () => {
    expect(shouldStartPendingLectureProgressUpdate('student-1:1', 'student-1:2')).toBe(true);
    expect(shouldStartPendingLectureProgressUpdate('student-1:1', 'student-2:1')).toBe(true);
  });
});
