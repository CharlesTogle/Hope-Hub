export const quizKeys = {
  all: ['quiz'] as const,
  list: () => [...quizKeys.all, 'list'] as const,
  detail: (id: number | string) => [...quizKeys.all, 'detail', id] as const,
  progress: (id: number | string) => [...quizKeys.all, 'progress', id] as const,
  leaderboard: (id: number | string) => [...quizKeys.all, 'leaderboard', id] as const,
};

export const authKeys = {
  all: ['auth'] as const,
  current: () => [...authKeys.all, 'current'] as const,
};

export const profileKeys = {
  all: ['profile'] as const,
  detail: (id: string) => [...profileKeys.all, id] as const,
  picture: (id: string) => [...profileKeys.all, 'picture', id] as const,
  name: (id: string) => [...profileKeys.all, 'name', id] as const,
};

export const lectureKeys = {
  progress: (id: string) => ['lecture', 'progress', id] as const,
};

export const pftKeys = {
  session: (id: string) => ['pft', 'session', id] as const,
};

export const classKeys = {
  students: (code: string) => ['class', 'students', code] as const,
  codes: (teacherId: string) => ['class', 'codes', teacherId] as const,
  studentCode: (userId: string) => ['class', 'student-code', userId] as const,
};
