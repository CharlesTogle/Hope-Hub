/**
 * Test users and mock data factories for Hope Hub e2e tests
 */

export const testUsers = {
  student: {
    id: 'student-uuid-001',
    email: 'student@test.com',
    fullName: 'Test Student',
    userType: 'student',
    classCode: 'CLASS123',
  },
  teacher: {
    id: 'teacher-uuid-001',
    email: 'teacher@test.com',
    fullName: 'Test Teacher',
    userType: 'teacher',
    classCode: null,
  },
};

/**
 * Creates a mock Supabase JWT token (structure only — not cryptographically valid)
 */
export function createMockJWT(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      user_metadata: {
        fullName: user.fullName,
        userType: user.userType,
        classCode: user.classCode,
      },
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64');

  return `${header}.${payload}.mock_signature`;
}

/**
 * Creates a mock Supabase session object
 */
export function createMockSession(user) {
  const accessToken = createMockJWT(user);

  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock_refresh_token',
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        fullName: user.fullName,
        userType: user.userType,
        classCode: user.classCode,
      },
      app_metadata: { provider: 'email' },
      role: 'authenticated',
      aud: 'authenticated',
    },
  };
}

/**
 * Creates a mock profile row (from `profile` DB table)
 */
export function createMockProfile(user, overrides = {}) {
  return {
    uuid: user.id,
    full_name: user.fullName,
    email: user.email,
    user_type: user.userType,
    ...overrides,
  };
}

/**
 * Creates mock lecture progress data
 */
export function createMockLectureProgress(overrides = {}) {
  return {
    uuid: testUsers.student.id,
    lecture_progress: [
      { key: 1, title: 'Personal Safety Protocol', status: 'Done' },
      { key: 2, title: 'Physiological Indicators', status: 'Pending' },
      { key: 3, title: 'The FITT Principle', status: 'Incomplete' },
    ],
    ...overrides,
  };
}

/**
 * Creates mock quiz progress data
 */
export function createMockQuizProgress(overrides = {}) {
  return {
    id: `qp-${Date.now()}`,
    user_id: testUsers.student.id,
    quiz_id: 1,
    status: 'Pending',
    score: 0,
    points: 0,
    question_index: 0,
    ...overrides,
  };
}

/**
 * Creates mock quiz data
 */
export function createMockQuiz(overrides = {}) {
  return {
    id: 1,
    title: 'Quiz 1',
    lecture_title: 'Personal Safety Protocol',
    description: 'Test your knowledge on personal safety.',
    questions: [],
    ...overrides,
  };
}

/**
 * Creates mock class data for teachers
 */
export function createMockClass(overrides = {}) {
  return {
    class_code: 'CLASS123',
    class_name: 'PE 1 - Section A',
    class_color: '#4F46E5',
    uuid: testUsers.teacher.id,
    ...overrides,
  };
}

/**
 * Creates mock physical fitness test data
 */
export function createMockPhysicalFitnessTest(overrides = {}) {
  return {
    uuid: testUsers.student.id,
    pre_physical_fitness_test: null,
    post_physical_fitness_test: null,
    ...overrides,
  };
}
