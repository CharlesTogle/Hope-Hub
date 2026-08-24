# Computation Quiz Timing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every quiz question whose type is `computation` five minutes (300 seconds) without changing the existing timer, scoring, or progress persistence contracts.

**Architecture:** Add `computation` to the shared quiz question type and normalize its duration at the quiz-question loading boundary. Normalize both freshly shuffled questions and `questions_shuffled` loaded from progress, so all downstream consumers (`Quiz.tsx`, `quiz-game.tsx`, `Timer.tsx`, and `calculatePoints`) receive the same duration. Existing saved `remaining_time` remains the authoritative countdown when resuming an active question; the new duration applies to new attempts and subsequent questions.

**Tech Stack:** React 19, TypeScript, Zustand, Supabase, Vitest, Playwright.

## Global Constraints

- Store quiz durations in seconds; five minutes is exactly `300`.
- Do not add a database migration or dependency; question JSON and existing progress fields already support this behavior.
- Do not change `Timer.tsx`, `quiz-mutations.ts`, or `calculatePoints`; they already consume a per-question duration and persist remaining seconds.
- Preserve the existing duration for all non-computation question types.
- Preserve saved `remaining_time` when resuming an in-progress quiz; do not silently restart an active question.

## Files And Responsibilities

- Modify `src/types/quiz.ts`: allow `computation` as a question type.
- Create `src/lib/quiz-timing.ts`: define the five-minute computation duration rule.
- Modify `src/queries/quiz-queries.ts`: normalize computation durations for both fresh and persisted shuffled question arrays.
- Create `src/lib/__tests__/quiz-timing.test.ts`: verify the duration policy and non-computation behavior.
- Modify `e2e/tests/quizzes/quizzes.spec.ts`: verify a computation question renders with a 300-second timer.

### Task 1: Define And Test The Timing Policy

**Files:**
- Modify: `src/types/quiz.ts:9-15`
- Create: `src/lib/quiz-timing.ts`
- Create: `src/lib/__tests__/quiz-timing.test.ts`

**Interfaces:**
- Produces `QuizQuestion['type']` support for `'computation'`.
- Produces a tested timing rule: computation duration is `300`; other durations are unchanged.

- [ ] **Step 1: Extend the quiz question type**

Change the union in `src/types/quiz.ts` from:

```ts
type: 'multiple-choice' | 'identification';
```

to:

```ts
type: 'multiple-choice' | 'identification' | 'computation';
```

- [ ] **Step 2: Add the failing policy test**

Create `src/lib/__tests__/quiz-timing.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { getQuizQuestionDuration } from '@/lib/quiz-timing';

describe('getQuizQuestionDuration', () => {
  it('gives computation questions five minutes', () => {
    expect(
      getQuizQuestionDuration({ type: 'computation', duration: 30 }),
    ).toBe(300);
  });

  it('preserves the configured duration for other question types', () => {
    expect(
      getQuizQuestionDuration({ type: 'multiple-choice', duration: 45 }),
    ).toBe(45);
    expect(
      getQuizQuestionDuration({ type: 'identification', duration: 60 }),
    ).toBe(60);
  });
});
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run: `pnpm vitest run src/lib/__tests__/quiz-timing.test.ts`

Expected: FAIL because `src/lib/quiz-timing.ts` does not exist yet.

- [ ] **Step 4: Implement the minimal policy helper**

Create `src/lib/quiz-timing.ts`:

```ts
import type { QuizQuestion } from '@/types/quiz';

export const COMPUTATION_QUESTION_DURATION = 5 * 60;

export function getQuizQuestionDuration(
  question: Pick<QuizQuestion, 'type' | 'duration'>,
): number {
  return question.type === 'computation'
    ? COMPUTATION_QUESTION_DURATION
    : question.duration;
}
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run: `pnpm vitest run src/lib/__tests__/quiz-timing.test.ts`

Expected: PASS.

### Task 2: Normalize Fresh And Resumed Quiz Questions

**Files:**
- Modify: `src/queries/quiz-queries.ts:99-131`

**Interfaces:**
- Consumes `getQuizQuestionDuration(question)` from `src/lib/quiz-timing.ts`.
- Produces `QuizQuestion[]` where computation questions always have `duration: 300`.

- [ ] **Step 1: Add a normalization function beside the existing shuffle helper**

Add:

```ts
function normalizeQuizQuestionDurations(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((question) => ({
    ...question,
    duration: getQuizQuestionDuration(question),
  }));
}
```

Import `getQuizQuestionDuration` from `@/lib/quiz-timing`.

- [ ] **Step 2: Apply normalization after either persisted or fresh questions are selected**

Update `fetchQuizQuestions` so fresh questions are normalized before being saved, and persisted questions are normalized before being returned:

```ts
  if (!questions) {
    questions = normalizeQuizQuestionDurations(
      shuffleQuizQuestionsAndChoices(await getQuestionsFromQuiz(quizId)),
    );
    if (userType === 'student') {
      await supabase
        .from('quiz_progress')
        .update({
          start_time: new Date().toISOString(),
          questions_shuffled: questions,
        })
        .eq('user_id', user.id)
        .eq('quiz_id', quizId);
    }
  } else {
    questions = normalizeQuizQuestionDurations(questions);
  }

  return questions;
```

Keep the normalization before the return for both branches. New `questions_shuffled` snapshots therefore contain `duration: 300`; resumed snapshots are normalized in memory without an unrelated database write.

- [ ] **Step 3: Run type-check and focused tests**

Run: `pnpm type-check`

Expected: PASS with `computation` accepted anywhere a `QuizQuestion` is constructed.

Run: `pnpm vitest run src/lib/__tests__/quiz-timing.test.ts`

Expected: PASS.

### Task 3: Add Regression Coverage For The Rendered Timer

**Files:**
- Modify: `e2e/tests/quizzes/quizzes.spec.ts:142-156`

**Interfaces:**
- Consumes the existing `mockQuizData` route and quiz page.
- Verifies the user-visible timer receives the normalized duration without waiting five minutes.

- [ ] **Step 1: Add a computation question fixture with a stale duration**

Add a separate computation-only quiz-page fixture, or replace the local fixture for the new test, with:

```ts
{
  type: 'computation',
  question: 'Calculate the training load.',
  answer: '100',
  duration: 30,
}
```

Keep the existing multiple-choice fixture at `duration: 30` so the test confirms only computation timing changes.

- [ ] **Step 2: Add a page assertion for 300 seconds**

Add a test in `test.describe('Quiz Page', ...)` that loads a pending quiz using the computation fixture and asserts:

```ts
await expect(page.getByText('300 seconds')).toBeVisible();
```

Use the existing `setAuthSession`, `mockQuizData`, and pending progress setup. The assertion should run after `page.waitForLoadState('load')`.

- [ ] **Step 3: Run the quiz end-to-end tests**

Run: `pnpm test:e2e -- e2e/tests/quizzes/quizzes.spec.ts`

Expected: all quiz dashboard and quiz-page tests pass, including the new `300 seconds` assertion.

### Task 4: Full Verification And Review

**Files:**
- No additional files.

- [ ] **Step 1: Run lint**

Run: `pnpm lint`

Expected: PASS with no new lint errors.

- [ ] **Step 2: Run all unit tests**

Run: `pnpm test`

Expected: PASS.

- [ ] **Step 3: Run the production build**

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 4: Review the affected flow**

Confirm all of the following before merging:

- Computation questions are accepted by TypeScript.
- Fresh computation questions are returned with `duration: 300`.
- Persisted shuffled computation questions are also returned with `duration: 300`.
- New quiz state starts at 300 seconds for a computation first question.
- Moving to the next computation question uses 300 seconds through the existing `quiz-game.tsx` logic.
- `Timer.tsx` still persists remaining seconds and auto-submits as before.
- `calculatePoints` receives 300 as `totalTime` for computation questions.
- Resuming an active quiz preserves its saved `remaining_time` rather than resetting it.

## Self-Review

- **Spec coverage:** The five-minute computation rule is covered by unit and end-to-end tests; fresh, shuffled, resumed, scoring, and persistence paths are explicitly addressed.
- **Placeholder scan:** No implementation step is left as TBD, TODO, or “write tests later.”
- **Type consistency:** `QuizQuestion['type']`, `getQuizQuestionDuration`, normalization, and fixtures all use the same `'computation'` literal and seconds-based `number` duration.
