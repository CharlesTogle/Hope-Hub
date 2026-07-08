import { describe, it, expect } from 'vitest';
import { generateStudentCsv } from '@/utilities/exportStudentCsv';
import type { CleanedStudent } from '@/types/student';

describe('generateStudentCsv formula neutralization', () => {
  it('prefixes formula-like values with apostrophe', () => {
    const student: CleanedStudent = {
      uuid: '1',
      studentName: '=HYPERLINK("http://evil","click")',
      email: '@SUM(A1:A10)',
      preTestCompleted: false,
      postTestCompleted: false,
      Lesson1: '-MALICIOUS',
      Quiz1: '+FORMULA',
    };
    const csv = generateStudentCsv([student], null, 1, 1);
    expect(csv).not.toBeNull();
    expect(csv!).toContain("'=HYPERLINK");
    expect(csv!).toContain("'@SUM");
    expect(csv!).toContain("'+FORMULA");
  });

  it('does not prefix safe values', () => {
    const student: CleanedStudent = {
      uuid: '1',
      studentName: 'John Doe',
      email: 'john@example.com',
      preTestCompleted: false,
      postTestCompleted: false,
      Lesson1: 'Done',
      Quiz1: 'Yes',
    };
    const csv = generateStudentCsv([student], null, 1, 1);
    expect(csv).not.toBeNull();
    expect(csv!).toContain('John Doe');
    expect(csv!).toContain('john@example.com');
    expect(csv!).not.toContain("'John");
  });
});
