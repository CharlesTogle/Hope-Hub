import { Lessons } from '@/utilities/Lessons';
import type { CleanedStudent } from '@/types/student';

export interface LectureFilterItem {
  Type: 'Lecture';
  LessonNumber: number;
}

export interface QuizFilterItem {
  Type: 'Quiz';
  QuizNumber: number;
}

export type FilterItem = LectureFilterItem | QuizFilterItem;
export type FilterValue = 'All' | 'Lecture' | 'Quiz';
export type LectureSubFilterValue = 'all' | 'done' | 'pending' | 'incomplete';
export type QuizSubFilterValue = 'none' | 'ascending' | 'descending';

export const lecturesData: LectureFilterItem[] = Lessons.map((item) => ({
  Type: 'Lecture',
  LessonNumber: item.key,
}));

export const viewClassFilters: FilterValue[] = ['All', 'Lecture', 'Quiz'];

export const lectureSubFilterOptions: ReadonlyArray<{
  value: LectureSubFilterValue;
  label: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'done', label: 'Done' },
  { value: 'pending', label: 'Pending' },
  { value: 'incomplete', label: 'Incomplete' },
];

export const quizSubFilterOptions: ReadonlyArray<{
  value: QuizSubFilterValue;
  label: string;
}> = [
  { value: 'none', label: 'Default' },
  { value: 'ascending', label: 'Low to High' },
  { value: 'descending', label: 'High to Low' },
];

export function buildQuizFilterItems(quizNumbers: number[]): QuizFilterItem[] {
  return quizNumbers.map((quizNumber) => ({
    Type: 'Quiz',
    QuizNumber: quizNumber,
  }));
}

export function getTableHeadings(
  activeFilter: FilterValue,
  data: FilterItem[],
): string[] {
  const headings = ['Name', 'Email'];

  if (activeFilter === 'Lecture') {
    data.forEach((entry) => {
      if (entry.Type === 'Lecture') {
        headings.push(`Lesson ${entry.LessonNumber}`);
      }
    });
    return headings;
  }

  if (activeFilter === 'Quiz') {
    data.forEach((entry) => {
      if (entry.Type === 'Quiz') {
        headings.push(`Quiz ${entry.QuizNumber}`);
      }
    });
    return headings;
  }

  data.forEach((entry) => {
    if (entry.Type === 'Lecture') headings.push(`Lesson ${entry.LessonNumber}`);
    else headings.push(`Quiz ${entry.QuizNumber}`);
  });
  headings.push('Pre Test Record', 'Post Test Record');

  return headings;
}

function lessonKeys(student: CleanedStudent): string[] {
  return Object.keys(student).filter((key) => key.startsWith('Lesson'));
}

function averageQuizScore(student: CleanedStudent): number {
  let total = 0;
  let count = 0;

  Object.keys(student).forEach((key) => {
    const value = student[key];

    if (!key.startsWith('Quiz') || !value || value === 'Pending') {
      return;
    }

    if (typeof value === 'string') {
      const match = value.match(/(\d+)\/(\d+)/);

      if (match) {
        total += parseInt(match[1], 10) / parseInt(match[2], 10);
        count++;
      }
    }
  });

  return count > 0 ? total / count : 0;
}

export function filterStudentsByLectureStatus(
  students: CleanedStudent[],
  lectureSubFilter: LectureSubFilterValue,
): CleanedStudent[] {
  if (lectureSubFilter === 'all') {
    return students;
  }

  if (lectureSubFilter === 'done') {
    return students.filter((student) =>
      lessonKeys(student).every((key) => student[key] === 'Done'),
    );
  }

  if (lectureSubFilter === 'pending') {
    return students.filter((student) =>
      lessonKeys(student).some((key) => student[key] === 'Pending'),
    );
  }

  return students.filter((student) =>
    lessonKeys(student).some((key) => student[key] === 'Incomplete'),
  );
}

export function sortStudentsByQuizAverage(
  students: CleanedStudent[],
  quizSubFilter: QuizSubFilterValue,
): CleanedStudent[] {
  if (quizSubFilter === 'none') {
    return students;
  }

  return [...students].sort((leftStudent, rightStudent) =>
    quizSubFilter === 'ascending'
      ? averageQuizScore(leftStudent) - averageQuizScore(rightStudent)
      : averageQuizScore(rightStudent) - averageQuizScore(leftStudent),
  );
}

export function filterStudentsBySearchTerm(
  students: CleanedStudent[],
  searchTerm: string,
): CleanedStudent[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return students;
  }

  return students.filter((student) =>
    student.studentName?.toLowerCase().includes(normalizedSearchTerm),
  );
}
