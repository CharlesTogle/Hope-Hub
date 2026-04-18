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

---

# Round 3 Audit — Standards Compliance
**Date**: April 18, 2026 | **Standards**: `next-standards.md` + `Supabase Standards.md`
**Scope**: `db/schema.sql`, `supabase/functions/`, `src/client/supabase.js`, full `src/`

---

## Summary

This round audits against two external standards documents. Previous rounds used `experiences.md`. New findings only — no re-listing of prior issues.

---

## 🔴 CRITICAL — RLS Policy Holes

### S-1. `quiz_progress` INSERT — Any User Can Fabricate Scores for Anyone
**File**: `db/schema.sql:490`
**Standard ref**: *Supabase 3.1 — No policy = no tenant isolation*

```sql
CREATE POLICY "Enable insert for authenticated users only" ON public.quiz_progress
  FOR INSERT TO authenticated WITH CHECK (true);
```

`WITH CHECK (true)` means any authenticated user can insert a `quiz_progress` row with **any `user_id`**. A student can inject leaderboard entries for other students or fabricate a perfect score under a rival's UUID. Previous finding F-3 (client-side score computation) compounds this — not only can scores be manipulated in the browser, they can also be inserted directly into the DB as any user.

**Fix**: `WITH CHECK ((SELECT auth.uid()) = user_id)`

---

### S-2. `quiz_progress` UPDATE — Any User Can Overwrite Any Student's Score
**File**: `db/schema.sql:608`
**Standard ref**: *Supabase 3.2 — USING controls which rows can be affected*

```sql
CREATE POLICY "Policy with table joins" ON public.quiz_progress
  FOR UPDATE USING (true);
```

`USING (true)` means every authenticated user can UPDATE every row in `quiz_progress`. Any student can zero out another student's score or set their own points to `32767` (smallint max). The leaderboard is fully manipulable.

**Fix**: `USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)`

---

### S-3. `quiz` UPDATE — Any User Can Modify Quiz Questions
**File**: `db/schema.sql:602`

```sql
CREATE POLICY "Policy with table joins" ON public.quiz
  FOR UPDATE USING (true);
```

Any authenticated user — including students — can UPDATE the `questions` JSON column of any quiz. A student can change the correct answers to their own before taking the quiz, or corrupt the quiz for everyone.

**Fix**: Remove this policy entirely, or scope to an admin/teacher role only. Students should never be able to UPDATE quiz content.

---

### S-4. `teacher_class_code` INSERT — Any User Can Create Teacher Class Codes
**File**: `db/schema.sql:504`

```sql
CREATE POLICY "Enable insert for authenticated users only" ON public.teacher_class_code
  FOR INSERT TO authenticated WITH CHECK (true);
```

Any authenticated user (including students) can INSERT into `teacher_class_code` — the table that grants teacher-level dashboard access. A student creates a class code → navigates to `/dashboard/view-class/:theirCode` → sees all other students' PII via `retrieve_students_by_class`.

This directly bypasses the F-5 finding (self-service teacher registration). Even if the register form is fixed, this RLS hole allows the same escalation path via direct DB calls.

**Fix**: `WITH CHECK ((SELECT auth.uid()) = uuid AND EXISTS (SELECT 1 FROM profile WHERE uuid = auth.uid() AND user_type = 'teacher'))` — or enforce teacher-only access via a restrictive policy.

---

### S-5. `retrieve_students_by_class` RPC — No Auth Check (MT-1/MT-2 Confirmed)
**File**: `db/schema.sql:108-148`
**Standard ref**: *Supabase 3.5 — Anti-pattern: missing tenant scope on reads*

```sql
CREATE FUNCTION public.retrieve_students_by_class(class_code_input text)
-- ...
WHERE scc.class_code = class_code_input;
-- No auth.uid() check. No teacher ownership check. Zero.
```

MT-1 and MT-2 from the previous audit are **now confirmed**. The function takes `class_code_input` and returns all matching student rows with no verification that the caller owns or teaches that class. Any authenticated user who knows (or guesses) a class code gets every student's full name, email, quiz scores, and fitness test data.

**Fix** (pick one):
1. Add `AND EXISTS (SELECT 1 FROM teacher_class_code WHERE class_code = class_code_input AND uuid = auth.uid())` to the WHERE clause
2. Add a `security definer` function in `private` schema that performs the check before delegating

---

### S-6. All Tables Readable by Anonymous Users
**File**: `db/schema.sql:508-553`
**Standard ref**: *Supabase 3.2 — Always specify TO role; 3.7 — use anon key for client, never expose private data*

```sql
CREATE POLICY "Enable read access for all users" ON public.profile FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.quiz_progress FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.student_class_code FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.lecture_progress FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.physical_fitness_test FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.teacher_class_code FOR SELECT USING (true);
```

None of these policies have a `TO` clause. Per standard, omitting `TO` means the policy runs for **all roles including `anon`**. An unauthenticated visitor can query `profile` directly via the REST API and get every user's `full_name`, `email`, and `user_type`. Same for quiz scores, fitness test results, and class membership.

**Fix**: Add `TO authenticated` to every SELECT policy. For profile/quiz_progress, additionally scope to the user's own data unless a teacher read is explicitly needed.

---

## 🔴 CRITICAL — Edge Function Issues

### S-7. Registration Edge Function Still Stores Plaintext Password
**File**: `supabase/functions/registration/index.ts:91`
**Standard ref**: *Supabase 5.2 — JWT/session management*

```typescript
data: {
  fullName: trimmedName,
  userType: userType,
  classCode: null,
  lectureProgress: lectureProgress,
  password: trimmedPassword   // ❌ plaintext password in auth metadata
}
```

First flagged in Round 1 (`Register.jsx:111`). The fix was applied to the client — but the Edge Function that actually handles registration **still stores the plaintext password**. The security hole is still live. Supabase stores `user_metadata` in `auth.users`, visible to service role queries, database exports, and Supabase's own admin UI.

**Fix**: Delete `password: trimmedPassword` from the metadata object.

---

### S-8. Raw Supabase Errors Returned to Client from Edge Functions
**Files**: `supabase/functions/login/index.ts:89`, `supabase/functions/registration/index.ts:108`
**Standard ref**: *never expose raw exception messages to clients*

```typescript
// login/index.ts
message: String(err)   // Supabase AuthApiError: "Invalid login credentials"

// registration/index.ts
message: err.message   // Supabase AuthApiError: "User already registered"
```

Both edge functions return the raw Supabase error string to the client. Supabase error messages include internal details like constraint names and auth state. "User already registered" is a user enumeration vector — attackers can probe which emails have accounts.

**Fix**: Map known error codes to safe generic messages. Log the full error server-side only.

---

### S-9. Rate Limiter Uses Global Identifier — One User Blocks All Users
**Files**: `supabase/functions/login/index.ts:46`, `supabase/functions/registration/index.ts:46`
**Standard ref**: *Supabase 2.8 — Advisory lock anti-patterns; rate limiting must be per-identifier*

```typescript
const identifier = "api";   // same in both functions
const { success } = await ratelimit.limit(identifier);
```

Both the login and registration functions use the literal string `"api"` as the rate limit key. This is a **global** bucket shared by every user, every IP. The sliding window is `10 requests / 10 seconds` globally — not per user or per IP.

Consequences:
1. A single automated client making 11 login attempts blocks **all** other users from logging in for 10 seconds
2. A DDoS of just 10 req/s against the login endpoint takes the auth system offline for all users
3. Legitimate high-traffic periods (end of school day, all students logging in) trigger the limit for everyone

**Fix**: Use `req.headers.get("x-forwarded-for") || "unknown"` or a hashed email as the identifier for per-user/per-IP rate limiting.

---

## ⚠️ MAJOR — Schema Design Violations

### S-10. Missing Indexes on Foreign Key Columns
**File**: `db/schema.sql`
**Standard ref**: *Supabase 1.4 — Always index foreign keys*

```sql
-- These FKs exist but have NO indexes:
student_class_code.uuid  → profile.uuid
teacher_class_code.uuid  → profile.uuid
quiz_progress.user_id    → profile.uuid
quiz_progress.quiz_id    → quiz.id
```

The standard is explicit: "PostgreSQL does NOT auto-index foreign keys." Every join or lookup on these columns does a full table scan. `quiz_progress` is the highest-churn table (one row per question per student) and both its FK columns are unindexed.

**Fix**:
```sql
CREATE INDEX idx_student_class_code_uuid ON student_class_code (uuid);
CREATE INDEX idx_teacher_class_code_uuid ON teacher_class_code (uuid);
CREATE INDEX idx_quiz_progress_user_id ON quiz_progress (user_id);
CREATE INDEX idx_quiz_progress_quiz_id ON quiz_progress (quiz_id);
```

---

### S-11. `json` Used Instead of `jsonb` on 4 Columns
**File**: `db/schema.sql:246,208,266,271`
**Standard ref**: *Supabase 1.3 — JSON data: always use `jsonb`, never `json`*

```sql
quiz.questions               json   -- ❌
physical_fitness_test.post_physical_fitness_test   json  -- ❌
quiz_progress.questions_answered  json  -- ❌
quiz_progress.questions_shuffled  json  -- ❌
```

`json` stores raw text and re-parses on every read. `jsonb` is binary, indexable, and ~2x faster for any query that touches these columns. The `quiz.questions` column is read on every quiz load.

**Fix**: `ALTER TABLE quiz ALTER COLUMN questions TYPE jsonb USING questions::jsonb;` (and same for the other 3 columns). These are non-locking operations in PostgreSQL 15+.

---

### S-12. `profile` UPDATE Policy Uses JWT Email Instead of `auth.uid()`
**File**: `db/schema.sql:567`
**Standard ref**: *Supabase 3.5 — Using `raw_user_meta_data` or JWT claims for authorization is a security hole*

```sql
CREATE POLICY "Enable update for users based on email" ON public.profile
  FOR UPDATE USING ((auth.jwt() ->> 'email') = email)
  WITH CHECK ((auth.jwt() ->> 'email') = email);
```

The standard flags JWT claims as fragile for authorization: email can be changed, JWTs can be replayed after email updates, and the `email` field in the JWT may lag until token refresh. `auth.uid()` is the canonical, stable identity claim.

**Fix**: `USING ((SELECT auth.uid()) = uuid) WITH CHECK ((SELECT auth.uid()) = uuid)`

---

### S-13. RLS Policies Missing `TO authenticated` Role Scoping
**File**: `db/schema.sql` — all SELECT policies
**Standard ref**: *Supabase 3.4 — Always specify target role (99%+ perf improvement for anon queries)*

Zero SELECT policies specify `TO authenticated`. Per the standard, this causes the policy to evaluate for both `authenticated` and `anon` roles on every request. Benchmarked improvement of specifying `TO authenticated`: **170ms → <0.1ms** for anon queries.

**Fix**: Add `TO authenticated` to all policies. For truly public data (if any), use `TO anon, authenticated`.

---

### S-14. No Supabase Migrations Workflow
**File**: `supabase/` — no `migrations/` directory
**Standard ref**: *Supabase 4.1 — Migration workflow; 4.2 — Always test migrations locally first*

The schema lives in `db/schema.sql` as a raw `pg_dump`. This is a snapshot, not a migration history. There is no way to:
- Apply changes incrementally to production without manual SQL
- Track what has changed since deployment
- Roll back a bad schema change
- Have CI/CD automatically apply migrations

**Fix**: `supabase migration new initial_schema` → paste the schema → commit. All future schema changes via `supabase migration new <name>`. The `db/schema.sql` dump can stay as reference documentation.

---

## 🟡 MODERATE — Next Standards Gaps

### S-15. No TypeScript — Entire Stack Violates Language Standard
**Standard ref**: *next-standards.md — Language: TypeScript (strict)*

The entire project uses `.jsx` and `.js`. Zero `.tsx` or `.ts` files in `src/`. The standard mandates TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`, and a `types/` directory for domain interfaces.

This isn't a fixable lint rule — it's a full migration. That said, it's the root cause of many issues in this codebase: the null dereferences (S-F2), the silent error discards, and the service/component type confusion would all be caught at compile time with TypeScript.

**Fix**: Migrate incrementally. Start with `allowJs: true` in `tsconfig.json` and rename files one module at a time.

---

### S-16. No TanStack Query — Entire Data Layer Violates Fetching Standard
**Standard ref**: *next-standards.md — "Use TanStack Query for all server data. Never use raw `fetch()` inside `useEffect`."*

Every data-fetching hook (`useDashboardData.js`, `useLectureProgress.jsx`, `usePhysicalFitnessData.jsx`, `useFetch.jsx`) uses `useEffect` + direct Supabase calls. This gives the app:
- No request deduplication
- No cache — every navigation refetches everything
- No background refetch / stale-while-revalidate
- No automatic retry on network failure
- No loading/error state standardization

**Fix**: Wrap Supabase calls in `useQuery` / `useMutation` hooks from `@tanstack/react-query`. Add a `QueryClientProvider` at the app root.

---

### S-17. No Zustand — Client State Scattered Across Providers and useState
**Standard ref**: *next-standards.md — State: Zustand (domain stores)*

Shared auth state (`userId`) is re-fetched by each component via `useUserId()`. Quiz state flows through four nested Context providers (`QuizContext`, `QuestionsContext`, `RemainingTimeContext`, `IdentificationRefContext`). There is no single source of truth for auth session, profile, or quiz state.

The standard is explicit: ephemeral UI state belongs in `useState`, but cross-component shared state belongs in Zustand domain stores. The current nested Context approach creates provider hell and makes state debugging opaque.

---

### S-18. File Naming Violates kebab-case Standard Throughout
**Standard ref**: *next-standards.md — Files: `kebab-case.ts` / `kebab-case.tsx`*

The standard requires `kebab-case` for all filenames. The project uses `PascalCase` for every component file:

```
StudentDashboard.jsx  → student-dashboard.jsx
ViewClass.jsx         → view-class.jsx
QuizData.js           → quiz-data.js
LectureProvider.jsx   → lecture-provider.jsx
```

This affects ~90+ files. While a purely cosmetic issue in isolation, mixing `PascalCase` files with `@/components/auth/FormInput` imports versus `@/components/ui/button` (`ui/` already uses kebab) creates an inconsistent import surface.

---

### S-19. `useEffect` for Data Fetching Not Defensive Against `userID` Null Race
**Standard ref**: *next-standards.md — State Reset on Prop Change, Derived State*

`useDashboardData.js` and all similar hooks gate on `if (!userID) return` inside the effect, but `userID` starts as `null` (from `useUserId`). On first render, effects fire with `null`, bail out, then fire again when `userID` resolves. This is the classic "derived state in useEffect" anti-pattern — the standard recommends the `key` prop pattern or TanStack Query's `enabled` option to avoid this double-trigger.

---

## 🔵 MINOR — Schema Conventions

### S-20. FK Columns Named `uuid` Instead of `user_id`
**Standard ref**: *Supabase 1.1 — Foreign keys: singular table name + `_id` suffix*

Most tables use `uuid` as the column that references `profile.uuid`. Standard convention is `profile_id` or `user_id`. The current naming is ambiguous: `uuid` is also a PostgreSQL type, and `student_class_code.uuid` reads as if it's the row's own UUID rather than a foreign key.

---

### S-21. No `updated_at` Trigger on Any Table
**Standard ref**: *Supabase 1.5 — Standard table template includes auto-update `updated_at` trigger*

`quiz_progress`, `profile`, and `physical_fitness_test` all have no `updated_at` column or trigger. The standard template explicitly includes this for every table. Without it, there's no way to know when a row was last modified for debugging, auditing, or cache invalidation.

---

### S-22. Schema Not Idempotent — No `IF NOT EXISTS` Guards
**Standard ref**: *Supabase 2.7 — Idempotent Migration Patterns*

The `db/schema.sql` uses bare `CREATE TABLE`, `CREATE FUNCTION`, `CREATE POLICY` — no `IF NOT EXISTS` guards. Attempting to re-run it against a database that already has the schema fails immediately. The standard requires all DDL to be idempotent.

---

## Updated Scoring (Round 3 Additions Only)

| Category | New Points | Notes |
|----------|-----------|-------|
| Critical | −18 | S-1 quiz_progress insert, S-2 quiz_progress update, S-3 quiz update, S-4 teacher_class_code insert, S-5 RPC confirmed, S-6 anon read, S-7 password still in edge fn, S-8 raw errors, S-9 global rate limit |
| Major | −8 | S-10 missing FK indexes, S-11 json vs jsonb, S-12 profile policy, S-13 missing TO clause, S-14 no migrations |
| Moderate | −6 | S-15 no TypeScript, S-16 no TanStack Query, S-17 no Zustand, S-18 file naming, S-19 useEffect race |
| Minor | −3 | S-20 FK naming, S-21 no updated_at, S-22 non-idempotent schema |
| **Round 3 total** | **−35** | |
| **Previous score** | **46/100** | |
| **Adjusted score** | **~30/100** | Many prior "passes" were incomplete without DB/standards context |

---

## New Deployment Blockers (Round 3)

- [ ] **[S-2] Fix `quiz_progress` UPDATE policy — `USING (true)` lets any user overwrite anyone's scores**
- [ ] **[S-3] Fix `quiz` UPDATE policy — `USING (true)` lets any user modify quiz questions**
- [ ] **[S-1] Fix `quiz_progress` INSERT policy — `WITH CHECK (true)` lets any user fabricate scores for any user_id**
- [ ] **[S-4] Fix `teacher_class_code` INSERT policy — students can create class codes**
- [ ] **[S-5] Add auth.uid() check to `retrieve_students_by_class` RPC**
- [ ] **[S-6] Add `TO authenticated` to all SELECT policies — currently readable by anonymous users**
- [ ] **[S-7] Remove plaintext password from registration edge function metadata**
- [ ] **[S-9] Fix rate limiter identifier to be per-IP or per-email, not global `"api"`**

---

*Round 3 sources: `db/schema.sql`, `supabase/functions/login/index.ts`, `supabase/functions/registration/index.ts`, `src/client/supabase.js`, `next-standards.md`, `Supabase Standards.md`*

---

# Round 4 Audit — Full Codebase Re-Read (Standards Pass)
**Date**: April 18, 2026 | **Method**: 2 subagents — pages/hooks/providers + components/services/utilities
**Standards**: `next-standards.md` + `Supabase Standards.md`

---

## 🔴 CRITICAL

### R4-1. `setSession()` Not Awaited — Password Reset Race Condition
**File**: `src/pages/Auth/ChangePassword.jsx:22-29`
**Standard**: Supabase Standards §5 — proper async session management

```js
useEffect(() => {
  if (type === 'recovery' && access_token) {
    supabase.auth.setSession({   // ❌ not awaited
      access_token,
      refresh_token: searchParams.get('refresh_token') || '',
    });
  }
}, [searchParams]);
```

`setSession()` is fire-and-forget. The component renders the password change form immediately — before the session is established. A fast user who submits before the async resolves will get an auth error with no clear explanation.

**Fix**: Make the effect async, await `setSession()`, set a loading flag while it resolves, and block form submission until session is confirmed.

---

### R4-2. Two Different Hardcoded Production URLs in Auth
**Files**: `src/pages/Auth/Register.jsx:105`, `src/pages/Auth/ForgotPassword.jsx:46`
**Standard**: Next-standards §Hardcoded Production URL (already flagged for Register, now confirmed ForgotPassword too — different domain)

```js
// Register.jsx
emailRedirectTo: 'https://hope-hub-fitness.vercel.app/auth/account-verification'

// ForgotPassword.jsx
redirectTo: 'https://hope-hub-dcvm.vercel.app/auth/change-password'
```

Two different Vercel project domains. One is stale or wrong. Password reset emails redirect to the wrong deployment — users can't complete the reset flow from the correct app. Also breaks local development for both flows.

**Fix**: `import.meta.env.VITE_APP_URL + '/auth/...'` in both files. Add `VITE_APP_URL` to `.env.example`.

---

### R4-3. Supabase Calls Embedded in Export Utilities — Duplicated
**Files**: `src/utilities/exportStudentCSV.js:12-23`, `src/utilities/exportStudentExcel.js:12-23`
**Standard**: Next-standards §Services Layer — "Components never call `fetch()` directly"; same principle applies to utilities

`getDetailedPFTData()` is defined identically in both files — a full Supabase query for `physical_fitness_test` embedded inside export utilities. Utilities should be pure functions. DB queries belong in services.

**Fix**: Move `getDetailedPFTData()` to a shared service (`services/physical-fitness-service.js`), import in both export files. Eliminates the duplication and correctly separates concerns.

---

### R4-4. Format Functions Triplicated Across Export Files
**Files**: `src/utilities/exportStudentCSV.js:28-82`, `src/utilities/exportStudentExcel.js:28-82`
**Standard**: next-standards §Dead Code Policy / DRY

`formatBMI()`, `formatPFTTest()`, `formatStepTest()` — three functions, identical implementations, copy-pasted between both files. Any change to the format logic requires editing two places and risks divergence.

**Fix**: Extract to `src/utilities/format-pft.js`, import in both.

---

## ⚠️ MAJOR

### R4-5. BMRCalculator and BodyFatCalculator — 18-20 `useState` Calls Each
**Files**: `src/pages/HealthCalculators/BMRCalculator.jsx`, `src/pages/HealthCalculators/BodyFatPercentageCalculator.jsx`
**Standard**: next-standards §useState Limits — "5+ related `useState` calls with related state, consolidate with `useReducer`"

- `BMRCalculator`: `gender`, `age`, `heightUnit`, `weightUnit`, `height`, `weight`, `formulaVariant`, `bodyFat`, `bmrResult`, `maintainingCalories`, `activityLevel`, `weightGain`, `weightLoss`, and more — ~20 calls
- `BodyFatCalculator`: `gender`, `age`, `height`, `heightUnit`, `weight`, `weightUnit`, `neck`, `waist`, `hips`, `neckUnit`, `waistUnit`, `hipsUnit`, `results`, `bodyFatPercentageCategory`, etc. — ~18 calls

All state is form inputs + results for a single calculation concern. The standard's threshold is 5+.

**Fix**: One `useReducer` per calculator with `initialState` and an `UPDATE_FIELD` action.

---

### R4-6. Debug `console.log` Left in Production Components
**Files**: `src/pages/PhysicalActivityReadinessQuestionnaire.jsx:107`, `src/pages/HealthCalculators/HeartRateCalculator.jsx:92`
**Standard**: next-standards §No Sensitive Data in Logs (also: general code quality)

```js
console.log(currentAnswers);      // PAR-Q — fires on every answer change
console.log({ thrResult });       // HeartRateCalculator — fires on every calculation
```

**Fix**: Delete both lines.

---

### R4-7. Array Index as Key on Filtered/Mutable Lists
**Files**: `src/pages/LecturesIntroduction.jsx:116,161`, `src/pages/Dashboard/ViewClass.jsx:375`, `src/pages/QuizDashboard.jsx:67`
**Standard**: next-standards §Accessibility — Array Keys

```js
// LecturesIntroduction — filtered list, order changes with filter selection
mergedLessons.filter(...).map((lesson, idx) => (
  <LectureIntroduction key={idx} ... />   // ❌
))

// QuizDashboard — filtered by quiz type
quizzes.filter(...).map((quiz, idx) => (
  <QuizCard key={idx} ... />              // ❌
))
```

**Fix**: Use stable IDs — `key={lesson.key}`, `key={quiz.id}`.

---

### R4-8. `getStudentDataByClassCode` — Silent Error, Caller Can't Distinguish Empty vs Failed
**File**: `src/services/getStudentDataByClassCode.js`
**Standard**: next-standards §Services Layer — "Services throw on non-OK responses"

```js
export async function getStudentsByClassCode(classCode) {
  const { data } = await supabase.rpc('retrieve_students_by_class', {
    class_code_input: classCode,
  });
  return data ?? [];   // ❌ error swallowed — empty array on failure looks like empty class
}
```

If the RPC fails (network error, auth error, permission denied), the caller gets `[]` back — indistinguishable from a class with zero students. Teacher sees a blank table and has no idea why.

**Fix**: Destructure `error`, throw or return `{ data, error }` so the caller can surface it.

---

### R4-9. Missing Client-Side Filter on `JoinClass` Lookup
**File**: `src/components/dashboard/JoinClass.jsx:21-25`
**Standard**: Supabase Standards §3.4 — "Always add client-side filters (94% improvement)"

```js
const { count } = await supabase
  .from('teacher_class_code')
  .select('*', { count: 'exact', head: true })
  .eq('class_code', code);   // relies entirely on RLS + DB scan for existence check
```

No format validation before the query — any string hits the DB. Also no `.limit(1)` — the DB counts all matching rows when one is sufficient.

**Fix**: Validate class code format client-side first (e.g. length/character check). Add `.limit(1)` to the query.

---

### R4-10. Orphaned String Statements in `PhysicalFitnessTestSummary`
**File**: `src/pages/PhysicalFitnessTestSummary.jsx:50,63,70,77`

```js
if (studentCheckError || !studentExists) {
  ('this 1');    // ❌ bare string — does nothing, leftover from debugging
  setIsBadRequest(true);
}
```

Four of these across the file. They're not `console.log` calls — they're standalone string expressions that silently evaluate to nothing. No runtime error, no output. Pure dead development noise.

**Fix**: Delete all four.

---

## 🟡 MODERATE

### R4-11. Supabase Calls in `AddClassCode` Component Directly
**File**: `src/components/dashboard/AddClassCode.jsx:135-143`
**Standard**: next-standards §Services Layer — "Components never call fetch() directly"

Component calls `supabase.from('teacher_class_code').insert(...)` inline. Should go through a service function.

---

### R4-12. `onProfileChange.js` — Direct Storage Call, No Error Returned
**File**: `src/utilities/onProfileChange.js:14-20`
**Standard**: next-standards §Services Layer + Error Handling

`supabase.storage.from().upload()` called directly in a utility with no error propagation to the caller. If the upload fails, nothing happens — no feedback to user, no log.

---

### R4-13. Missing Accessibility — Search Input Has No Label
**File**: `src/components/dashboard/Search.jsx:16-20`
**Standard**: next-standards §Accessibility — Labels

Search input has placeholder text only. No `<label>`, no `aria-label`, no `htmlFor` association. Screen readers have no way to announce what the input is for.

**Fix**: `<input aria-label="Search students" ... />` or a visually-hidden `<label>`.

---

### R4-14. Clickable `div` Missing `role`, `tabIndex`, `onKeyDown` in ClassCode
**File**: `src/components/dashboard/ClassCode.jsx:10-14`
**Standard**: next-standards §Accessibility — Interactive Elements

`div` with `onClick` but no `role="button"`, no `tabIndex={0}`, no keyboard handler. Keyboard-only users can't activate it.

**Fix**: Replace with `<button>` or add the three required attributes.

---

### R4-15. Clickable Logo `div` in Sidebar Missing Keyboard Support
**File**: `src/components/Sidebar.jsx:131`
**Standard**: next-standards §Accessibility — Interactive Elements

Same pattern — `onClick` on a `div` that navigates to `/home`. No keyboard access.

**Fix**: Wrap in `<button>` or add `role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/home')}`.

---

### R4-16. `PhysicalFitnessTest` Component — 5+ Related `useState` Calls
**File**: `src/components/physical-fitness-test/PhysicalFitnessTest.jsx:52-68`
**Standard**: next-standards §useState Limits

`currentTime`, `category`, test result fields, `showAlert`, `alertMessage`, `timerTime` — all tightly coupled to one test session concern.

**Fix**: `useReducer` with a `testState` object.

---

### R4-17. Relative Import in `Sidebar.jsx`
**File**: `src/components/Sidebar.jsx`
**Standard**: next-standards §Path Aliases — "Always use `@/` for imports from `src/`"

Uses `../assets/...` relative path. Rest of the codebase uses `@/assets/...`.

**Fix**: `import SidebarLogo from '@/assets/logos/hopehub_logo_v1.png'`

---

### R4-18. Missing `useEffect` Dependencies in `ChangePassword`
**File**: `src/pages/Auth/ChangePassword.jsx:29`
**Standard**: next-standards §Missing React Hook Dependencies (already a category in audit)

`useEffect` depends on `[searchParams]` but reads `type` and `access_token` derived from `searchParams` inside the effect. Should list all consumed variables as dependencies.

---

## 🔵 MINOR

### R4-19. `shuffleQuizQuestionsAndChoices` — Unexported Dead Function
**File**: `src/utilities/QuizData.js`
**Standard**: next-standards §Dead Code Policy

Defined but neither exported nor referenced outside its own file. If it's a private helper, it should stay — but it's not called from within the file either. Dead code.

**Fix**: Delete or move inside `fetchQuizQuestions()` if it was meant to be called there.

---

### R4-20. Empty `catch` in `AudioPlayer`
**File**: `src/components/quiz/AudioPlayer.jsx:15-16`
**Standard**: next-standards / experiences §Always Log Full Exception Objects

```js
audio.play().catch(() => {});   // ❌ silence
```

Audio play errors (browser autoplay policy, missing file) silently swallowed. User hears nothing, knows nothing.

**Fix**: At minimum `console.error('audio play failed', err)`. Ideally set a state flag to show a play button.

---

### R4-21. `CustomButton` — `isDisabled` Set But Never Reset
**File**: `src/components/quiz/CustomButton.jsx:5`
**Standard**: next-standards §useState Limits / component correctness

`isDisabled` flips to `true` on click and never resets. Button becomes permanently unusable after one click per mount. Likely intended to prevent double-submission but has no recovery path.

**Fix**: Reset after async action completes, or manage the disabled state at the parent level where the async lifecycle is known.

---

## Round 4 Scoring

| Category | Points | Notes |
|----------|--------|-------|
| Critical | −12 | R4-1 session race, R4-2 wrong URLs, R4-3 DB in utils, R4-4 triplicated format fns |
| Major | −14 | R4-5 useState overload x2, R4-6 debug logs, R4-7 index keys, R4-8 silent error, R4-9 no filter, R4-10 orphaned strings |
| Moderate | −8 | R4-11 through R4-18 |
| Minor | −3 | R4-19 through R4-21 |
| **Round 4 total** | **−37** | |
| **Previous score** | **~30/100** | |
| **Adjusted score** | **~20/100** | |

---

*Round 4 sources: all files in `src/pages/`, `src/hooks/`, `src/providers/`, `src/components/`, `src/services/`, `src/utilities/`, `src/lib/`, `package.json` — read in full via 2 parallel subagents.*
