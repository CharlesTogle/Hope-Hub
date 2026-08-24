# Friendly Error Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw, technical, hidden, and non-actionable UI errors with stable messages that explain what happened and what the user can do next.

**Architecture:** Add one small pure error-message mapper in `src/utilities` for auth, network, and common Supabase failures. Keep technical errors in `logger`; UI components receive either safe mapped messages or explicit React Query error states. Upgrade the shared `ErrorMessage` component to support friendly title, description, and optional retry/back actions without adding a new dependency.

**Tech Stack:** React 19, TypeScript, TanStack React Query, Supabase JS, Zustand, Sonner, Vitest, Playwright.

## Global Constraints

- Never render `error.message`, `String(error)`, Supabase/PostgREST text, SQL text, or `Failed to fetch` directly to users.
- Every recoverable UI error must state what happened and what the user can do next.
- Log technical details through the existing `logger`; do not log passwords, tokens, or unnecessary PII.
- Preserve valid empty states. Empty/default data must not be used as a sentinel for a failed request.
- Prefer the existing Sonner toast, `ErrorMessage`, React Query, and Vitest setup; do not add dependencies.
- Keep each task independently testable and commit each completed task separately.

---

## File Map

| File | Responsibility in this plan |
|------|-----------------------------|
| `src/utilities/user-facing-errors.ts` | Pure mapping from unknown technical errors/context to stable user-facing copy. |
| `src/utilities/__tests__/user-facing-errors.test.ts` | Unit coverage for network, auth, rate-limit, permission, and fallback mapping. |
| `src/pages/Auth/ForgotPassword.tsx` | Use the shared mapper and log reset failures. |
| `src/pages/Auth/AccountVerification.tsx` | Use the shared mapper for resend failures and query failures. |
| `src/pages/HealthCalculators/IBWCalculator.tsx` | Stop displaying arbitrary calculator exception text. |
| `src/pages/HealthCalculators/BMRCalculator.tsx` | Stop displaying arbitrary calculator exception text. |
| `src/mutations/class-mutations.ts` | Stop rethrowing raw Supabase messages; preserve safe operation errors. |
| `src/mutations/pft-mutations.ts` | Stop rethrowing raw Supabase messages. |
| `src/pages/Dashboard/StudentDashboard.tsx` | Use safe class mutation messages and surface dashboard query failures. |
| `src/components/dashboard/AddClassCode.tsx` | Use safe class mutation messages. |
| `src/components/dashboard/JoinClass.tsx` | Show explicit lookup failure copy and retry path. |
| `src/components/utilities/ErrorMessage.tsx` | Render friendly error title, description, and optional actions. |
| `src/pages/PhysicalFitnessTestPage.tsx` | Replace HTTP jargon with actionable copy. |
| `src/pages/PhysicalFitnessTestSummary.tsx` | Distinguish invalid route, permission, missing class, and load failure. |
| `src/pages/LecturePage.tsx` | Replace invalid-page jargon and expose progress-load failure. |
| `src/pages/QuizDashboard.tsx` | Add query error state and retry action. |
| `src/pages/LecturesIntroduction.tsx` | Throw/report progress-load errors instead of returning defaults. |
| `src/queries/dashboard-queries.ts` | Preserve errors for UI instead of returning false zero/empty values. |
| `src/services/getStudentDataByClassCode.ts` | Preserve roster query errors. |
| `src/pages/Dashboard/ViewClass.tsx` | Render roster/query failure state and retry. |
| `src/utilities/onProfileChange.ts` | Return safe upload errors and log technical details. |
| `src/pages/Dashboard/TeacherDashboard.tsx` | Show profile upload result and logout warning. |
| `src/pages/Dashboard/StudentDashboard.tsx` | Show profile upload result and logout warning. |
| `src/store/auth-store.ts` | Return logout outcome while retaining local cleanup. |
| `src/components/quiz/Timer.tsx` | Add throttled timer-sync warning/retry behavior. |
| `src/components/quiz/quiz-game.tsx` | Keep quiz-save errors safe and test the user-visible path. |
| `e2e/tests/auth/auth.spec.ts` | Verify auth flows do not expose raw technical errors where feasible. |

## Test Commands

- Unit tests: `pnpm test`
- Targeted unit test: `pnpm test -- src/utilities/__tests__/user-facing-errors.test.ts`
- Lint: `pnpm lint`
- Type check: `pnpm type-check`
- Production build: `pnpm build`
- E2E: `pnpm test:e2e`

---

### Task 1: Add the Shared Friendly Error Mapper

**Files:**
- Create: `src/utilities/user-facing-errors.ts`
- Create: `src/utilities/__tests__/user-facing-errors.test.ts`

**Interfaces:**
- Produces `getUserFacingError(error: unknown, context: ErrorContext): string`.
- `ErrorContext` is `'login' | 'registration' | 'password-reset' | 'verification-resend' | 'join-class' | 'leave-class' | 'class-management' | 'pft-save' | 'profile-upload' | 'calculation' | 'load'`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { getUserFacingError } from '@/utilities/user-facing-errors';

describe('getUserFacingError', () => {
  it('maps network failures to a retry instruction', () => {
    expect(getUserFacingError(new TypeError('Failed to fetch'), 'password-reset'))
      .toBe("We can't reach the server right now. Check your internet connection and try again in a moment.");
  });

  it('maps rate limits to a wait instruction', () => {
    expect(getUserFacingError({ status: 429, message: 'rate limit exceeded' }, 'registration'))
      .toBe('Too many registration attempts. Please wait a moment and try again.');
  });

  it('maps auth provider text without exposing it', () => {
    expect(getUserFacingError(new Error('Invalid login credentials'), 'login'))
      .toBe('Invalid email or password. Please try again.');
  });

  it('maps unknown errors to context-specific safe copy', () => {
    const message = getUserFacingError(new Error('SQL relation profile missing'), 'pft-save');
    expect(message).toBe('We could not save your fitness test data. Check your connection and try saving again.');
    expect(message).not.toContain('SQL');
  });
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run: `pnpm test -- src/utilities/__tests__/user-facing-errors.test.ts`

Expected: FAIL because `src/utilities/user-facing-errors.ts` does not exist.

- [ ] **Step 3: Implement the minimal mapper**

```ts
export type ErrorContext =
  | 'login'
  | 'registration'
  | 'password-reset'
  | 'verification-resend'
  | 'join-class'
  | 'leave-class'
  | 'class-management'
  | 'pft-save'
  | 'profile-upload'
  | 'calculation'
  | 'load';

const networkMessage = "We can't reach the server right now. Check your internet connection and try again in a moment.";

const fallbackMessages: Record<ErrorContext, string> = {
  login: 'We could not sign you in. Check your details and try again.',
  registration: 'We could not create your account. Please try again in a moment.',
  'password-reset': 'We could not send the reset link. Please try again, and contact support if the problem continues.',
  'verification-resend': "We couldn't resend the verification email. Check your connection and try again.",
  'join-class': "We couldn't join that class right now. Check the code and your connection, then try again.",
  'leave-class': "We couldn't remove you from the class. Check your connection and try again.",
  'class-management': "We couldn't update your classes right now. Please try again in a moment.",
  'pft-save': 'We could not save your fitness test data. Check your connection and try saving again.',
  'profile-upload': "We couldn't save your profile picture right now. Check your connection and try again.",
  calculation: "We couldn't calculate your result. Review your entries and try again.",
  load: "We couldn't load this information right now. Check your connection and try again.",
};

export function getUserFacingError(error: unknown, context: ErrorContext): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : undefined;

  if (status === 429 || message.includes('rate limit')) {
    if (context === 'registration') return 'Too many registration attempts. Please wait a moment and try again.';
    if (context === 'password-reset') return "You've requested several reset links. Please wait a few minutes before trying again.";
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (message.includes('failed to fetch') || message.includes('network') || message.includes('timeout')) {
    return networkMessage;
  }

  if (context === 'login' && message === 'invalid login credentials') {
    return 'Invalid email or password. Please try again.';
  }

  if (context === 'login' && message === 'email not confirmed') {
    return 'Please verify your email before logging in.';
  }

  return fallbackMessages[context];
}
```

- [ ] **Step 4: Run the targeted test and verify it passes**

Run: `pnpm test -- src/utilities/__tests__/user-facing-errors.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utilities/user-facing-errors.ts src/utilities/__tests__/user-facing-errors.test.ts
git commit -m "feat: add friendly user-facing error mapper"
```

### Task 2: Remove Raw Auth and Calculator Error Messages

**Files:**
- Modify: `src/pages/Auth/Login.tsx:67-84`
- Modify: `src/pages/Auth/ForgotPassword.tsx:88-95`
- Modify: `src/pages/Auth/AccountVerification.tsx:192-205`
- Modify: `src/pages/HealthCalculators/IBWCalculator.tsx:58-60`
- Modify: `src/pages/HealthCalculators/BMRCalculator.tsx:207-219`

**Interfaces:** Consumes `getUserFacingError` from Task 1.

- [ ] **Step 1: Add failing mapper-use assertions**

Extend `user-facing-errors.test.ts` with context assertions for `verification-resend` and `calculation`, then run `pnpm test -- src/utilities/__tests__/user-facing-errors.test.ts` and confirm failure if the mappings are not present.

- [ ] **Step 2: Replace direct rendering**

Import `logger` where missing. In each caught/returned error branch, log the original error and use:

```ts
dispatch({ type: 'set-error', value: getUserFacingError(error, 'password-reset') });
```

```ts
toast.error(getUserFacingError(error, 'verification-resend'));
```

```ts
toast.error(getUserFacingError(error, 'calculation'));
```

For login, replace the local fallback that returns arbitrary `error.message` with `getUserFacingError(error, 'login')` while retaining the existing known auth behavior through the shared mapper.

- [ ] **Step 3: Verify**

Run: `pnpm test`, `pnpm lint`, `pnpm type-check`

Expected: all pass; no modified auth/calculator path contains user-facing `error.message` rendering.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Auth src/pages/HealthCalculators src/utilities/user-facing-errors.ts src/utilities/__tests__/user-facing-errors.test.ts
git commit -m "fix: hide raw auth and calculator errors"
```

### Task 3: Make Class and PFT Mutations Safe

**Files:**
- Modify: `src/mutations/class-mutations.ts:30-48,129-141`
- Modify: `src/mutations/pft-mutations.ts:9-16`
- Modify: `src/pages/Dashboard/StudentDashboard.tsx:94-114`
- Modify: `src/components/dashboard/AddClassCode.tsx:104-120`
- Modify: `src/components/dashboard/JoinClass.tsx:27-45`
- Modify: `src/pages/PhysicalActivityReadinessQuestionnaire.tsx:133-145,238-247`

**Interfaces:** Consumes `getUserFacingError`. Mutation functions may continue throwing the original error object for React Query logging, but UI handlers must map it before display. They must not create `new Error(error.message)` solely to pass text upward.

- [ ] **Step 1: Update mutation error propagation**

Replace raw rethrows with the original error or a safe operation-level error. Use the original error for logging and map at UI boundaries:

```ts
if (error) throw error;
```

```ts
onError: (error) => toast.error(getUserFacingError(error, 'join-class'))
```

Use `leave-class`, `class-management`, and `pft-save` for the corresponding operations.

- [ ] **Step 2: Preserve known class messages without raw fallback**

Keep explicit known messages for duplicate code and permission failures. For all other failures, use the shared mapper rather than `error.message`.

- [ ] **Step 3: Verify**

Run: `pnpm test`, `pnpm lint`, `pnpm type-check`

Expected: PASS; `grep` finds no `throw new Error(error.message)` in the modified mutation files and no class/PFT UI handler renders arbitrary exception text.

- [ ] **Step 4: Commit**

```bash
git add src/mutations/class-mutations.ts src/mutations/pft-mutations.ts src/pages/Dashboard/StudentDashboard.tsx src/components/dashboard/AddClassCode.tsx src/components/dashboard/JoinClass.tsx src/pages/PhysicalActivityReadinessQuestionnaire.tsx
git commit -m "fix: map class and fitness errors for users"
```

### Task 4: Upgrade Shared Error Pages With Recovery Actions

**Files:**
- Modify: `src/components/utilities/ErrorMessage.tsx`
- Modify: `src/pages/PhysicalFitnessTestPage.tsx:91-93`
- Modify: `src/pages/PhysicalFitnessTestSummary.tsx:70-83`
- Modify: `src/pages/LecturePage.tsx:137-138`
- Modify: `src/pages/Auth/AccountVerification.tsx:262-264`
- Modify: `src/pages/Dashboard/ViewClass.tsx:142-143`

**Interfaces:** `ErrorMessage` accepts `title: string`, `description: string`, optional `onRetry?: () => void`, and optional `onBack?: () => void`. Existing call sites must be updated; do not keep HTTP-code props.

- [ ] **Step 1: Write the component test or direct acceptance cases**

Add a focused test if the repo’s React test setup supports component rendering. Otherwise manually verify the following cases after implementation: invalid route, forbidden route, missing class, and transient load error each show a plain-language description and at least one useful navigation/retry action.

- [ ] **Step 2: Implement the component**

Render a semantic status region:

```tsx
<section role='alert' className='...'>
  <h1>{title}</h1>
  <p>{description}</p>
  <div>
    {onRetry && <button onClick={onRetry}>Try again</button>}
    {onBack && <button onClick={onBack}>Go back</button>}
  </div>
</section>
```

- [ ] **Step 3: Replace jargon at call sites**

Use copy such as:

```tsx
<ErrorMessage
  title='This page link is not valid'
  description='Go back and open the page again.'
  onBack={() => navigate(-1)}
/>
```

For query failures use `We couldn't load this page right now. Check your connection and try again.` plus retry. For permission use `You don't have permission to view this page. Return to your dashboard.`

- [ ] **Step 4: Verify**

Run: `pnpm lint`, `pnpm type-check`, `pnpm build`

Expected: PASS; no production page renders `Error 400`, `Error 403`, `Error 404`, `Bad Request`, or `Forbidden` as its primary user-facing message.

- [ ] **Step 5: Commit**

```bash
git add src/components/utilities/ErrorMessage.tsx src/pages/PhysicalFitnessTestPage.tsx src/pages/PhysicalFitnessTestSummary.tsx src/pages/LecturePage.tsx src/pages/Auth/AccountVerification.tsx src/pages/Dashboard/ViewClass.tsx
git commit -m "feat: add actionable friendly error pages"
```

### Task 5: Surface Quiz and Lecture Query Failures

**Files:**
- Modify: `src/pages/QuizDashboard.tsx:32-46,84-102`
- Modify: `src/pages/LecturesIntroduction.tsx:26-37`
- Modify: `src/pages/LecturePage.tsx:27-39`
- Modify: `src/queries/dashboard-queries.ts:5-142`
- Modify: `src/services/getStudentDataByClassCode.ts:5-16`
- Modify: `src/pages/Dashboard/ViewClass.tsx:60-81,142-143`

**Interfaces:** Query functions throw original errors after logging; page components use `isError`, `refetch`, and `getUserFacingError(error, 'load')`. Valid empty arrays remain valid success results.

- [ ] **Step 1: Change silent fallback queries to throw**

For lecture progress, replace:

```ts
if (error || !data?.lecture_progress) return LectureProgress();
```

with:

```ts
if (error) throw error;
if (!data?.lecture_progress) return LectureProgress();
```

Apply the same distinction to dashboard queries and roster loading: throw on request failure; return empty/default only when the successful response is legitimately empty.

- [ ] **Step 2: Add explicit query error branches**

Read `isError`, `error`, and `refetch`. Before the successful empty state, render:

```tsx
if (isError) {
  return (
    <ErrorMessage
      title="We couldn't load your quizzes"
      description="Check your connection and try again."
      onRetry={() => void refetch()}
    />
  );
}
```

Use equivalent lecture, dashboard, and roster copy. Keep `No Available Data` only after a successful request.

- [ ] **Step 3: Verify**

Run: `pnpm test`, `pnpm lint`, `pnpm type-check`, `pnpm build`

Expected: PASS; mocked/reproducible rejected queries display an error state instead of zero progress, default progress, empty roster, or `No Available Data`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/QuizDashboard.tsx src/pages/LecturesIntroduction.tsx src/pages/LecturePage.tsx src/queries/dashboard-queries.ts src/services/getStudentDataByClassCode.ts src/pages/Dashboard/ViewClass.tsx
git commit -m "fix: surface query failures instead of empty data"
```

### Task 6: Show Profile Upload and Logout Outcomes

**Files:**
- Modify: `src/utilities/onProfileChange.ts:24-56`
- Modify: `src/pages/Dashboard/StudentDashboard.tsx:123-130`
- Modify: `src/pages/Dashboard/TeacherDashboard.tsx:44-81`
- Modify: `src/store/auth-store.ts:43-52`

**Interfaces:** `onProfileChange` returns `{ success: true } | { success: false; error: string }`, where `error` is always safe user-facing copy. `logout(): Promise<{ remoteSignOutSucceeded: boolean }>` retains local cleanup even when remote sign-out fails.

- [ ] **Step 1: Make profile upload errors safe**

Log the original storage error, then return:

```ts
return { success: false, error: getUserFacingError(error, 'profile-upload') };
```

Keep validation messages because they already explain the correction.

- [ ] **Step 2: Display the upload result**

In both dashboard handlers:

```ts
const result = await onProfileChangeUtil(userID, file, fileName);
if (result.success) toast.success('Your profile picture was updated.');
else toast.error(result.error);
```

- [ ] **Step 3: Return logout outcome and warn when needed**

In `auth-store.ts`, set `remoteSignOutSucceeded = true`, set it to false in the catch, always clear local state, and return it. In each dashboard caller, show:

```ts
const result = await logout();
if (!result.remoteSignOutSucceeded) {
  toast.warning("You were signed out on this device, but we couldn't confirm it with the server.");
}
navigate('/auth/login', { replace: true });
```

- [ ] **Step 4: Verify and commit**

Run: `pnpm test`, `pnpm lint`, `pnpm type-check`

```bash
git add src/utilities/onProfileChange.ts src/pages/Dashboard/StudentDashboard.tsx src/pages/Dashboard/TeacherDashboard.tsx src/store/auth-store.ts
git commit -m "fix: report profile upload and logout outcomes"
```

### Task 7: Add a Throttled Quiz Timer-Sync Warning

**Files:**
- Modify: `src/components/quiz/Timer.tsx:19-48`
- Modify: `src/components/quiz/quiz-game.tsx:27-31,155-160`

**Interfaces:** `Timer` accepts optional `onSyncError?: () => void`, called at most once per quiz timer instance until a successful sync. `QuizGame` owns the warning display so the timer remains responsible only for timing and persistence.

- [ ] **Step 1: Add the callback and failure guard**

Add a `hasReportedSyncError` ref. On failed `updateRemainingTime`, log and call `onSyncError` only when false. On a successful update, reset it to false.

- [ ] **Step 2: Render one non-blocking warning**

In `QuizGame`, keep `timerSyncError` state and pass:

```tsx
onSyncError={() => setTimerSyncError(true)}
```

Render an accessible warning near the timer:

```tsx
{timerSyncError && (
  <p role='status' className='text-red text-sm'>
    Your remaining time couldn't be saved. Check your connection and keep this page open while we try again.
  </p>
)}
```

- [ ] **Step 3: Verify and commit**

Run: `pnpm test`, `pnpm lint`, `pnpm type-check`

Expected: one warning per failure period, not one toast per second; timer behavior remains unchanged.

```bash
git add src/components/quiz/Timer.tsx src/components/quiz/quiz-game.tsx
git commit -m "fix: show quiz timer sync failures"
```

### Task 8: Add Regression Coverage and Run the Full Verification Suite

**Files:**
- Modify: `src/utilities/__tests__/user-facing-errors.test.ts`
- Modify: `e2e/tests/auth/auth.spec.ts` if stable test fixtures permit auth error assertions
- Modify: affected component tests only if a React test harness is added by the existing project setup; do not add a new test framework.

- [ ] **Step 1: Add mapper regression cases**

Cover every context in the mapper, especially raw strings containing `Failed to fetch`, SQL text, PostgREST codes, rate limits, permission errors, and unknown objects. Assert returned copy never contains the technical input.

- [ ] **Step 2: Add the smallest UI regression coverage available**

If component rendering is already configured, test that a rejected quiz query renders `We couldn't load your quizzes` and that the retry handler is present. If not configured, add E2E coverage for the login invalid-credentials path and verify the page does not contain `Failed to fetch`, `AuthApiError`, or raw provider text.

- [ ] **Step 3: Run all checks**

Run in order:

```bash
pnpm test
pnpm lint
pnpm type-check
pnpm build
pnpm test:e2e
```

Expected: all commands pass. If E2E requires unavailable environment variables or test accounts, record the exact blocker and run the other four checks.

- [ ] **Step 4: Final repository sweep**

Run:

```bash
rg -n "error\\.message|String\\(error\\)|Error 400|Error 403|Error 404|Bad Request|Forbidden|Failed to fetch" src supabase
```

Expected: remaining matches are limited to internal logging, tests, comparisons used by the mapper, or comments. Any UI-rendered match must be fixed before release.

- [ ] **Step 5: Commit**

```bash
git add src e2e
git commit -m "test: cover friendly error handling"
```

---

## Self-Review

- Audit finding 1 is covered by Tasks 1 and 2.
- Audit finding 2 is covered by Tasks 1 and 2.
- Audit finding 3 is covered by Tasks 1 and 3.
- Audit finding 4 is covered by Tasks 1 and 2.
- Audit finding 5 is covered by Task 5.
- Audit finding 6 is covered by Task 5.
- Audit finding 7 is covered by Task 5.
- Audit finding 8 is covered by Task 4.
- Audit finding 9 is covered by Task 6.
- Audit finding 10 is covered by Task 6.
- Audit finding 11 is covered by Task 7.
- Regression and final verification are covered by Task 8.

No new dependencies, unimplemented placeholders, or unspecified error-copy decisions are required by this plan.
