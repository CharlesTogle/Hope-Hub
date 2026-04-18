# Hope Hub — Product Requirements Document (PRD)

> **Stack:** React 18 + Vite, Supabase (Postgres + Auth + Storage), Tailwind CSS, React Router v6, Framer Motion
> **Deployment:** Vercel
> **Last Updated:** 2026-04-18

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Route Map & File Mapping](#route-map--file-mapping)
4. [Module Breakdown](#module-breakdown)
   - [Auth Module](#auth-module)
   - [Home Module](#home-module)
   - [Lectures Module](#lectures-module)
   - [Quiz Module](#quiz-module)
   - [Physical Fitness Test Module](#physical-fitness-test-module)
   - [Health Calculators Module](#health-calculators-module)
   - [Workout Zone Module](#workout-zone-module)
   - [Dashboard Module](#dashboard-module)
   - [About Module](#about-module)
5. [Frontend–Backend Logic](#frontendbackend-logic)
6. [Supabase Integration Map](#supabase-integration-map)
7. [Storage Layer](#storage-layer)
8. [Caching Strategy](#caching-strategy)
9. [State Management](#state-management)
10. [Services & Utilities](#services--utilities)
11. [Calculation Engine](#calculation-engine)

---

## Overview

Hope Hub is a web-based Physical Education platform for students and teachers. It delivers structured PE curriculum through lectures, quizzes, physical fitness testing, health calculators, and workout videos. Teachers manage classes and track student progress; students consume content and record their fitness data.

---

## User Roles

| Role      | Access Level                                      | Registration                |
| --------- | ------------------------------------------------- | --------------------------- |
| `student` | Content consumption, self-tracking                | Register with class code    |
| `teacher` | Class management, student monitoring, data export | Register without class code |
| `admin`   | Defined in DB enum but no dedicated UI currently  | —                           |


---

## Route Map & File Mapping

### Layout Wrappers

| Wrapper | File | Wraps |
|---|---|---|
| `SidebarLayout` | `src/App.jsx` | All main app routes — renders Sidebar + Outlet |
| `LectureWrapper` | `src/App.jsx` | `/lectures/*` — provides `LectureProgressProvider` |
| `PhysicalFitnessWrapper` | `src/App.jsx` | `/physical-fitness-test/*` — provides `PhysicalFitnessDataProvider` |
| `ProfileWrapper` | `src/App.jsx` | `/dashboard` — resolves `StudentDashboard` or `TeacherDashboard` based on DB `user_type` |
| `AuthWrapper` | `src/App.jsx` | `/auth/*` — bare outlet, no sidebar |

---

### Full Route → File Mapping

| URL | Page Component | File |
|---|---|---|
| `/` | `Home` | `src/pages/Home.jsx` |
| `/home` | `Home` | `src/pages/Home.jsx` |
| `/about` | `About` | `src/pages/About.jsx` |
| `/health-calculators` | `HealthCalculator` | `src/pages/HealthCalculators/HealthCalculator.jsx` |
| `/health-calculators/bmi` | `BMICalculator` | `src/pages/HealthCalculators/BMICalculator.jsx` |
| `/health-calculators/bmr` | `BMRCalculator` | `src/pages/HealthCalculators/BMRCalculator.jsx` |
| `/health-calculators/ibw` | `IBWCalculator` | `src/pages/HealthCalculators/IBWCalculator.jsx` |
| `/health-calculators/waterintake` | `WaterIntakeCalculator` | `src/pages/HealthCalculators/WaterIntakeCalculator.jsx` |
| `/health-calculators/bodyfatpercentage` | `BodyFatPercentageCalculator` | `src/pages/HealthCalculators/BodyFatPercentageCalculator.jsx` |
| `/health-calculators/heartrate` | `HeartRateCalculator` | `src/pages/HealthCalculators/HeartRateCalculator.jsx` |
| `/lectures` | `LecturesIntroduction` | `src/pages/LecturesIntroduction.jsx` |
| `/lectures/lecture/:lessonNumber` | `LecturePage` | `src/pages/LecturePage.jsx` |
| `/workout-zone` | `WorkoutZone` | `src/pages/WorkoutZone.jsx` |
| `/workout-zone/:videoUrl` | `WorkoutZone` | `src/pages/WorkoutZone.jsx` |
| `/physical-fitness-test/parq` | `PhysicalActivityReadinessQuestionnaire` | `src/pages/PhysicalActivityReadinessQuestionnaire.jsx` |
| `/physical-fitness-test/test/:testIndex` | `PhysicalFitnessTestPage` | `src/pages/PhysicalFitnessTestPage.jsx` |
| `/physical-fitness-test/summary/:testType` | `PhysicalFitnessTestSummary` | `src/pages/PhysicalFitnessTestSummary.jsx` |
| `/quizzes` | `QuizDashboard` | `src/pages/QuizDashboard.jsx` |
| `/quizzes/quiz/:quizId` | `Quiz` | `src/pages/Quiz.jsx` |
| `/dashboard` | `StudentDashboard` or `TeacherDashboard` | `src/pages/Dashboard/StudentDashboard.jsx` / `TeacherDashboard.jsx` |
| `/dashboard/view-class/:classCode` | `ViewClass` | `src/pages/Dashboard/ViewClass.jsx` |
| `/auth/login` | `Login` | `src/pages/Auth/Login.jsx` |
| `/auth/register` | `Register` | `src/pages/Auth/Register.jsx` |
| `/auth/forgot-password` | `ForgotPassword` | `src/pages/Auth/ForgotPassword.jsx` |
| `/auth/change-password` | `ChangePassword` | `src/pages/Auth/ChangePassword.jsx` |
| `/auth/account-verification` | `AccountVerification` | `src/pages/Auth/AccountVerification.jsx` |
| `/*` | `NotFound` | `src/pages/NotFound.jsx` |

---

## Module Breakdown

---

### Auth Module

**Files:**
```
src/pages/Auth/Login.jsx
src/pages/Auth/Register.jsx
src/pages/Auth/ForgotPassword.jsx
src/pages/Auth/ChangePassword.jsx
src/pages/Auth/AccountVerification.jsx
src/components/auth/AuthContainer.jsx
src/components/auth/FormContainer.jsx
src/components/auth/FormHeading.jsx
src/components/auth/FormInput.jsx
src/components/auth/FormButton.jsx
src/components/auth/InputContainer.jsx
src/hooks/useRateLimiter.js
src/client/supabase.js
```

---

#### Login (`/auth/login`)

**User Actions:**
- Enter email + password
- Toggle "Remember Me" checkbox
- Click Login → `supabase.auth.signInWithPassword()`
- Click "Forgot Password?" → navigate `/auth/forgot-password`
- Click "Don't have an account?" → navigate `/auth/register`

**Logic:**
- Rate limited: 5s minimum interval, 7 max attempts
- On success: redirect to `/dashboard`
- "Remember Me" = `true` → Supabase persists session to `localStorage`
- "Remember Me" = `false` → session in `sessionStorage`
- `localStorage.setItem('rememberMe', true/false)` set before sign-in

**State:** `email`, `password`, `rememberMe`, `errorMessage`, `successMessage`, `isSubmitting`, `isDebounced`

---

#### Register (`/auth/register`)

**User Actions:**
- Enter name, email, password, confirm password
- Select user type: Student / Teacher (radio buttons)
- Check data privacy consent checkbox
- Click "Sign Up" → `supabase.auth.signUp()`
- Click "Already have an account?" → navigate `/auth/login`

**Logic:**
- Validates passwords match
- Validates all fields filled
- Validates consent checkbox checked
- Rate limited: 10s minimum interval, 7 max attempts
- Calls `supabase.auth.signUp()` with metadata: `{ fullName, userType, classCode, lectureProgress, password }`
- Supabase sends verification email with redirect to `/auth/account-verification`
- `lectureProgress` initial state generated from `LectureProgress()` utility and attached as metadata

**State:** `name`, `email`, `password`, `confirmPassword`, `userType`, `isDataPrivacyChecked`, `errorMessage`, `successMessage`, `isLoading`

---

#### Account Verification (`/auth/account-verification`)

**Triggered by:** User clicking email verification link

**Logic (auto-runs on mount):**
1. Extract `access_token` + `refresh_token` from URL hash
2. `supabase.auth.setSession({ access_token, refresh_token })`
3. `supabase.auth.getUser()` → get metadata
4. Check if profile already exists in `profile` table
5. If new user: call RPC `register_user(p_user_id, p_full_name, p_email, p_user_type, p_lecture_progress, p_class_code)`
6. If expired link: show "Verification Link Expired"
7. If already registered: show login link
8. `useRef` guard prevents double-registration on React StrictMode remount

**State:** `isBadRequest`, `isLoading`, `errorMessage`, `isExpiredLink`, `shouldShowLogin`, `shouldShowRegister`

---

#### Forgot Password (`/auth/forgot-password`)

**User Actions:**
- Enter email → click "Confirm"
- `supabase.auth.resetPasswordForEmail(email, { redirectTo: change-password-url })`

**Logic:** Rate limited. On success shows confirmation message.

---

#### Change Password (`/auth/change-password`)

**Triggered by:** Password reset email link

**Logic:**
1. Extract `access_token` + `refresh_token` from URL search params
2. `supabase.auth.setSession(tokens)` on mount
3. User enters new password + confirm
4. `supabase.auth.updateUser({ password })`
5. On success: countdown 3s → redirect to login

**State:** `password`, `confirmPassword`, `errorMessage`, `successMessage`, `isLoading`

---

### Home Module

**Files:**
```
src/pages/Home.jsx
src/components/Footer.jsx
```

**Actions:**
- Click "Start your Journey" → navigate `/dashboard`
- Watch embedded YouTube video (hardcoded ID: `IGxerNuSnoo`)
- Scroll hero section

**Logic:** Stateless page. No Supabase calls.

---

### Lectures Module

**Files:**
```
src/pages/LecturesIntroduction.jsx
src/pages/LecturePage.jsx
src/components/lectures/LectureIntroComponent.jsx
src/components/lectures/LecturePDF.jsx
src/components/lectures/LectureVideo.jsx
src/providers/LectureProvider.jsx
src/hooks/useLectureProgress.jsx
src/utilities/Lessons.js
src/utilities/LectureProgress.js
```

**Static Data (Lessons.js) — 3 lessons:**

| Key | Title |
|---|---|
| 1 | Personal Safety Protocol |
| 2 | Physiological Indicators |
| 3 | The FITT Principle |

Each lesson object: `{ key, title, introduction, pdf (URL), videoLecture (URL), quizLink, videoStatus }`

---

#### Lectures Introduction (`/lectures`)

**User Actions:**
- Filter by status: All / Done / Pending / Incomplete
- Click lecture card → navigate `/lectures/lecture/:key`

**Logic:**
1. Fetch `user_type` from `profile` — check if teacher
2. Fetch `lecture_progress` from `lecture_progress` table
3. Merge static `Lessons` array with DB progress
4. Apply active filter to `activeLessons`
5. Teachers: show simplified view with note (no filtering)
6. Students: show full view with filter buttons + status badges

**State:** `dataLoaded`, `activeLessons`, `activeFilter`, `storedProgress`, `isTeacher`

---

#### Lecture Page (`/lectures/lecture/:lessonNumber`)

**User Actions:**
- View PDF (rendered in browser via `LecturePDF` component)
- Timer runs during lecture viewing
- Timer ends / Finish button → `handleLectureFinish()`
- After lecture marked Done: quiz link becomes available

**Logic:**
1. Fetch `user_type` from `profile`
2. Fetch `lecture_progress` from `lecture_progress` table
3. On `handleLectureFinish`:
   - UPDATE `lecture_progress` with status `Done`
   - Check if `quiz_progress` row exists for this lecture's quiz
   - If not: INSERT into `quiz_progress` with `status = 'Pending'`
4. Before timer end: UPDATE status to `Pending`
5. Teachers: view-only mode, no progress saved

**State:** `isLectureDone`, `lectureProgress`, `dataLoaded`, `isLoading`, `isTeacher`

---

### Quiz Module

**Files:**
```
src/pages/QuizDashboard.jsx
src/pages/Quiz.jsx
src/components/quiz/Timer.jsx
src/components/quiz/CustomButton.jsx
src/components/quiz/AudioPlayer.jsx
src/providers/QuizProvider.jsx
src/providers/QuizContext.jsx
src/utilities/QuizData.js
src/utilities/Quizzes.js
src/utilities/utils.js
```

---

#### Quiz Dashboard (`/quizzes`)

**User Actions:**
- Filter: All / Done / Pending / Locked
- Click unlocked quiz card → navigate `/quizzes/quiz/:quizId`
- Locked cards: not clickable

**Logic:**
1. Get `user_type` from `profile`
2. If student: call `fetchQuizzes()` — returns quizzes with user's progress merged
3. If teacher: call `fetchQuizzesDefault()` — returns quizzes without progress, shows "Demo" status
4. Quiz unlock logic: Physical fitness test must be completed (pre + post) before final quiz unlocks
5. `extractQuizDetails()` enriches each quiz with rank, dates, score display

**Quiz Status Flow:** `Locked` → `Pending` (unlocked by PFT completion) → `Done`

**State:** `isLoading`, `quizzes`, `userType`, `activeFilter`

---

#### Quiz Page (`/quizzes/quiz/:quizId`)

**User Actions:**
- **Multiple Choice:** Click one of 4 colored answer buttons
- **Identification:** Type answer in input → click SUBMIT
- Timer auto-submits when time reaches 0
- View results + leaderboard after completion
- Review all questions with correct answers

**Logic (QuizProvider):**
1. `fetchQuizQuestions(quizId)`:
   - Check `quiz_progress.questions_shuffled` — resume if exists
   - If new: fetch from `quiz` table → `shuffleQuizQuestionsAndChoices()` → Fisher-Yates shuffle
   - Save shuffled questions + `start_time` to `quiz_progress`
2. `fetchQuizStateIfExists(quizId)`:
   - Load `questionIndex`, `score`, `points`, `remainingTime` from `quiz_progress`
   - Resume from saved state
3. On answer submit: `submitAnswer(quizState)`:
   - UPDATE `quiz_progress`: `question_index`, `score`, `points`, `remaining_time`, `questions_answered`
   - `calculatePoints(isCorrect, timeRemaining, totalTime)`:
     - Correct: base 1000 pts
     - Wrong: base 500 pts
     - Deduct by time used ratio
     - Minimum: 100 pts, rounded to nearest 100
4. On last question: `markQuizAsDone(quizState)`:
   - UPDATE `quiz_progress`: `status = 'Done'`, `total_items`, `date_taken`, `end_time`
5. `fetchLeaderboard(quizId)`:
   - SELECT top 5 by `points` from `quiz_progress` (status=Done)
   - JOIN with `profile` for names
   - Flag current user

**Contexts (from QuizContext.jsx):**
- `QuizContext` → `{ quizState, setQuizState }`
- `QuestionsContext` → questions array
- `RemainingTimeContext` → `useRef` for timer value
- `IdentificationRefContext` → `useRef` for identification answer input

**State (in QuizProvider):**
`isLoading`, `questions`, `quizState: { quizId, questionIndex, score, points, currentQuestionPoints, status, remainingTime, questionsAnswered }`

---

### Physical Fitness Test Module

**Files:**
```
src/pages/PhysicalActivityReadinessQuestionnaire.jsx
src/pages/PhysicalFitnessTestPage.jsx
src/pages/PhysicalFitnessTestSummary.jsx
src/components/physical-fitness-test/PhysicalFitnessTest.jsx
src/components/physical-fitness-test/ResultSection.jsx
src/components/physical-fitness-test/TipsAndInterperetation.jsx
src/providers/PhysicalFitnessDataProvider.jsx
src/hooks/usePhysicalFitnessData.jsx
src/utilities/PhysicalFitnessData.js
src/utilities/PhysicalFitnessTestList.js
```

**Tests (PhysicalFitnessTestList.js) — 12 tests (10 scored + 2 BMI measurements):**

| Index | Test | Unit |
|---|---|---|
| 0 | BMI Weight | kg |
| 1 | BMI Height | cm |
| 2 | Zipper Test (Right) | cm |
| 3 | Zipper Test (Left) | cm |
| 4 | Sit and Reach (1st) | cm |
| 5 | Sit and Reach (2nd) | cm |
| 6 | Pre 3-Minute Step Test (Resting HR) | bpm |
| 7 | 3-Minute Step Test (Recovery HR) | bpm |
| 8 | Push-Up | reps |
| 9 | Basic Plank | seconds |

---

#### PAR-Q (`/physical-fitness-test/parq`)

**User Actions:**
- Select Gender (Male/Female)
- Select Category (age group dropdown)
- Answer 7 yes/no health screening questions
- Click Submit

**Logic:**
1. Check `user_type` — if teacher: auto-complete PAR-Q, skip to test
2. Check `physical_fitness_test` table: if `pre_physical_fitness_test` is null → this is pre-test; else → post-test
3. Validate all 7 answers: Q1–Q6 must be No, Q7 (liability) must be Yes
4. If all pass: UPDATE `physical_fitness_test` with PAR-Q data + `{ gender, category, isPARQFinished: true }`
5. Navigate to first test: `/physical-fitness-test/test/0`
6. PAR-Q data stored in context (`PhysicalFitnessDataProvider`) + `localStorage`
**Missing:** Continue to previous progress when test in progress

**Questions:**
1. Heart condition?
2. Chest pain during activity?
3. Chest pain past month?
4. Bone/joint problem?
5. Blood pressure medication?
6. Other reason not to exercise?
7. Liability waiver agreement?

**State:** `physicalFitnessData` (context), `areAllAnswersNo`, `areAllAnswered`, `answers[7]`, `isError`, `isLoading`

---

#### Physical Fitness Test (`/physical-fitness-test/test/:testIndex`)

**User Actions:**
- Perform test, enter score
- Timer runs for timed tests (auto-submit on timeout)
- Advance through tests 0–9 sequentially

**Logic:**
1. Fetch `user_type` from `profile`
2. Load `physicalFitnessData` from `localStorage`
3. Check `quiz_progress` / `physical_fitness_test` DB — if `finishedTestIndex` includes current `testIndex` → show "already taken" error
**Questions:** Why does it check quiz_progress?
4. On test submit: save score to context + `localStorage` under test data
5. On last test (index 9): save full test to `physical_fitness_test` DB (pre or post based on existing data)
6. Teacher: full test access in demo mode

**State:** `physicalFitnessData`, `isBadRequest`, `isTimeout`, `isDataReady`, `isTaken`, `userType`, `testType`, `isLoading`, `teacherReady`

---

#### Physical Fitness Test Summary (`/physical-fitness-test/summary/:testType`)

**Routes:**
- `/physical-fitness-test/summary/pre-test`
- `/physical-fitness-test/summary/post-test`
- Teacher view: `?student={uuid}` query param

**User Actions:**
- View results table
- Teacher: view specific student's results via query param

**Logic:**
1. Validate `testType` param
2. If `?student=` present: validate student exists in `profile` table, load their data
3. Else: load current user's data
4. SELECT `pre_physical_fitness_test` or `post_physical_fitness_test` from `physical_fitness_test`
5. Format results into 4 sections: BMI, Cardiovascular Endurance, Strength, Flexibility
6. Calculate BMI category using `getBMI()` + `getBMICategory()` from `Calculations.js`

**State:** `testType`, `isDataReady`, `dataResults`, `isBadRequest`, `studentInfo`

---

### Health Calculators Module

**Files:**
```
src/pages/HealthCalculators/HealthCalculator.jsx
src/pages/HealthCalculators/BMICalculator.jsx
src/pages/HealthCalculators/BMRCalculator.jsx
src/pages/HealthCalculators/IBWCalculator.jsx
src/pages/HealthCalculators/BodyFatPercentageCalculator.jsx
src/pages/HealthCalculators/WaterIntakeCalculator.jsx
src/pages/HealthCalculators/HeartRateCalculator.jsx
src/pages/HealthCalculators/HealthCalculatorsWrapper.jsx
src/components/health-calculators/ (all components)
src/utilities/CalculatorData.js
src/services/Calculations.js
```

**No Supabase calls. All client-side computation.**

| Calculator | Route | Inputs | Output |
|---|---|---|---|
| BMI | `/bmi` | Height, Weight, units | BMI value + category |
| BMR | `/bmr` | Gender, Age, Height, Weight, Formula, Activity | BMR + daily calorie goals |
| IBW | `/ibw` | Gender, Height, unit | IBW by 4 formulas + healthy BMI range |
| Water Intake | `/waterintake` | Weight, Activity Level | Daily water intake (L) |
| Body Fat % | `/bodyfatpercentage` | Gender, Age, Height, Weight, Neck, Waist, Hips | Body fat % + fat/lean mass |
| Heart Rate | `/heartrate` | Age, Resting HR | 5 training intensity zones |

**Common UX Pattern:**
- Input fields with unit selectors (cm/ft/m, kg/lbs)
- "Calculate" button → compute + show results
- "Clear" button → reset all fields
- Mobile: auto-scroll to results after calculation
- Results include statistical + medical interpretation text (from `CalculatorData.js`)

---

### Workout Zone Module

**Files:**
```
src/pages/WorkoutZone.jsx
src/components/workout-zone/VideoHeading.jsx
src/components/workout-zone/VideoList.jsx
src/components/workout-zone/VideoPlayer.jsx
src/components/workout-zone/VideoPreview.jsx
src/utilities/WorkoutZoneVideos.js
src/components/Citations.jsx
```

**Static Data (WorkoutZoneVideos.js):**

| Category | Count |
|---|---|
| Warm Up | 1 |
| Upper Body | 7 |
| Lower Body | 5 |

**User Actions:**
- Browse videos by category
- Click video preview → URL updates to `/workout-zone/:videoUrl`, player updates
- Watch video in embedded player
- View exercise instructions (How To Do It, Do's, Don'ts)
- View references/citations

**Logic:**
1. On mount: check `videoUrl` param — if present, match to `WorkoutZoneVideos` and set `videoDetails`
2. On video click: `useNavigate()` updates URL → `useEffect` on `videoUrl` updates player
3. Scroll to top on video change via `parentContainerRef`
4. `VideoPlayer` renders only if `videoDetails` has content

**No Supabase calls. All static data.**

---

### Dashboard Module

**Files:**
```
src/pages/Dashboard/StudentDashboard.jsx
src/pages/Dashboard/TeacherDashboard.jsx
src/pages/Dashboard/ViewClass.jsx
src/components/dashboard/ (all)
src/hooks/useDashboardData.js
src/utilities/exportStudentExcel.js
src/utilities/exportStudentCSV.js
src/utilities/onProfileChange.js
src/services/getStudentDataByClassCode.js
src/services/cleanStudentData.js
```

---

#### Student Dashboard (`/dashboard` → student)

**User Actions:**
- View lecture progress stats (completed/incomplete/pending/total)
- View quiz progress stats
- View quiz scores table
- Join class (enter class code in modal)
- Leave class
- Navigate to pre-test / post-test summary
- Upload / change profile picture
- Logout (mobile only — sidebar handles desktop)

**Logic:**
1. `ProfileWrapper` checks `user_type` from `profile` table → routes here if `student`
2. Parallel data fetching on mount:
   - `getClassCode()` → SELECT from `student_class_code`
   - `getLectureProgress()` → SELECT from `lecture_progress`
   - `getQuizProgress()` → SELECT + COUNT from `quiz_progress` + `quiz`
   - `getQuizData()` → SELECT quiz scores from `quiz_progress`
   - Check `physical_fitness_test` for pre/post completion flags
3. Join class: validate class code against `teacher_class_code`, then UPDATE `student_class_code`
4. Leave class: UPDATE `student_class_code` SET `class_code = null`
5. Profile picture: `useProfilePicture()` → Supabase Storage download, `onProfileChange()` → Storage upload

**State:** `preTestFinished`, `postTestFinished`, `lectureProgress`, `quizProgress`, `classCode`, `quizData`, `isLoading`, `isJoiningClass`, `tempClassCode`

---

#### Teacher Dashboard (`/dashboard` → teacher)

**User Actions:**
- View all classes (class cards with name + color)
- Create new class (modal with Plus button)
- Delete class (removes from `teacher_class_code`)
- Click class card → navigate `/dashboard/view-class/:classCode`
- Upload / change profile picture
- Logout (mobile only)
**Question:** Why Logous is mobile only? verify
**Logic:**
1. Fetch all classes: SELECT `class_code`, `class_name`, `class_color` FROM `teacher_class_code` WHERE `uuid = userID`
2. Create class: INSERT into `teacher_class_code`
3. Delete class: DELETE FROM `teacher_class_code` WHERE `class_code = x AND uuid = userID`

**State:** `isDataReady`, `showAddClassModal`, `classCodes`, `isLoading`

---

#### View Class (`/dashboard/view-class/:classCode`)

**User Actions:**
- Filter data by type: All / Lecture / Quiz
- Sub-filter lectures: All / Done / Pending / Incomplete
- Sub-filter quizzes by score: Default / Low→High / High→Low
- Search students by name
- Export data as Excel (.xlsx)
- Click student → view details

**Logic:**
1. Ownership check: SELECT from `teacher_class_code` WHERE `uuid = userId AND class_code = classCode` — redirect 404 if not owner
2. `getStudentsByClassCode(classCode)` → RPC `retrieve_students_by_class`
3. `cleanStudentData(rawData)` → transforms:
   - Lecture statuses per lesson
   - Pre/post test completion flags
   - Quiz scores as `"{score}/{total_items}"`
   - Sorted alphabetically by name
4. Search: client-side filter on `studentName`
5. Sub-filters: client-side sort/filter on cleaned data array
6. Excel export: `generateStudentExcel()` → fetches detailed PFT data per student from `physical_fitness_test` → builds XLSX with styled headers
7. Column widths auto-sized, max 50

**Columns in Export:**
Name, Email, Lecture Progress, Quiz scores (per quiz), Pre-Test (BMI, Step, Push-Up, Plank, Zipper R/L, Sit&Reach 1/2), Post-Test (same)

**State:** `lecturesData`, `quizData`, `combinedData`, `activeFilter`, `lectureSubFilter`, `quizSubFilter`, `searchTerm`, `headings`, `hasOwnership`, `isExporting`, `isLoading`

---

### About Module

**File:** `src/pages/About.jsx`

**Content:** Static page. Organization info, contact details (email, Facebook, Instagram, contact person). No Supabase calls.

---

## Frontend–Backend Logic

### Authentication Flow

```
Register → supabase.auth.signUp() → email sent with tokens
         → user clicks link → /auth/account-verification
         → setSession(tokens) → getUser() → check profile table
         → rpc('register_user') creates: profile row + lecture_progress row
                                         + physical_fitness_test row
                                         + student_class_code OR teacher_class_code row
         → redirect to /dashboard

Login → supabase.auth.signInWithPassword() → session stored (localStorage or sessionStorage)
      → redirect to /dashboard → ProfileWrapper checks user_type → route to correct dashboard

Logout → supabase.auth.signOut() → clear session
```

### Lecture Progress Flow

```
/lectures → fetch lecture_progress from DB → merge with static Lessons[]
          → show status badge per lesson

/lectures/lecture/:n → fetch lecture_progress → display PDF
                     → timer runs → on finish: UPDATE lecture_progress status = 'Done'
                     → check quiz_progress: if no row → INSERT quiz_progress status='Pending'
```

### Quiz Flow

```
/quizzes → fetchQuizzes():
  student → check PFT completion → unlock quizzes accordingly
          → merge quiz table with quiz_progress
  teacher → fetchQuizzesDefault() — no progress

/quizzes/quiz/:id → QuizProvider:
  1. Load saved questions_shuffled from quiz_progress (resume)
     OR fetch from quiz table → Fisher-Yates shuffle → save to quiz_progress
  2. Load saved state (questionIndex, score, remainingTime) from quiz_progress
  3. Per answer → submitAnswer() → UPDATE quiz_progress
  4. calculatePoints(correct, timeRemaining, totalTime)
  5. Last question → markQuizAsDone() → UPDATE quiz_progress status='Done'
  6. Fetch leaderboard top 5 by points
```

### Physical Fitness Test Flow

```
/physical-fitness-test/parq
  → check physical_fitness_test table:
     pre_physical_fitness_test = null? → PRE TEST
     pre_physical_fitness_test exists? → POST TEST
  → validate PAR-Q answers (Q1-6: No, Q7: Yes)
  → UPDATE physical_fitness_test with PAR-Q + gender + category
  → save to context + localStorage
  → navigate to /physical-fitness-test/test/0

/physical-fitness-test/test/:index
  → load physicalFitnessData from localStorage
  → check finishedTestIndex — guard against re-taking
  → on submit: save score to context + localStorage
  → navigate to next test index
  → on last test: save full data to physical_fitness_test DB (pre or post column)
  → navigate to /physical-fitness-test/summary/:testType

/physical-fitness-test/summary/:testType
  → SELECT physical_fitness_test for current user (or ?student= for teacher)
  → format and display results
```

### Dashboard Data Flow

```
StudentDashboard → parallel fetches:
  - student_class_code → classCode
  - lecture_progress → progress object
  - quiz_progress + quiz → quiz progress counts + scores
  - physical_fitness_test → pre/post completion booleans
  - Supabase Storage → profile picture blob

TeacherDashboard → teacher_class_code → list of classes

ViewClass:
  → check teacher ownership (teacher_class_code)
  → rpc('retrieve_students_by_class') → raw student data
  → cleanStudentData() → transform to display format
  → Export: generateStudentExcel() → per-student PFT fetch → build XLSX
```

---

## Supabase Integration Map

### Database Operations

| Table | Operation | Columns | Trigger |
|---|---|---|---|
| `profile` | SELECT | `user_type` | Auth check (many pages) |
| `profile` | SELECT | `full_name` | Dashboard name display |
| `profile` | SELECT | `full_name`, `email` | Teacher viewing student summary |
| `profile` | SELECT | `uuid` | Teacher ownership validation |
| `lecture_progress` | SELECT | `lecture_progress` | Lectures intro + lecture page |
| `lecture_progress` | UPDATE | `lecture_progress` | Lecture finish / timer end |
| `quiz` | SELECT | `id`, `title`, `lecture_title`, `description`, `questions` | Quiz dashboard + quiz page |
| `quiz_progress` | SELECT | all | Quiz page state resume + leaderboard |
| `quiz_progress` | INSERT | `user_id`, `quiz_id`, `status='Pending'` | Lecture finish (unlocks quiz) |
| `quiz_progress` | UPDATE | `question_index`, `score`, `points`, `remaining_time`, `questions_answered`, `questions_shuffled`, `start_time` | Per-answer submit |
| `quiz_progress` | UPDATE | `status='Done'`, `total_items`, `date_taken`, `end_time` | Quiz completion |
| `physical_fitness_test` | SELECT | `pre_physical_fitness_test`, `post_physical_fitness_test` | PAR-Q, PFT page, summary |
| `physical_fitness_test` | UPDATE | `pre_physical_fitness_test` or `post_physical_fitness_test` | PAR-Q submit + PFT completion |
| `student_class_code` | SELECT | `class_code` | Student dashboard |
| `student_class_code` | UPDATE | `class_code` | Join/leave class |
| `teacher_class_code` | SELECT | `class_code`, `class_name`, `class_color` | Teacher dashboard |
| `teacher_class_code` | INSERT | new class | Create class |
| `teacher_class_code` | DELETE | by class_code + uuid | Delete class |
| `teacher_class_code` | SELECT | count | Validate class code when joining |

### RPC Functions

| Function | Called From | Purpose |
|---|---|---|
| `register_user(p_user_id, p_full_name, p_email, p_user_type, p_lecture_progress, p_class_code)` | `AccountVerification.jsx` | Create all profile rows in single transaction |
| `retrieve_students_by_class(class_code_input)` | `getStudentDataByClassCode.js` | Fetch all student data (profile + progress + quiz + PFT) in single RPC |

### Auth Operations

| Method | Where | Purpose |
|---|---|---|
| `auth.signUp()` | Register | Create account + send verification email |
| `auth.signInWithPassword()` | Login | Authenticate |
| `auth.signOut()` | Dashboard / AccountVerification | Logout |
| `auth.getSession()` | `useUserId.jsx` | Get current user ID |
| `auth.getUser()` | AccountVerification, QuizData | Get user object + metadata |
| `auth.setSession()` | AccountVerification, ChangePassword | Restore session from tokens |
| `auth.resetPasswordForEmail()` | ForgotPassword | Send reset email |
| `auth.updateUser()` | ChangePassword | Set new password |

---

## Storage Layer

### Supabase Storage

| Bucket | Path | Operations | Used By |
|---|---|---|---|
| `profile-pictures` | `{userID}/profilePicture` | LIST, DOWNLOAD | `useDashboardData.js` → `useProfilePicture()` |
| `profile-pictures` | `{userID}/profilePicture` | DELETE, UPLOAD (upsert) | `onProfileChange.js` |

### localStorage

| Key | Type | Value | Set By | Cleared By |
|---|---|---|---|---|
| `rememberMe` | string `'true'/'false'` | Remember login preference | `Login.jsx` | Never auto-cleared |
| `physicalFitnessData` | JSON | `{ gender, category, isPARQFinished, finishedTestIndex[], ...scores }` | PAR-Q + test pages | After test completion |
| `*Timer*RemainingTime` | number | Timer countdown value | `LecturePDF`, `Quiz` timer | `clearAllTimerData()` on logout |
| `*Timer*IsRunning` | boolean | Timer state | Timer components | `clearAllTimerData()` on logout |
| Supabase auth tokens | JWT | Session tokens | Supabase client | `auth.signOut()` |

### sessionStorage

| Key | Value | When Used |
|---|---|---|
| Supabase auth tokens | JWT | When "Remember Me" = false |

---

## Caching Strategy

**No server-side or query-level cache. All fetches are live.**

| Layer | Mechanism | Data Cached | Scope |
|---|---|---|---|
| React Context | `PhysicalFitnessDataProvider` | PFT form data | Lifetime of `/physical-fitness-test/*` routes |
| React Context | `LectureProgressProvider` | Lecture progress state | Lifetime of `/lectures/*` routes |
| React Context | `QuizProvider` | Questions + quiz state | Lifetime of quiz page |
| localStorage | Timer keys | Timer countdown state | Persists across refresh |
| localStorage | `physicalFitnessData` | PFT form data backup | Cleared after test completion |
| In-memory (state) | `StudentDashboard` | Fetched progress data | Component lifetime |
| In-memory (state) | `ViewClass` | Student table data | Component lifetime |

**No memoized queries, no SWR/React Query, no service worker caching.**

---

## State Management

### Global State (Context Providers)

| Provider | File | Provides | Scope |
|---|---|---|---|
| `PhysicalFitnessDataProvider` | `src/providers/PhysicalFitnessDataProvider.jsx` | `{ physicalFitnessData, setPhysicalFitnessData }` | `/physical-fitness-test/*` |
| `LectureProgressProvider` | `src/providers/LectureProvider.jsx` | `{ lectureProgress, setLectureProgress }` | `/lectures/*` |
| `QuizProvider` | `src/providers/QuizProvider.jsx` | `QuizContext`, `QuestionsContext`, `RemainingTimeContext`, `IdentificationRefContext` | Quiz page |

### Local State (per page)

Each page manages its own state with `useState` — see individual module sections above.

### Refs (not re-render state)

| Ref | Where | Purpose |
|---|---|---|
| `identificationAnswerRef` | `QuizProvider` | Identification question text input value |
| `remainingTimeRef` | `QuizProvider` | Timer countdown (synced to DB on each answer) |
| `containerRef` | `SidebarLayout`, `WorkoutZone` | Scroll position tracking |
| `userRegistered` | `AccountVerification` | Guard against double-registration |

---

## Services & Utilities

### Services (`src/services/`)

| File | Function | Purpose |
|---|---|---|
| `Calculations.js` | Multiple | Health metric calculations (BMI, BMR, IBW, etc.) |
| `cleanStudentData.js` | `cleanStudentData(students)` | Transform raw RPC data → display/export format |
| `getStudentDataByClassCode.js` | `getStudentsByClassCode(classCode)` | Call RPC `retrieve_students_by_class` |

### Utilities (`src/utilities/`)

| File | Exports | Purpose |
|---|---|---|
| `Lessons.js` | `Lessons[]` | Static lesson definitions (3 lessons) |
| `LectureProgress.js` | `LectureProgress()` | Generate initial progress state array |
| `QuizData.js` | 8+ async functions | All quiz DB logic (fetch, submit, mark done, leaderboard) |
| `Quizzes.js` | `Quizzes()` | Fetch quiz numbers from DB |
| `PhysicalFitnessData.js` | `PhysicalFitnessData`, `numberOfTests` | Initial PFT state object |
| `PhysicalFitnessTestList.js` | `PhysicalFitnessTestList[]` | All 12 test definitions with instructions + classifications |
| `WorkoutZoneVideos.js` | `WarmUpVideo`, `UpperBodyVideos`, `LowerBodyVideos`, `References` | Static video library |
| `CalculatorData.js` | `CalculatorData`, `highlightedData` | Calculator descriptions + interpretations |
| `utils.js` | `shuffleArray()`, `calculatePoints()` | Quiz utility functions |
| `getDataFromStorage.js` | `getDataFromStorage(key)` | Parse JSON from localStorage |
| `setDataToStorage.js` | `setDataToStorage(key, value)` | Stringify + save to localStorage |
| `removeFromStorage.js` | `removeFromStorage(key)` | Remove key from localStorage |
| `clearTimerData.js` | `clearAllTimerData()` | Clear all `*Timer*` keys from localStorage |
| `onProfileChange.js` | `onProfileChange(userID, file)` | Delete + re-upload profile picture to Storage |
| `exportStudentExcel.js` | `generateStudentExcel()`, `downloadExcel()`, `generateFilename()` | Build + download XLSX export |
| `exportStudentCSV.js` | `generateStudentCSV()`, `downloadCSV()`, `generateFilename()` | Build + download CSV export |
| `LectureProgress.js` | `LectureProgress()` | Generate initial lecture progress array |

### Hooks (`src/hooks/`)

| Hook | Returns | Purpose |
|---|---|---|
| `useUserId()` | `userId` (string\|null) | Get current Supabase auth user ID. Redirects to login if no session |
| `useRateLimiter({ maxAttempts, cooldownMs, minIntervalMs })` | `isRateLimited()` fn | Throttle form submissions. Returns `false` (ok), `{ type: 'too-fast' }`, or `{ type: 'exceeded' }` |
| `useDashboardData.js → useName(userID)` | `studentName` | SELECT `full_name` from `profile` |
| `useDashboardData.js → useProfilePicture(userID)` | `[file, setFile]` | LIST + DOWNLOAD profile picture from Storage |
| `useLectureProgress()` | `{ lectureProgress, setLectureProgress }` | Access lecture context |
| `usePhysicalFitnessData()` | `{ physicalFitnessData, setPhysicalFitnessData }` | Access PFT context |
| `useFetch(url)` | `{ data, loading, error }` | Generic HTTP fetch |
| `useMobile(breakpoint)` | `isMobile` boolean | Detect mobile (width + user agent + touch) |

---

## Calculation Engine

All in `src/services/Calculations.js`. Client-side only, no network calls.

| Function | Formula | Returns |
|---|---|---|
| `getBMI(h, w, hUnit, wUnit)` | `w(kg) / h(m)²` | BMI float |
| `getBMR(gender, age, h, w, formula, bodyFat, ...)` | Mifflin / Harris-Benedict / Katch-McArdle | `{ BMR, DailyCalories: { [activityLevel]: cals } }` |
| `getTDEE(gender, age, h, w, activity, ...)` | BMR × activity multiplier | `{ TDEE, DailyCalories }` |
| `getIBW(h, hUnit, gender)` | Robinson / Miller / Devine / Hamwi | `{ IBW: { Robinson, Miller, Devine, Hamwi }, HealthyBMIRange }` |
| `getWaterIntake(w, activity, wUnit)` | `w(kg) × 0.033 + activityBonus` | liters (float) |
| `getBodyFatPercentage(age, gender, h, w, neck, waist, hips, ...)` | U.S. Navy method | `{ results: { BodyFat%, FatMass, LeanMass, IdealBF%, ... } }` |
| `getHeartRate(age, restingHR)` | Karvonen / HRR zones | Array of 5 zones with min/max BPM |
| `getCalorieGoals(bmr, activityLevel)` | BMR × multiplier ± deficit/surplus | `{ weightLoss, weightGain }` with multiple targets |

**Unit Conversions (internal helpers):** lbs↔kg, ft↔m, cm↔m, cm↔ft, cm↔in, m↔in, ft↔in, in↔m

---

*End of PRD*
