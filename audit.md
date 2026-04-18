# Hope-Hub Codebase Audit Report
**Date**: April 13, 2026 | **Auditor**: Claude Sonnet 4.6 | **Grade**: 46/100

---

## Methodology

Every file in `src/` was read. ESLint was run (`npm run lint`). Each finding is mapped directly to an entry in `experiences.md` and verified in code — no label-dropping.

**Stack**: React 19, Vite, Supabase, Tailwind CSS, React Router 7
**Size**: ~5,800 lines across 90+ source files
**ESLint**: 56 errors, 20 warnings

---

## experiences.md Checklist Results

| #                                                                 | Rule       | Status                                                                                                                                                                             | Evidence                |
| ----------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Payment Mechanisms Must Be Idempotent                             | N/A        | —                                                                                                                                                                                  | No payments in this app |
| No God Classes / God Components                                   | ❌ FAIL     | StudentDashboard (7 responsibilities), ViewClass (6 responsibilities), QuizData.js (auth + fetching + state + leaderboard)                                                         |                         |
| Don't Repeat Yourself (DRY)                                       | ❌ FAIL     | `exportStudentCSV.js` is 180-line near-duplicate of `exportStudentExcel.js`, never imported anywhere                                                                               |                         |
| No Sensitive Data in Logs                                         | ❌ FAIL     | `ViewClass.jsx:151` logs all student PII to console; `useRateLimiter.js:22` logs auth timing                                                                                       |                         |
| Always Add Confirmation for Destructive Actions                   | ❌ FAIL     | `handleRemoveClass` (TeacherDashboard) and `handleLeaveClass` (StudentDashboard) — no confirmation                                                                                 |                         |
| Component Architecture Standards                                  | ⚠️ PARTIAL | No prop drilling past 3 levels ✅; state not colocated with hooks ❌; no Zustand/context for shared auth state ❌                                                                     |                         |
| Don't Share Mutation Pending State Across a List                  | ✅ PASS     | `Table.jsx` correctly tracks `exportingStudent === item.uuid` per item                                                                                                             |                         |
| Don't Use Magic Pixel Numbers for Positioning                     | ✅ PASS     | None found                                                                                                                                                                         |                         |
| Guard Against Auth Hydration Flashes                              | ⚠️ PARTIAL | `preTestFinished: false` and `postTestFinished: false` defaults could flash disabled state, but the `!userID` loading guard prevents rendering before auth resolves in most places |                         |
| Never Expose Raw Exception Messages to Clients                    | ❌ FAIL     | Login, ChangePassword, AccountVerification, PAR-Q all pass `error.message` directly to UI                                                                                          |                         |
| Always Log Full Exception Objects                                 | ❌ FAIL     | 9 empty catch/error blocks; errors discarded with no logging anywhere                                                                                                              |                         |
| Never Concatenate User Input into Raw SQL                         | ✅ PASS     | Supabase parameterized queries used throughout                                                                                                                                     |                         |
| Set Timeouts on All External HTTP Calls                           | ❌ FAIL     | `useFetch.jsx` has no AbortController or timeout                                                                                                                                   |                         |
| Never Comment Out Authorization Checks                            | ✅ PASS     | None found                                                                                                                                                                         |                         |
| Don't Store PII in Client-Side Storage Keys                       | ❌ FAIL     | `Register.jsx:111` stores plaintext password in Supabase auth metadata                                                                                                             |                         |
| Every Mutation Must Scope by Tenant ID                            | ✅ PASS     | All mutations use `.eq('uuid', userID)` or `.eq('user_id', user.id)`                                                                                                               |                         |
| Whitelist Sort Columns to Prevent SQL Injection                   | ✅ PASS     | Sorting done client-side in JS — no raw SQL column names                                                                                                                           |                         |
| Services Should Not Call Auth — Accept Dependencies as Parameters | ❌ FAIL     | `getCurrentUser()` called inside 8 service functions in `QuizData.js`                                                                                                              |                         |
| Replace N+1 Queries in Loops with Batch Queries                   | ❌ FAIL     | `getUserRanking(quiz.id)` called per-quiz inside async map in `extractQuizDetails`                                                                                                 |                         |
| Always Include Diagnostic Context in Log Calls                    | ❌ FAIL     | `if (error) { return; }` — no userId, no action, no error object logged                                                                                                            |                         |

---

## 🔴 CRITICAL (−22 pts)

### 1. Password Stored in Auth Metadata
**File**: `src/pages/Auth/Register.jsx:111`
**exp ref**: *Don't Store PII in Client-Side Storage Keys*

```js
options: {
  data: {
    fullName: trimmedName,
    userType: userType,
    password: trimmedPassword,   // ❌ plaintext password in metadata
  },
}
```
Supabase stores `user_metadata` in `auth.users`, visible from admin queries, audit logs, and exports. The plaintext password lives next to the hashed one.

**Fix**: Delete that line.

---

### 2. Runtime Crash — Error Checked After `data.map()`
**File**: `src/utilities/QuizData.js:430-441`
**exp ref**: *Always Log Full Exception Objects* (guard before using data)

```js
const leaderboard = data.map((user, index) => {  // ❌ crashes if data is null
  return { rank: index + 1, name: user.profile.full_name, ... };
});

if (error) {   // checked too late — data may already be null
  return;
}
```
When the Supabase call fails, `data` is `null` and `data.map()` throws. The error guard is four lines too late.

**Fix**: `if (error || !data) return [];` before touching `data`.

---

### 3. Wrong Logout Pattern — navigate() Fires Immediately
**File**: `src/pages/Dashboard/StudentDashboard.jsx:301`

```js
supabase.auth.signOut().then(navigate('/auth/login'));
//                           ^^^^^^^^^^^^^^^^^^^^^^
// navigate() is CALLED here, not passed as a callback.
// Its return value (undefined) becomes the .then() handler.
```
The user is redirected before `signOut()` resolves. `localStorage.removeItem` calls on lines 302–303 then run after the route has already changed.

**Fix**: `await supabase.auth.signOut(); navigate('/auth/login');`

---

### 4. Raw Error Messages Exposed to Users
**Files**: `Login.jsx:68`, `ChangePassword.jsx:65`, `AccountVerification.jsx:93`, `PhysicalActivityReadinessQuestionnaire.jsx:42`
**exp ref**: *Never Expose Raw Exception Messages to Clients*

```js
setErrorMessage(error.message);                      // Login
setErrorMessage('Error setting session: ' + sessionError.message); // AccountVerification
setErrorMessage('Error saving test data: ' + updateError.message); // PAR-Q
```
Supabase errors expose internal details (table names, constraint names, auth token state). The experiences entry is explicit: log the full error internally, return a generic message to the user.

**Fix**: Map to friendly strings. Log `console.error` with `{ userId, action, error }` context internally.

---

### 5. No Confirmation on Destructive Actions
**Files**: `TeacherDashboard.jsx:71`, `StudentDashboard.jsx:257`
**exp ref**: *Always Add Confirmation for Destructive Actions*

```js
// TeacherDashboard — deletes class permanently, one click
const handleRemoveClass = async classCode => {
  await supabase.from('teacher_class_code').delete().eq('class_code', classCode).eq('uuid', userID);
};

// StudentDashboard — leaves class, losing progress linkage, one click
const handleLeaveClass = async () => {
  await supabase.from('student_class_code').update({ class_code: null }).eq('uuid', userID);
};
```
The experiences entry explicitly shows the two-click inline pattern (`confirming` state) for exactly this scenario. At minimum: `window.confirm()` is noted as acceptable for internal tools.

**Fix**: Add `const [confirming, setConfirming] = useState(false)` inline two-click pattern for each.

---

### 6. Student PII Logged to Console
**File**: `src/pages/Dashboard/ViewClass.jsx:151`
**exp ref**: *No Sensitive Data in Logs*

```js
console.log('all student data:', allStudentData);
```
`allStudentData` contains every student's full name, email, quiz scores, and fitness test records. The experiences entry is explicit: **never** log emails, names, or any PII. This was left from debugging.

**Fix**: Delete the line.

---

### 7. Systematic Silent Error Handling
**Files**: `QuizData.js:219,245,262`, `onProfileChange.js:22-24`, `TeacherDashboard.jsx:91`, `ViewClass.jsx:126`, and others
**exp ref**: *Always Log Full Exception Objects*

```js
if (error) { }          // QuizData.js — three instances
} catch (err) {}        // TeacherDashboard
if (error) { return; }  // Throughout — no logging, no user feedback
```
The experiences entry says: pass the full exception object to the logger. Here errors are entirely discarded — no stack trace, no context, no signal.

**Fix**: At minimum `console.error('getQuestionsFromQuizProgressIfExists failed', { quizId, error })`. Show user feedback on recoverable failures.

---

## ⚠️ MAJOR (−16 pts)

### 8. Services Call `getCurrentUser()` Internally
**File**: `src/utilities/QuizData.js` — 8 service functions
**exp ref**: *Services Should Not Call Auth — Accept Dependencies as Parameters*

```js
async function submitAnswer(quizState) {
  const user = await getCurrentUser();   // ← Supabase roundtrip
  const userData = await supabase.from('profile').select('user_type')... // ← another
}
async function markQuizAsDone(quizState) {
  const user = await getCurrentUser();   // ← again
}
// ... repeated in fetchQuizQuestions, extractQuizState, updateRemainingTime, etc.
```
Every quiz action independently re-authenticates and re-fetches `user_type`. Over a full quiz session this generates 10+ redundant roundtrips to Supabase.

**Fix**: Resolve `user` and `userType` once at the call site, pass as parameters.

---

### 9. N+1 Query Pattern in `extractQuizDetails`
**File**: `src/utilities/QuizData.js:128`
**exp ref**: *Replace N+1 Queries in Loops with Batch Queries*

```js
quizData.map(async (quiz, index) => {
  quiz.details = {
    Ranking: await getUserRanking(quiz.id),  // one Supabase call per quiz
  };
});
```
Also: `.map()` return is discarded, async promises are never awaited, and quiz objects from the database are mutated in place. Three bugs in one function.

**Fix**: Batch-fetch all rankings in one query keyed by `quiz_id`, then look up. Use `Promise.all()`. Return new objects instead of mutating.

---

### 10. Missing HTTP Timeout on `useFetch`
**File**: `src/hooks/useFetch.jsx`
**exp ref**: *Set Timeouts on All External HTTP Calls*

```js
const response = await fetch(url);   // no AbortController, no timeout
```
Hangs indefinitely if the YouTube API is slow or unreachable. `WorkoutZone.jsx` uses this hook.

**Fix**: `const controller = new AbortController(); setTimeout(() => controller.abort(), 15000);`

---

### 11. Debug Log Left in Rate Limiter
**File**: `src/hooks/useRateLimiter.js:22`
**exp ref**: *No Sensitive Data in Logs* (timing data is operational metadata that should not be public)

```js
console.log(now, lastAttemptTime.current);   // fires on every login attempt
```
Leaks auth timing to the browser console on every submission. Should have been caught in PR review per the experiences entry.

**Fix**: Remove.

---

### 12. `getCurrentUser()` called inside loop compounds N+1
**File**: `src/utilities/QuizData.js:387-408`
**exp ref**: *Services Should Not Call Auth — Accept Dependencies as Parameters*

`getUserRanking()` itself calls `getCurrentUser()` internally, then fetches all quiz scores, then filters by `user.id`. This function is called once per quiz inside `extractQuizDetails`. Two Supabase calls per quiz just for ranking.

---

### 13. Missing React Hook Dependencies
**Files**: `StudentDashboard.jsx` (5 effects), `Timer.jsx:118` (7 missing deps), `ChangePassword.jsx:29`, `WorkoutZone.jsx:39`
**exp ref**: *Component Architecture Standards* — hooks should be correct

```js
// StudentDashboard — all four data-fetching effects missing their function dependencies
useEffect(() => { getClassCode(); }, [userID]);       // getClassCode missing
useEffect(() => { getLectureProgress(); }, [userID]); // getLectureProgress missing
useEffect(() => { getQuizProgress(); }, [userID]);    // getQuizProgress missing
useEffect(() => { getQuizData(); }, [userID, quizCount]); // getQuizData missing
```
Stale closures. If the function references any state that changes, the effect uses the old version.

---

## 🟡 MODERATE (−10 pts)

### 14. God Components
**Files**: `StudentDashboard.jsx` (388 lines, 7 responsibilities), `ViewClass.jsx` (471 lines, 6 responsibilities), `QuizData.js` (459 lines, 5 responsibilities)
**exp ref**: *No God Classes / God Components*

The experience entry's smell tests — specifically "multiple unrelated responsibilities" and "you need to understand unrelated concepts to modify one part" — both apply here. The LOC note from the entry is correctly applied: line count alone isn't the issue.

- `StudentDashboard` handles: quiz progress, lecture progress, class code, pre/post test status, profile picture, logout, and join class — 7 distinct concerns
- `ViewClass` handles: ownership verification, student fetching, filter logic, sort logic, search, and export — 6 distinct concerns
- `QuizData.js` handles: auth, user-type checks, quiz fetching, state extraction, answer submission, leaderboard, and ranking — should be split into separate service modules

**Fix per entry**: Extract each concern. `useStudentProgress()`, `useClassCode()` as custom hooks. `LeaderboardService`, `QuizStateService` as separate modules.

---

### 15. `exportStudentCSV.js` — Dead Duplicate File
**File**: `src/utilities/exportStudentCSV.js`
**exp ref**: *Don't Repeat Yourself (DRY)*

`exportStudentCSV.js` is ~180 lines, nearly identical to `exportStudentExcel.js`, and is **never imported anywhere in the codebase**. It's dead code that duplicates the entire export logic. The DRY entry says: once you have the same logic in 2+ places, refactor into one source of truth.

**Fix**: Delete `exportStudentCSV.js` or extract shared logic into one utility both formats call.

---

### 16. Dead Code — Self-Referential Comparison Always False
**File**: `src/pages/Auth/AccountVerification.jsx:134-145`

```js
const userId = user.id;       // line 134
if (user.id !== userId) {     // line 137 — always false
  setIsBadRequest(true);      // unreachable
}
```
This guard never fires. The branch and its localStorage cleanup are dead.

---

### 17. Filter Logic Hardcodes Only 3 of 10 Lessons
**File**: `src/pages/Dashboard/ViewClass.jsx:170-193`

```js
// "Done" filter checks only Lesson1, Lesson2, Lesson3
student.Lesson1 === 'Done' && student.Lesson2 === 'Done' && student.Lesson3 === 'Done'
```
`StudentDashboard.jsx:24` shows `total: 10` — 10 lessons exist. A student who completed all 10 lessons but has Lesson3 as Pending does not appear in the "Done" filter. The filter is functionally wrong.

**Fix**: Derive lesson keys dynamically: `Object.keys(student).filter(k => k.startsWith('Lesson')).every(k => student[k] === 'Done')`.

---

### 18. Duplicate Route Definition
**File**: `src/App.jsx:217-233`

```jsx
<Route path="health-calculators" element={<HealthCalculator />} />
<Route path="health-calculators" element={<HealthCalculatorWrapper />}>   {/* same path */}
  <Route path="bmi" element={<BMICalculator />} />
  ...
```
React Router matches the first `health-calculators` route, making all nested calculator sub-routes (`/health-calculators/bmi`, etc.) unreachable from direct navigation.

---

### 19. Component Architecture — State Not Colocated with Hooks
**Files**: `StudentDashboard.jsx`, `TeacherDashboard.jsx`
**exp ref**: *Component Architecture Standards — Rule 2: State + hook colocated with the component*

```js
// Both dashboards destructure setProfilePictureFile but never call it
const [profilePictureFile, setProfilePictureFile] = useProfilePicture(userID);
//                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// ESLint: assigned but never used
```
The hook returns a setter the component ignores. The profile picture can never be updated through component state — the upload in `onProfileChange.js` writes directly to storage with no state update feedback. The experience entry says the state hook should be owned by the component that uses it.

---

### 20. Hardcoded Production URL
**File**: `src/pages/Auth/Register.jsx:105`

```js
emailRedirectTo: 'https://hope-hub-fitness.vercel.app/auth/account-verification',
```
Verification emails redirect to production even when running locally. Dev-environment email signups cannot be verified on localhost.

**Fix**: `import.meta.env.VITE_APP_URL + '/auth/account-verification'`

---

## 🔵 MINOR (−6 pts)

### 21. Personal Email in Source Code
**File**: `src/services/cleanStudentData.js:2`

```js
email: 'charles3939togle@gmail.com',   // real personal email in sample data
```
Unused sample data (`sampleData` is never exported or referenced), but commits a real personal email to source. Will persist in git history.

**Fix**: Use `test@example.com` or delete the entire `sampleData` block.

---

### 22. Wrong Hook Name in Error Message
**File**: `src/hooks/useLectureProgress.jsx:10`

```js
throw new Error('usePhysicalFitnessData must be used within a provider');
//              ^^^^^^^^^^^^^^^^^^^^^ wrong — this is useLectureProgress
```

---

### 23. Mixed Import Aliases in Same Files
**Files**: `Register.jsx`, `AccountVerification.jsx`, `ChangePassword.jsx`

```js
import FormHeading from '@/components/auth/FormHeading';      // alias
import InputContainer from '../../components/auth/InputContainer'; // relative
```
Both styles in the same file. Pick one.

---

### 24. 56 ESLint Errors Not Resolved
Selected errors beyond issues already listed:
- `Sidebar.jsx:108` — `setShouldRender` used but never defined (`no-undef`) — runtime crash
- `TableHeadings.jsx:1` — `i` not defined (`no-undef`) — runtime crash
- `Calculations.js:235` — `formulaVariant` not defined (`no-undef`)
- `Calculations.js:448` — unreachable code after `return`
- `QuizDashboard.jsx:20` — `userId` assigned, never used
- `motion` imported but unused in 5+ files

---

### 25. Hardcoded Lesson and Quiz Counts
**File**: `StudentDashboard.jsx:24,30`

```js
total: 10,   // lecture count — breaks if lessons added
total: 2,    // quiz count — breaks if quizzes added
```
These will silently miscount when content changes.

---

## ✅ PASSES (from experiences.md checklist) (+14 pts)

| Rule | Evidence |
|------|----------|
| Never Concatenate User Input into Raw SQL | Supabase parameterized queries throughout |
| Every Mutation Must Scope by Tenant ID | `.eq('uuid', userID)` on every write |
| Whitelist Sort Columns | Sort done client-side in JS, no raw SQL |
| Don't Share Mutation Pending State Across a List | `Table.jsx` uses `exportingStudent === item.uuid` correctly |
| Don't Use Magic Pixel Numbers | None found |
| Never Comment Out Authorization Checks | None found |
| Rate limiting on auth | `useRateLimiter` on both login and register |
| Credentials gitignored | `.env` in `.gitignore`, fresh repo, never committed |
| Supabase RPC for complex queries | `retrieve_students_by_class` keeps schema private |
| Input sanitisation | `.trim()` + password match validation in all auth forms |
| Data privacy consent | Required checkbox before registration |
| Ownership check before class data | `checkClassOwnership()` in ViewClass — **CLIENT-SIDE ONLY, see TODO below** |
| Loading states used consistently | `<Loading />` throughout |
| Error boundary components | `<ErrorMessage />` for 404/400 states |

---

## 🔴 TODO: Multi-Tenancy Deep Review (ADDED 2026-04-15)

These were NOT in the original audit. Discovered on second pass.

### MT-1. Ownership Check is Client-Side Only — RPC Has No Tenant Filter
**File**: `src/services/getStudentDataByClassCode.js:4`, `src/pages/Dashboard/ViewClass.jsx:105`
**exp ref**: *Read methods need tenant verification too — not just mutations* (checklist #10)

```js
// ViewClass.jsx — ownership check runs client-side BEFORE the fetch
const checkClassOwnership = async () => {
  const { data } = await supabase
    .from('teacher_class_code')
    .select('class_code')
    .eq('uuid', userId)          // ✅ scoped to teacher
    .eq('class_code', classCode)
    .single();
  setHasOwnership(!!data);
};

// BUT the actual data fetch passes NO teacher ID to the RPC
export async function getStudentsByClassCode(classCode) {
  const { data } = await supabase.rpc('retrieve_students_by_class', {
    class_code_input: classCode,  // ❌ no teacher_id — RPC unscoped
  });
}
```

**The problem**: The client-side ownership check only blocks the UI. Any authenticated user can open browser devtools and call `supabase.rpc('retrieve_students_by_class', { class_code_input: 'ANY_CODE' })` directly — bypassing React entirely. They get every student's name, email, quiz scores, and fitness data.

**Fix options (pick one)**:
1. Pass `teacher_id` into the RPC and verify inside the DB function: `retrieve_students_by_class(class_code_input, teacher_id_input)` — the DB function checks ownership before returning rows
2. Use Supabase Row Level Security (RLS) on the underlying tables so the DB rejects unowned reads regardless of how the query arrives
3. Call an edge function that verifies JWT → looks up teacher_id → gates the query server-side

**Priority**: CRITICAL. This is a data leak of all student PII to any authenticated user who knows (or guesses) a class code.

---

### MT-2. `retrieve_students_by_class` RPC — Tenant Enforcement Unverified
**File**: Supabase DB (not in `src/`)

The RPC definition lives in Supabase, not in this repo. It was given a PASS in the original audit ("Supabase RPC for complex queries") because it uses an RPC instead of raw client queries. But **using an RPC does not automatically mean it enforces tenant isolation** — it depends entirely on what SQL is inside the function.

**TODO**: Open Supabase dashboard → Database → Functions → `retrieve_students_by_class` and verify:
- Does it `JOIN teacher_class_code WHERE uuid = auth.uid()`?
- Does it use `auth.uid()` at all, or just take `class_code_input` and return all matching rows?

If it does NOT check `auth.uid()`, this is a critical cross-tenant read vulnerability.

---

### MT-3. `handleJoinClass` — No Validation That Class Code is Active/Open
**File**: `src/pages/Dashboard/StudentDashboard.jsx:268`

```js
const handleJoinClass = async () => {
  const { count } = await supabase
    .from('teacher_class_code')
    .select('*', { count: 'exact', head: true })
    .eq('class_code', tempClassCode);   // only checks existence

  if (count === 0) { alert('Invalid class code'); return; }

  await supabase.from('student_class_code')
    .update({ class_code: tempClassCode })
    .eq('uuid', userID);
};
```

No check for whether the class is open for enrollment, whether the class has a capacity limit, or whether the student is already in another class. Low severity for current use, but worth noting for future-proofing.

---

### MT-4. Corrected PASS → PARTIAL: "Ownership check before class data"

The original audit marked `checkClassOwnership()` as a clean PASS. This is wrong — the check is **UI-layer only**, not enforced at the data layer. Reclassified to ⚠️ PARTIAL pending verification of the RPC internals (MT-2).

---

## 🔴 TODO: Additional Findings (ADDED 2026-04-15)

### F-1. `useUserId` Uses `getSession()` Not `getUser()` — Unverified Token
**File**: `src/hooks/useUserId.jsx:12`

```js
const { data, error } = await supabase.auth.getSession();
```

`getSession()` reads the JWT from localStorage/sessionStorage without validating it with the Supabase server. An expired or tampered token passes this check client-side. `getUser()` makes a network call and validates the JWT server-side.

Since `useUserId()` is the hook that gates ALL protected pages and provides the `userID` used in every DB query, this matters: a user with an expired session could stay on protected pages, and the `userID` they get could be stale.

**Fix**: Replace with `supabase.auth.getUser()` — one extra network call, but the userID is authoritative.

**Severity**: Major — defense-in-depth gap, though Supabase RLS on the DB side still protects actual data.

---

### F-3. Quiz Score Calculated and Sent Entirely Client-Side — No Server Validation
**File**: `src/pages/Quiz.jsx:67-100`, `src/utilities/QuizData.js:309-349`
**exp ref**: *Every Mutation Must Scope by Tenant ID* + *Services Should Not Call Auth* (related: trust boundary)

```js
// Quiz.jsx — score, points, correctAnswer all computed in browser
let pointsEarnedForCurrentQuestion = calculatePoints(isCorrect, remainingTimeRef.current, ...);
let newQuizState = {
  score: quizState.score + (isCorrect ? 1 : 0),
  points: quizState.points + pointsEarnedForCurrentQuestion,
  ...
};
await submitAnswer(newQuizState);   // ← sends browser-computed score to DB
```

```js
// QuizData.js — submitAnswer writes whatever score it receives
await supabase.from('quiz_progress').update({
  score: score,    // ← no re-validation against stored questions
  points: points,
});
```

The server never verifies answers. Any student with browser devtools can:
1. Intercept before `submitAnswer()` and inject `score: 999, points: 9999999`
2. Call `supabase.from('quiz_progress').update(...)` directly with fabricated scores
3. Win the leaderboard with zero effort

**Fix**: Move answer validation to a Supabase Edge Function or DB trigger. The client sends `{ quizId, questionIndex, selectedAnswer }` only. The server looks up the correct answer, computes the score delta, and writes it. Client-computed scores should never be trusted.

**Severity**: CRITICAL — leaderboard and quiz scores are meaningless without server-side validation.

---

### F-5. Any User Can Self-Register as Teacher — No Authorization Gate
**File**: `src/pages/Auth/Register.jsx:165-186`
**exp ref**: *Hardcode status values — never accept approval status from user input* (checklist #20)

```jsx
<label htmlFor='teacher'>
  <input type='radio' name='userType' id='teacher'
    checked={userType === 'teacher'}
    onChange={() => setUserType('teacher')}   // ← any visitor can pick Teacher
  />
  Teacher
</label>
```

The `userType` value is set by a radio button — any visitor to `/auth/register` selects "Teacher" and becomes a teacher. Teachers can create class codes, view all student PII via `/dashboard/view-class/:classCode`, and access `retrieve_students_by_class`.

This is the most direct multi-tenancy bypass in the app: the teacher/student role separation is the entire authorization model, and anyone can pick the privileged role.

**Fix**: Remove the `userType` radio from the registration form. Either:
1. All accounts start as `student` — teachers are elevated by an admin
2. Teacher registration uses a separate invite code that proves they're staff
3. Teacher accounts are created manually in the Supabase dashboard

**Severity**: CRITICAL — entire teacher/student role boundary is self-service.

---

### F-4. Rate Limiter is Client-Side Only — Resets on Page Refresh
**File**: `src/hooks/useRateLimiter.js`

`useRateLimiter` stores attempt counters in `useRef` — in-memory, per component mount. Refreshing the page resets all counters. A brute force attacker just presses F5 after every 5 attempts. There is no server-side rate limiting on login or register.

**Fix**: Supabase Auth has built-in rate limiting on the auth endpoints. But if additional protection is needed, use a Supabase Edge Function with Redis/upstash to count attempts by IP server-side. The client hook can stay as a UX improvement only — not a security mechanism.

**Severity**: Major — the rate limiter provides false security confidence.

---

### F-2. `QuizProvider` — Null Dereference If `extractedQuizState` is Null
**File**: `src/providers/QuizProvider.jsx:35`

```js
const extractedQuizState = await extractQuizState(...);

if (extractedQuizState.remainingTime === 0)   // ❌ crashes if null
  extractedQuizState.remainingTime = questions[0].duration;
```

`extractQuizState` in `QuizData.js:283` returns `null` when the user is a student and no quiz state exists. Line 35 of `QuizProvider` accesses `.remainingTime` on `null` → runtime crash.

**Fix**: `if (extractedQuizState && extractedQuizState.remainingTime === 0)`

---

## Actual Bugs (will break in production)

| Bug | File | Symptom |
|-----|------|---------|
| `data.map()` before `if (error)` | `QuizData.js:430` | Crashes when leaderboard fetch fails |
| `navigate()` called immediately, not as callback | `StudentDashboard.jsx:301` | Redirect fires before signOut resolves |
| Lecture filter checks only Lesson1–3 out of 10 | `ViewClass.jsx:170` | Wrong filter results |
| `.map()` async result discarded | `QuizData.js:117` | Quiz details never applied |
| `user.id !== userId` always false | `AccountVerification.jsx:137` | Bad-request guard never triggers |
| `extractedQuizState` null dereference | `QuizProvider.jsx:35` | Crashes when student has no quiz state yet |
| Quiz scores computed client-side | `Quiz.jsx:67`, `QuizData.js:332` | Any student can fabricate scores via devtools |

---

## Scoring

| Category | Points | Notes |
|----------|--------|-------|
| Critical | −22 | Password in metadata, crash bug, bad logout, raw errors, no confirm, PII log, silent errors |
| Major | −16 | Auth in services, N+1, no timeout, debug log, stale closures |
| Moderate | −10 | Dead code, wrong filter, duplicate route, god components, dead CSV file, hardcoded URL |
| Minor | −6 | Personal email, wrong hook message, mixed imports, ESLint errors, magic counts |
| Positives | +14 | 14 checklist items confirmed passing |
| **Total** | **60** | |
| **Bug penalty** | −14 | 5 actual bugs that will crash or produce wrong results in production |
| **FINAL** | **46/100** | |

---

## Deployment Blockers

- [ ] **[F-5] Remove `userType` radio from register form — teacher role must be admin-granted, not self-selected**
- [ ] **[F-3] Move quiz answer validation server-side — client must not compute or submit its own score**
- [ ] **[MT-1] Verify `retrieve_students_by_class` RPC enforces teacher ownership — if not, add `teacher_id` param or RLS**
- [ ] Remove `password: trimmedPassword` from signup metadata (`Register.jsx:111`)
- [ ] Fix `fetchLeaderboard` crash — check error before calling `data.map()`
- [ ] Fix logout — `navigate` as callback, not immediate call
- [ ] Remove `console.log('all student data:', ...)` from ViewClass
- [ ] Add confirmation before delete class and leave class
- [ ] Fix duplicate `health-calculators` route
- [ ] Fix lecture filter to use all lesson keys dynamically
- [ ] Run `npm run lint` — resolve all 56 errors

---

## Priority Order

**This week (bugs + security)**
1. Fix all 5 actual bugs listed above
2. Remove password from metadata
3. Remove PII console.log

**Before release**
4. Replace raw error messages with friendly text
5. Remove debug log from useRateLimiter
6. Add HTTP timeout to useFetch
7. Move `getCurrentUser()` out of service functions
8. Batch getUserRanking calls
9. Fix duplicate route
10. Fix hardcoded URL for email redirect

**Tech debt**
11. Break StudentDashboard and ViewClass into smaller components
12. Delete or merge exportStudentCSV.js
13. Fix stale hook dependencies throughout
14. Replace hardcoded lesson/quiz counts
15. Standardise import aliases
16. Fix wrong error message in useLectureProgress
17. Remove personal email from cleanStudentData.js

---

*All findings verified against `experiences.md` entries. Every file in `src/` was read.*
