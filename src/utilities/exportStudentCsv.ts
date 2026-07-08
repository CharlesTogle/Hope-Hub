import type { CleanedStudent } from '@/types/student';
import type { PFTTestResult } from '@/types/physical-fitness';

function formatPFTTest(testData: PFTTestResult | undefined): string {
  if (!testData) return 'Not completed';
  const score = testData.record !== undefined ? testData.record : 'N/A';
  const classification = testData.classification || 'N/A';
  return `Score: ${score}, Classification: ${classification}`;
}

function formatBMI(
  heightData: PFTTestResult | undefined,
  weightData: PFTTestResult | undefined,
): string {
  if (!heightData || !weightData) return 'Not completed';
  const height = heightData.record || 'N/A';
  const weight = weightData.record || 'N/A';
  let bmi = 'N/A';
  let classification = 'N/A';
  if (height !== 'N/A' && weight !== 'N/A') {
    const heightValue = Number(height);
    const weightValue = Number(weight);
    const heightInM = heightValue / 100;
    bmi = (weightValue / (heightInM * heightInM)).toFixed(2);
    if (Number(bmi) < 18.5) classification = 'Underweight';
    else if (Number(bmi) < 25) classification = 'Normal';
    else if (Number(bmi) < 30) classification = 'Overweight';
    else classification = 'Obese';
  }
  return `Height: ${height}cm, Weight: ${weight}kg, BMI: ${bmi}, Classification: ${classification}`;
}

function formatStepTest(
  preStepData: PFTTestResult | undefined,
  stepData: PFTTestResult | undefined,
): string {
  if (!preStepData || !stepData) return 'Not completed';
  const before = preStepData.record !== undefined ? `${preStepData.record} BPM` : 'N/A';
  const after = stepData.record !== undefined ? `${stepData.record} BPM` : 'N/A';
  return `Before: ${before} After: ${after}`;
}

function escapeCsvField(value: string | number): string {
  const str = String(value);
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (neutralized.includes(',') || neutralized.includes('"') || neutralized.includes('\n')) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export function generateStudentCsv(
  students: CleanedStudent[],
  _classCode: string | null,
  lessonCount: number | null = null,
  quizCount: number | null = null,
): string | null {
  if (students.length === 0) return null;

  let lessonKeys: string[] = [];
  let quizKeys: string[] = [];

  if (lessonCount !== null && quizCount !== null) {
    lessonKeys = Array.from({ length: lessonCount }, (_, i) => `Lesson${i + 1}`);
    quizKeys = Array.from({ length: quizCount }, (_, i) => `Quiz${i + 1}`);
  } else {
    const sampleStudent = students[0];
    lessonKeys = Object.keys(sampleStudent).filter((key) => key.startsWith('Lesson'));
    quizKeys = Object.keys(sampleStudent).filter((key) => key.startsWith('Quiz'));
    lessonKeys.sort((a, b) => parseInt(a.replace('Lesson', '')) - parseInt(b.replace('Lesson', '')));
    quizKeys.sort((a, b) => parseInt(a.replace('Quiz', '')) - parseInt(b.replace('Quiz', '')));
  }

  const headers = [
    'Name',
    'Email',
    'Lecture Progress',
    ...quizKeys.map((key) => `Quiz ${key.replace('Quiz', '')}`),
    'Pre-Test: BMI',
    'Pre-Test: 3 Min Step Test',
    'Pre-Test: Push Up',
    'Pre-Test: Basic Plank',
    'Pre-Test: Zipper Test (Right)',
    'Pre-Test: Zipper Test (Left)',
    'Pre-Test: Sit and Reach (1st)',
    'Pre-Test: Sit and Reach (2nd)',
    'Post-Test: BMI',
    'Post-Test: 3 Min Step Test',
    'Post-Test: Push Up',
    'Post-Test: Basic Plank',
    'Post-Test: Zipper Test (Right)',
    'Post-Test: Zipper Test (Left)',
    'Post-Test: Sit and Reach (1st)',
    'Post-Test: Sit and Reach (2nd)',
  ];

  const rows: string[] = [headers.map(escapeCsvField).join(',')];

  for (const student of students) {
    const row: (string | number)[] = [];

    row.push(student.studentName || 'N/A');
    row.push(student.email || 'N/A');

    const lectureStatuses = lessonKeys
      .map((key) => student[key])
      .filter((s): s is string => s !== undefined);
    const completed = lectureStatuses.filter((l) => l === 'Done').length;
    row.push(`${completed}/${lectureStatuses.length}`);

    quizKeys.forEach((quizKey) => {
      const quizValue = student[quizKey];
      if (quizValue === undefined) row.push('Incomplete');
      else if (typeof quizValue === 'boolean') row.push(quizValue ? 'Yes' : 'No');
      else row.push(quizValue);
    });

    const preTestData = student.prePFTRaw ?? null;
    if (preTestData) {
      row.push(formatBMI(preTestData.bmiHeight, preTestData.bmiWeight));
      row.push(formatStepTest(preTestData.preStepTest, preTestData.stepTest));
      row.push(formatPFTTest(preTestData.pushUp));
      row.push(formatPFTTest(preTestData.basicPlank));
      row.push(formatPFTTest(preTestData.zipperTestRight));
      row.push(formatPFTTest(preTestData.zipperTestLeft));
      row.push(formatPFTTest(preTestData.sitAndReachFirst));
      row.push(formatPFTTest(preTestData.sitAndReachSecond));
    } else {
      for (let i = 0; i < 8; i++) row.push('Not completed');
    }

    const postTestData = student.postPFTRaw ?? null;
    if (postTestData) {
      row.push(formatBMI(postTestData.bmiHeight, postTestData.bmiWeight));
      row.push(formatStepTest(postTestData.preStepTest, postTestData.stepTest));
      row.push(formatPFTTest(postTestData.pushUp));
      row.push(formatPFTTest(postTestData.basicPlank));
      row.push(formatPFTTest(postTestData.zipperTestRight));
      row.push(formatPFTTest(postTestData.zipperTestLeft));
      row.push(formatPFTTest(postTestData.sitAndReachFirst));
      row.push(formatPFTTest(postTestData.sitAndReachSecond));
    } else {
      for (let i = 0; i < 8; i++) row.push('Not completed');
    }

    rows.push(row.map(escapeCsvField).join(','));
  }

  return rows.join('\n');
}

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateExportFilename(type: 'class' | 'student', identifier: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${type}-${identifier}-${date}.csv`;
}
