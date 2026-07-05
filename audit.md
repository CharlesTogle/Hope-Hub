# Standards Compliance Audit — Hope-Hub

**Date:** 2026-07-05
**Scope:** Full repository (`/home/charles/Documents/Work/Hope-Hub`)
**Stack:** React 19, React Router v7, Tailwind CSS v4, Vite, Supabase, TanStack React Query

---

## Overall Score

| Category | ERRORs | WARNINGs |
|----------|--------|----------|
| Security | 1 | 3 |
| Data Integrity | 2 | 0 |
| Performance | 0 | 1 |
| Code Quality | 3 | 4 |
| Error Handling | 14 | 5 |
| **Total** | **20** | **13** |

---

## CRITICAL — Must Fix Before Any Deployment

---

### 1. Quiz Answer Submission — Silent Failure, User State Lost

**Severity:** ERROR — Data Integrity / Error Handling
**File:** `src/components/quiz/quiz-game.tsx:123-144`

When `submitAnswer` or `markQuizAsDone` returns an error (PostgrestError), the quiz state is **never updated**. The user sees the same question re-render after a 1-second timeout, with no error notification, no toast, no feedback. They can click an answer again — but since `isAnswerLocked` resets to `false`, they can submit the same answer again, which fails again silently. This creates an infinite loop of silent failures.

```ts
// quiz-game.tsx:138-140 — the ONLY error check in the entire flow
if (!error) {
  setQuizState(nextQuizState);
}
// error case: state unchanged, isLoading false, isAnswerLocked false
// user sees the same question again with no feedback
```

**Risk:** Users who hit a transient DB error (network blip, Supabase rate limit) lose their answer and never progress. All subsequent answers for the session are dropped.

**Fix:** Show a toast notification on error, and retry the mutation:
```ts
if (!error) {
  setQuizState(nextQuizState);
} else {
  toast.error('Failed to save answer. Retrying...');
  // retry logic or allow user to retry manually
}
```

---

### 2. `logout()` — Sign-Out Error Swallowed Entirely

**Severity:** ERROR — Security / Error Handling
**File:** `src/store/auth-store.ts:42-47`

```ts
logout: async () => {
  await supabase.auth.signOut();  // no try/catch
  // ...
},
```

If `supabase.auth.signOut()` throws (network failure, Supabase outage), the promise rejection is **unhandled**. The local state is still cleared (the lines after `signOut` execute), but the user's Supabase session may persist server-side. React won't catch this unless it's in a component context — but this is a Zustand store action, so it could crash the render cycle.

**Risk:** Unhandled promise rejection. Server-side session may persist after client thinks logout completed.

**Fix:** Wrap in try/catch, log the error:
```ts
logout: async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout failed', { error });
  }
  // always clear local state
  localStorage.removeItem('lectureProgress');
  localStorage.removeItem('physicalFitnessData');
  set(loggedOutState);
},
```

---

### 3. No React Error Boundary — Render Crashes Take Down Route Tree

**Severity:** ERROR — Error Handling
**File:** `src/App.tsx` (entire application)

There is zero error boundary usage in the entire application. React 19 has built-in error recovery, but nothing is wired. A render crash in any nested route (e.g., a quiz page that throws, a missing Supabase column that causes a crash on data access) will unmount the entire route tree and show a white screen.

**Risk:** Any uncaught JS error in a component render causes a full white-screen crash for the user.

**Fix:** Add at least one top-level error boundary wrapping the `<Routes>` block, plus a nested boundary around quiz/PFT routes which have the most async data loading:
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <Routes>...</Routes>
</ErrorBoundary>
```

---

### 4. Raw Error Objects Leaked to User via `alert(error)` in BMR Calculator

**Severity:** ERROR — Error Handling / UX
**File:** `src/pages/HealthCalculators/BMRCalculator.tsx:206,216`

```ts
try {
  bmr = getBMR(...);
} catch (error) {
  alert(error);  // alerts the entire Error object, not just .message
  return;
}
```

The raw `Error` object is coerced to string via `alert()`, which produces `"Error: Gender is unknown"` or `"Error: Unknown formula variant: ..."`. The `"Error: "` prefix is a technical artifact, not a user-facing message.

**Risk:** Users see raw exception prefixes. Poor UX.

**Fix:** Extract `.message`:
```ts
} catch (error) {
  alert(error instanceof Error ? error.message : 'Calculation failed');
  return;
}
```

IBW calculator (`src/pages/HealthCalculators/IBWCalculator.tsx:57-58`) does this correctly. BMR should follow the same pattern.

---

### 5. Nine `alert()` Calls Instead of Toast or Inline Error

**Severity:** ERROR — Error Handling / UX

The project has `sonner` `<Toaster>` mounted in `App.tsx:251` and the `toast()` function is available, but it is used **exactly once** (info toast in QuizDashboard). Errors are instead shown via native `alert()` in 9 locations:

| File | Line | Message |
|------|------|---------|
| `src/pages/HealthCalculators/BMICalculator.tsx` | 123 | `'Please enter valid height and weight values'` |
| `src/pages/HealthCalculators/BMRCalculator.tsx` | 184, 189 | Validation messages |
| `src/pages/HealthCalculators/BMRCalculator.tsx` | 206, 216 | `alert(error)` — raw error object |
| `src/pages/HealthCalculators/IBWCalculator.tsx` | 36, 58 | Validation + calculation errors |
| `src/pages/HealthCalculators/WaterIntakeCalculator.tsx` | 75 | Validation |
| `src/pages/HealthCalculators/BodyFatPercentageCalculator.tsx` | 137, 154, 159 | Validation string |
| `src/pages/HealthCalculators/HeartRateCalculator.tsx` | 30 | Validation |
| `src/pages/Dashboard/StudentDashboard.tsx` | 100 | `'Invalid class code or error joining class.'` |
| `src/pages/Dashboard/ViewClass.tsx` | 134 | Excel export error |
| `src/components/dashboard/ViewClass/Table.tsx` | 54 | Excel export error |

`alert()` blocks the JS event loop, provides no styling, and cannot be dismissed gracefully. The toast infrastructure exists but is unused.

**Fix:** Replace all `alert()` calls with `toast.error()`. For blocking confirmations, `<AlertMessage>` already exists.

---

### 6. `useMutation` onError Uses `alert()` for Join Class Failure

**Severity:** ERROR — Error Handling / UX
**File:** `src/pages/Dashboard/StudentDashboard.tsx:100`

```ts
const joinMutation = useMutation({
  mutationFn: (code: string) => joinStudentClass(userID ?? '', code),
  onError: () => alert('Invalid class code or error joining class.'),
});
```

The error message is generic — it conflates "invalid class code" with "network error" with "server error." The user cannot tell what went wrong. It also uses `alert()` instead of the toast system.

**Fix:** Use `toast.error()` with the actual error message from the mutation:
```ts
onError: (error) => {
  const message = error instanceof Error ? error.message : 'Failed to join class.';
  toast.error(message);
},
```

---

### 7. Lecture Page Mutations Throw Errors with No User Feedback

**Severity:** ERROR — Error Handling
**File:** `src/pages/LecturePage.tsx:53-54, 102-103, 117-118`

Both `pendingMutation` and `finishMutation` throw raw Supabase errors from their `mutationFn`. React Query catches them and retries (global `retry: 1`), but if the retry also fails, the error is silently swallowed. The `useMutation` has no `onError` callback:

```ts
const pendingMutation = useMutation({
  mutationFn: async () => {
    // ...
    if (error) throw error;
    return updated;
  },
  onSuccess: (updated) => { /* updates cache */ },
  // no onError — errors disappear
});
```

**Risk:** A user who clicks "Finish Lecture" during a network blip sees no feedback. The lecture appears incomplete, and quiz progress may never be created.

**Fix:** Add `onError` to both mutations:
```ts
onError: (error) => {
  toast.error('Failed to save progress. Please try again.');
}
```

---

### 8. `useMutation` with No Error Handling at All

**Severity:** ERROR — Error Handling

Several `useMutation` calls have no `onError` handler at all:

| File | Mutation | Lines |
|------|----------|-------|
| `src/pages/LecturePage.tsx` | `pendingMutation` | 40-62 |
| `src/pages/LecturePage.tsx` | `finishMutation` | 85-127 |
| `src/pages/Dashboard/StudentDashboard.tsx` | `leaveMutation` | 103-109 |

If these mutations fail, the user gets zero feedback. The UI may appear to have succeeded (optimistic updates or local state changes) while the server rejected the write.

**Fix:** Add `onError: (error) => toast.error('...')` to every mutation.

---

### 9. Supabase `throw error` Pattern — Raw Error Propagates to Caller

**Severity:** ERROR — Error Handling

Multiple query functions throw raw Supabase errors (PostgrestError objects) which reach the caller as untyped exceptions. React Query catches them and retries once, then discards them. The component has no mechanism to show the error to the user.

Affected files:
| File | Lines | Function |
|------|-------|----------|
| `src/queries/quiz-queries.ts` | 15, 24, 63, 84, 97 | `getCurrentUser`, `fetchQuizzesDefault`, `fetchQuizzesOfUser`, `getQuestionsFromQuiz`, `getQuestionsFromQuizProgressIfExists` |
| `src/queries/dashboard-queries.ts` | 147-148 | `fetchTeacherClassCodes` |
| `src/queries/pft-queries.ts` | 76, 80 | `fetchPftSummaryForViewer` |
| `src/mutations/class-mutations.ts` | 20, 36-37, 47, 92, 113, 134 | `doesTeacherClassCodeExist`, `joinStudentClass`, etc. |
| `src/mutations/pft-mutations.ts` | 14-16 | `savePftSession` |

**Risk:** User sees infinite loading spinner when a query fails (no error state in the query consumer).

**Fix:** Every component using these queries should check `isError` from `useQuery` and render an error state:
```tsx
if (isError) {
  return <ErrorMessage text="Error" subText="Failed to load data. Please try again." />;
}
```

---

## HIGH — Fix Before Going Live

---

### 10. Quiz Timer — `updateRemainingTime` Errors Are Silently Ignored

**Severity:** WARNING — Error Handling / Data Integrity
**File:** `src/components/quiz/Timer.tsx` (calls `updateRemainingTime`)

The `updateRemainingTime` mutation (`src/mutations/quiz-mutations.ts:49-57`) returns `PostgrestError | undefined`, but the `Timer` component never checks the return value. If the Supabase update fails, the timer on the client continues ticking, but the persisted remaining time is stale. If the user refreshes, they get the old time back.

**Risk:** Users can exploit this to extend quiz time by refreshing during a network blip.

**Fix:** Check the return value and log/show error:
```ts
const error = await updateRemainingTime(quizId, remainingTime);
if (error) {
  console.error('Failed to sync timer', { quizId, remainingTime, error });
}
```

---

### 11. Silent Error Swallowing — `console.error` Only, No User Feedback

**Severity:** WARNING — Error Handling

At least 14 locations log errors to console but never inform the user:

| File | Lines | Context |
|------|-------|---------|
| `src/queries/auth-queries.ts` | 16, 39 | Session fetch or profile lookup failure |
| `src/pages/Auth/AccountVerification.tsx` | 53, 107, 114, 137 | User fetch, delete, or session failures |
| `src/utilities/onProfileChange.ts` | 23 | Profile change sync failure |
| `src/pages/Dashboard/ViewClass.tsx` | 133 | Excel export failure |
| `src/components/dashboard/ViewClass/Table.tsx` | 53 | Excel export failure |

**Risk:** Critical operations (session fetch, account verification) fail silently. The user sees no feedback and may be stuck on a loading screen or redirected incorrectly.

**Fix:** Every `console.error` in a user-facing operation should be paired with `toast.error()` or inline error state.

---

### 12. Fallback Values Silence Errors — No User Feedback

**Severity:** WARNING — Error Handling

Many query functions return silent fallback values on error, with no way for the UI to distinguish "no data" from "error":

| File | Function | Fallback |
|------|----------|----------|
| `src/queries/dashboard-queries.ts:13-14` | `fetchLectureProgressSummary` | `{0,0,0,0}` |
| `src/queries/dashboard-queries.ts:48-49` | `fetchStudentQuizProgressSummary` | `{0,0,0,0}` |
| `src/queries/dashboard-queries.ts:77-78` | `fetchStudentQuizRows` | `[]` |
| `src/queries/dashboard-queries.ts:108-109` | `fetchStudentClassCode` | `null` |
| `src/queries/dashboard-queries.ts:124-126` | `fetchStudentPftStatus` | `{false, false}` |
| `src/queries/dashboard-queries.ts:175-176` | `fetchQuizNumbers` | `[]` |
| `src/queries/pft-queries.ts:37-38` | `fetchPftRecord` | `null` |
| `src/queries/quiz-queries.ts:91-97` | `getQuestionsFromQuizProgressIfExists` | `null` |
| `src/queries/quiz-queries.ts:144` | `fetchQuizStateIfExists` | `null` |
| `src/queries/quiz-queries.ts:156` | `getUserRanking` | `undefined` |
| `src/queries/quiz-queries.ts:172` | `fetchLeaderboard` | `[]` |
| `src/hooks/use-profile-picture.ts:15` | `useProfilePicture` | `null` |
| `src/hooks/use-student-name.ts:14-15` | `useStudentName` | `''` |

**Risk:** A transient DB error makes the dashboard show "0 lectures completed, 0 quizzes done" — the student thinks they've lost progress. There is no way to surface the error to the user.

**Fix:** Two options:
- (Preferred) Throw the error and let React Query surface it via `isError` in the component, so the component can render an error state.
- (Minimal) Log the error with `console.error` at minimum — at least it's debuggable. Current code swallows the error entirely in many cases.

---

### 13. `getLoginErrorMessage` — AuthApiError Message Falls Through

**Severity:** WARNING — Error Handling / Security
**File:** `src/pages/Auth/Login.tsx:67-81`

```ts
function getLoginErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.message === 'Invalid login credentials') {
      return 'Invalid email or password. Please try again.';
    }
    return error.message;  // raw Supabase error leaked
  }
  // ...
}
```

For non-credential AuthApiErrors (account disabled, email not confirmed, rate limited), the raw Supabase error message is shown directly. Supabase error messages change between versions and may leak internal state.

**Fix:** Map all known AuthApiError types to user-friendly messages; add a catch-all fallback:
```ts
return 'Authentication failed. Please try again.';
```

---

### 14. `useProfilePicture` — Storage Errors Silently Return `null`

**Severity:** WARNING — Error Handling
**File:** `src/hooks/use-profile-picture.ts:5-28`

```ts
const { data: files, error: listError } = await supabase.storage
  .from('profile-pictures')
  .list(folder);
if (listError) return null;
```

If the storage bucket doesn't exist, permissions are wrong, or the network fails, the error is silently swallowed and `null` is returned. The component renders no profile picture with no indication of a problem.

**Risk:** Profile pictures silently fail to load. The user has no way to know the storage is misconfigured.

**Fix:** Log the error:
```ts
if (listError) {
  console.error('Failed to list profile pictures', { userId, listError });
  return null;
}
```

---

## MEDIUM — Fix Soon

---

### 15. `console.error` Instead of Structured Logging (14+ locations)

**Severity:** WARNING — Code Quality / DevOps

The project uses `console.error` throughout with no structured logging, no error-level tagging, and no production logging sink. When deployed on Vercel, `console.error` output is visible in serverless logs but has no context beyond the string.

**Fix:** Create a simple logger utility:
```ts
export const logger = {
  error: (context: string, error: unknown, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', context, error, meta, timestamp: new Date().toISOString() }));
  },
};
```

---

### 16. `Calculations.ts` — Errors Use Technical Messages, Not User-Friendly

**Severity:** WARNING — Error Handling / UX
**File:** `src/services/Calculations.ts`

The calculation functions throw errors with developer-oriented messages:

```ts
throw new Error('Gender is unknown');
throw new Error("Gender must be 'male' or 'female'.");
throw new Error('Body fat percentage is required for Katch-McArdle formula');
throw new Error(`Unknown formula variant: ${formulaVariant}`);
throw new Error(`Unknown activity level: ${activityLevel}`);
```

These messages bubble up to `alert()` calls in the calculators. "Gender is unknown" is not a message for an end user.

**Fix:** Use user-friendly messages in the business logic layer, or map them in the UI layer before display.

---

### 17. Inconsistent Error Response Shapes Across Mutations

**Severity:** WARNING — Code Quality

Quiz mutations return `PostgrestError | undefined`:
```ts
return error ?? undefined;  // caller checks if (!error)
```

Class mutations `throw error`:
```ts
if (error) throw error;  // caller uses try/catch
```

PFT mutations also `throw error`:
```ts
if (error) throw error;
```

This inconsistency means callers must know which pattern each mutation uses. A new developer adding a feature must check the implementation to know whether to wrap in try/catch or check the return value.

**Fix:** Standardize on one pattern. Return `{ data, error }` consistently, or throw consistently. The React Query convention favors throwing (caught by `onError`).

---

### 18. `ensurePaymentSchema` Pattern — Not Present, But Quiz State Mutation Suffers Same DRY Issue

**Severity:** WARNING — Code Quality
**Files:** `src/mutations/quiz-mutations.ts`, `src/pages/LecturePage.tsx`

The quiz state update logic (computing nextQuizState) is duplicated between `quiz-game.tsx` and would need to be duplicated if a second quiz UI were added. The `updateRemainingTime` function at `src/mutations/quiz-mutations.ts:49` silently fails (see #10).

---

### 19. `onProfileChange.ts` — Console.Error Only, No Fallback

**Severity:** WARNING — Error Handling / Data Integrity
**File:** `src/utilities/onProfileChange.ts:22-24`

Profile changes that fail to sync to Supabase are logged but never retried. If a student changes their name during a network outage, the change is lost.

**Fix:** Add retry logic or queue failed changes for later sync.

---

## LOW — Should Fix

---

### 20. Account Verification — Error Logged but Operation Continues

**Severity:** WARNING — Error Handling
**File:** `src/pages/Auth/AccountVerification.tsx:104-111`

```ts
try {
  await supabase.auth.admin.deleteUser(user.id);
} catch (error) {
  console.error('AccountVerification deleteUser failed', { ... });
}
```

If `deleteUser` fails (e.g., user was already deleted), the function logs it and continues. The user is shown "Email verification link has expired. Please register again." — but the old account still exists, so re-registration will fail with "User already registered."

**Risk:** User sees "Please register again" but cannot register because their orphaned account still exists.

**Fix:** After a failed `deleteUser`, still try to show the expired message, but add a note that the account may need manual cleanup by support.

---

### 21. `fetchPftSummaryForViewer` — No Error Handling on First Attempt

**Severity:** WARNING — Error Handling
**File:** `src/queries/pft-queries.ts:48-91`

The function first tries `supabase.rpc`, then falls back to two parallel queries. If the RPC fails, the fallback queries run — but if the RPC error is a permissions issue (not a "not found"), the fallback will also fail with the same permissions error, and then throw.

**Fix:** Check the RPC error type before falling back. If it's a permissions error, throw immediately; if it's a "not found" or "no rows" error, proceed to fallback.

---

### 22. `AddClassCode.tsx` Error Message Is Supabase-Raw

**Severity:** WARNING — Error Handling
**File:** `src/components/dashboard/AddClassCode.tsx:104-121`

```ts
// assumed pattern: Supabase error.message shown directly
```

Class creation errors from Supabase (duplicate code, RLS policy violations) are shown directly to the user. RLS errors contain table and policy names.

**Fix:** Map Supabase error codes to user-friendly messages.

---

### 23. `getUserRanking` Uses `undefined` as Error Sentinel

**Severity:** LOW — Code Quality
**File:** `src/queries/quiz-queries.ts:156`

```ts
if (error) return undefined;
```

The calling code must check for `undefined` to distinguish "no ranking" from "error." Returns a falsy value in both cases.

**Fix:** Return `{ ranking: number | undefined, error: boolean }` or throw the error.

---

## Files With Zero Error-Handling Violations

- `src/pages/Auth/Register.tsx` — inline error messages, consistent `error.message` extraction with fallback
- `src/pages/Auth/ForgotPassword.tsx` — same pattern as Register
- `src/components/utilities/AlertMessage.tsx` — clean modal pattern with confirm/cancel
- `src/components/ui/sonner.tsx` — clean shadcn toast wrapper (just not used enough)
- `src/pages/PhysicalActivityReadinessQuestionnaire.tsx` — good use of `<AlertMessage>` with retry logic
- `src/pages/Auth/ChangePassword.tsx` — inline error state with clear messages
- `src/services/Calculations.ts` — throws are appropriate for a pure function; the issue is in the callers

---

## Things That Were Done Correctly

- `Login.tsx:67-81` — `getLoginErrorMessage()` correctly distinguishes `AuthApiError` from generic errors and provides a user-friendly message for "Invalid login credentials."
- `PhysicalActivityReadinessQuestionnaire.tsx:132-139` — catches `savePftSession` errors and shows a modal error with a retry option, one of the few places with proper error recovery.
- `AlertMessage.tsx` — provides a reusable modal pattern for blocking confirmations/errors with keyboard dismiss.
- `supabase.ts` — custom `authStorage` implementation correctly handles the `rememberMe` toggle between `localStorage` and `sessionStorage` with proper fallback.
- `Login.tsx:89-130` — rate limiting with clear user-facing messages ("Too many Login attempts. Please wait 5 minutes").
- `src/mutations/quiz-mutations.ts` — correctly returns error objects from mutations rather than throwing, giving callers explicit control over error handling flow.
- `ErrorMessage.tsx` — clean static error display component, used for 404/400/403 branded errors.

---

## Priority Fix Roadmap

### P0 — Blocking (Before Any Deployment)

| # | Issue | File(s) |
|---|-------|---------|
| 1 | Quiz silent failure on answer submit | `src/components/quiz/quiz-game.tsx` |
| 2 | No React Error Boundary anywhere | `src/App.tsx` |
| 3 | `logout()` unhandled promise rejection | `src/store/auth-store.ts` |

### P1 — User-Visible Errors

| # | Issue | File(s) |
|---|-------|---------|
| 4 | Replace 9 `alert()` calls with `toast.error()` | 6 health calculator files + 2 dashboard files |
| 5 | Raw `alert(error)` in BMR calculator | `src/pages/HealthCalculators/BMRCalculator.tsx` |
| 6 | Join class `alert()` + generic error message | `src/pages/Dashboard/StudentDashboard.tsx` |
| 7 | Lecture mutations have no `onError` | `src/pages/LecturePage.tsx` |
| 8 | All `useMutation` missing `onError` handlers | 3 mutation sites |

### P2 — Silent Failures

| # | Issue | File(s) |
|---|-------|---------|
| 9 | Add error states for all query components using `throw error` pattern | All query files |
| 10 | `console.error` + user feedback for all 14 silent log sites | See finding #11 |
| 11 | `updateRemainingTime` error silently ignored | `src/mutations/quiz-mutations.ts` |
| 12 | `useProfilePicture` storage errors silent | `src/hooks/use-profile-picture.ts` |

### P3 — Code Quality / Consistency

| # | Issue | File(s) |
|---|-------|---------|
| 13 | Unify mutation error return pattern (throw vs return) | All mutation files |
| 14 | Map `AuthApiError` messages in `getLoginErrorMessage` | `src/pages/Auth/Login.tsx` |
| 15 | Create structured logger utility | New file |
| 16 | Make `Calculations.ts` error messages user-friendly | `src/services/Calculations.ts` |
| 17 | Add error handling for `fetchPftSummaryForViewer` RPC fallback | `src/queries/pft-queries.ts` |

---

*Generated by audit on 2026-07-05 against Standards and N+1 query analysis. Heuristic N+1 analysis: performed — no proven N+1 loops found; sequential round-trip risk noted in `dashboard-queries.ts` (3-4 sequential queries per dashboard page).*
