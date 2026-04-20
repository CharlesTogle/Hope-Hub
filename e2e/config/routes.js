/**
 * All application routes for Hope Hub
 * Mirrors the route map in PRD.md
 */

export const APP_ROUTES = {
  home: '/',
  about: '/about',
  notFound: '/this-does-not-exist',

  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    changePassword: '/auth/change-password',
    accountVerification: '/auth/account-verification',
  },

  lectures: {
    index: '/lectures',
    lesson: (lessonNumber) => `/lectures/lecture/${lessonNumber}`,
  },

  quizzes: {
    index: '/quizzes',
    quiz: (quizId) => `/quizzes/quiz/${quizId}`,
  },

  physicalFitnessTest: {
    parq: '/physical-fitness-test/parq',
    test: (index) => `/physical-fitness-test/test/${index}`,
    summary: (testType) => `/physical-fitness-test/summary/${testType}`,
    preSummary: '/physical-fitness-test/summary/pre-test',
    postSummary: '/physical-fitness-test/summary/post-test',
  },

  healthCalculators: {
    index: '/health-calculators',
    bmi: '/health-calculators/bmi',
    bmr: '/health-calculators/bmr',
    ibw: '/health-calculators/ibw',
    waterIntake: '/health-calculators/waterintake',
    bodyFat: '/health-calculators/bodyfatpercentage',
    heartRate: '/health-calculators/heartrate',
  },

  workoutZone: {
    index: '/workout-zone',
    video: (videoUrl) => `/workout-zone/${videoUrl}`,
  },

  dashboard: '/dashboard',
  viewClass: (classCode) => `/dashboard/view-class/${classCode}`,
};

export const PROTECTED_ROUTES = [
  APP_ROUTES.dashboard,
  APP_ROUTES.lectures.index,
  APP_ROUTES.quizzes.index,
  APP_ROUTES.physicalFitnessTest.parq,
  APP_ROUTES.workoutZone.index,
  APP_ROUTES.healthCalculators.index,
];

export const PUBLIC_ROUTES = [
  APP_ROUTES.home,
  APP_ROUTES.about,
  APP_ROUTES.auth.login,
  APP_ROUTES.auth.register,
  APP_ROUTES.auth.forgotPassword,
];
