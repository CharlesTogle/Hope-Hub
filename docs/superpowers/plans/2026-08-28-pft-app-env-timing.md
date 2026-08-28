# Physical Fitness `VITE_APP_ENV` Timing Bypass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Vite-exposed `VITE_APP_ENV` environment switch so `VITE_APP_ENV=DEV` skips physical-fitness time validation while normal environments retain the production timing rules.

**Architecture:** Read `import.meta.env.VITE_APP_ENV` through Vite's default environment mechanism and pass the resulting boolean into a small pure timing-validation helper. The helper will decide whether the current-time and minimum-duration checks apply; the component will continue to own alerts, persistence, and navigation.

**Tech Stack:** React 19, TypeScript, Vite, Vitest.

## Global Constraints

- Only the exact value `DEV` enables the bypass; unset, `dev`, and every other value remain production behavior.
- The bypass applies only to physical-fitness timing validation, not required-field validation, persistence, navigation, or the maximum-duration check unless the existing rule is explicitly classified as part of the requested time-end verification.
- Do not read or commit `.env` or `.env.local` values; add configuration documentation only where the repository already documents environment variables.
- Clarify the direction of the current-time comparison before implementation: this checkout currently has no `timeEnd` versus current-time check, and “time end < current time” is ambiguous for a validation rule.

---

### Task 1: Define Tested Timing Decisions

**Files:**
- Create: `src/lib/pft-timing.ts`
- Test: `src/lib/__tests__/pft-timing.test.ts`

**Interfaces:**
- Produces `shouldValidatePftTiming(appEnv: string | undefined): boolean` and `getPftTimingValidation(...)` for the PFT component.

- [ ] **Step 1: Write failing tests for environment matching**

```ts
import { describe, expect, it } from 'vitest';
import { shouldValidatePftTiming } from '@/lib/pft-timing';

describe('shouldValidatePftTiming', () => {
  it('skips timing validation only for VITE_APP_ENV=DEV', () => {
    expect(shouldValidatePftTiming('DEV')).toBe(false);
  });

  it('keeps timing validation for unset and non-DEV values', () => {
    expect(shouldValidatePftTiming(undefined)).toBe(true);
    expect(shouldValidatePftTiming('dev')).toBe(true);
    expect(shouldValidatePftTiming('PROD')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm test -- src/lib/__tests__/pft-timing.test.ts`

Expected: FAIL because `src/lib/pft-timing.ts` does not yet export `shouldValidatePftTiming`.

- [ ] **Step 3: Add the minimal environment predicate**

```ts
export function shouldValidatePftTiming(appEnv: string | undefined): boolean {
  return appEnv !== 'DEV';
}
```

- [ ] **Step 4: Add production timing cases**

Test the existing duration rule with exact minute values: a 2-minute duration is invalid, a 3-minute duration is valid, and a BMI test remains exempt from the minimum-duration rule. Add cases for the agreed current-time rule using an injected `currentTimeInMinutes` value so tests do not depend on the wall clock. Add a `DEV` case proving the same invalid inputs return no timing error.

- [ ] **Step 5: Implement the pure validation helper**

Use a typed result such as:

```ts
export type PftTimingError = 'end-before-start' | 'too-short' | 'end-after-current-time' | 'too-long';

export function getPftTimingValidation(input: {
  appEnv: string | undefined;
  startTimeInMinutes: number;
  endTimeInMinutes: number;
  currentTimeInMinutes: number;
  isBmiTest: boolean;
}): PftTimingError | null {
  if (!shouldValidatePftTiming(input.appEnv)) return null;
  if (input.startTimeInMinutes > input.endTimeInMinutes) return 'end-before-start';
  // Use the confirmed current-time direction here.
  if (input.endTimeInMinutes > input.currentTimeInMinutes) return 'end-after-current-time';
  if (!input.isBmiTest && input.endTimeInMinutes - input.startTimeInMinutes < 3) return 'too-short';
  if (input.endTimeInMinutes - input.startTimeInMinutes > 20) return 'too-long';
  return null;
}
```

Adjust the threshold to match the agreed existing behavior if “less than 3 mins” means durations strictly below 3 minutes. The current component uses `<= 2`, which is equivalent for integer minute input.

- [ ] **Step 6: Run the focused tests and verify they pass**

Run: `pnpm test -- src/lib/__tests__/pft-timing.test.ts`

Expected: PASS with all environment and timing cases covered.

- [ ] **Step 7: Commit the tested timing module**

```bash
git add src/lib/pft-timing.ts src/lib/__tests__/pft-timing.test.ts
git commit -m "test: define physical fitness timing bypass"
```

### Task 2: Wire `VITE_APP_ENV` Into Physical-Fitness Submission

**Files:**
- Modify: `src/vite-env.d.ts:1`
- Modify: `src/components/physical-fitness-test/PhysicalFitnessTest.tsx:314-366`

**Interfaces:**
- Consumes `shouldValidatePftTiming` and `getPftTimingValidation` from `@/lib/pft-timing`.
- Produces the existing alert behavior and submission flow with timing validation bypassed only when `import.meta.env.VITE_APP_ENV === 'DEV'`.

- [ ] **Step 1: Add the Vite environment type**

Add an `ImportMetaEnv` augmentation after the existing Vite reference:

```ts
  readonly VITE_APP_ENV?: string;
```

Keep it optional so local builds without the variable type-check and retain production behavior.

- [ ] **Step 2: Replace inline timing branches with the helper result**

Inside `handleSubmit`, keep the empty-field guard unchanged, calculate `nowTime` once, call the helper with parsed start/end values and the current time, then map each returned error to the existing user-facing alert. Do not run the helper for teacher navigation, and do not alter session persistence.

- [ ] **Step 3: Verify `DEV` bypasses the requested checks**

Confirm the submit path allows an otherwise invalid end time and a duration under 3 minutes when `VITE_APP_ENV=DEV`, while still rejecting empty fields. Confirm the default/unset environment still shows the corresponding timing alert.

- [ ] **Step 4: Run repository verification**

Run: `pnpm test`

Expected: PASS.

Run: `pnpm type-check`

Expected: PASS with no unused imports or environment typing errors.

Run: `pnpm lint`

Expected: PASS.

Run: `pnpm build`

Expected: successful Vite production build.

- [ ] **Step 6: Commit the integration**

```bash
git add vite.config.ts src/vite-env.d.ts src/components/physical-fitness-test/PhysicalFitnessTest.tsx
git commit -m "feat: bypass pft timing checks in dev"
```

### Task 3: Document Local Configuration

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the opt-in setting**

Add a concise example without exposing any existing secret values:

```dotenv
VITE_APP_ENV=DEV
```

State that only `DEV` disables PFT timing validation and that the variable must be supplied to the Vite build/dev process.

- [ ] **Step 2: Verify the setting is build-visible**

Run: `VITE_APP_ENV=DEV pnpm build`

Expected: successful build. Run the normal build afterward if the environment is persisted by the shell or CI configuration.

- [ ] **Step 3: Commit documentation**

```bash
git add README.md
git commit -m "docs: describe pft dev timing environment"
```

## Self-Review Checklist

- The requested `DEV` bypass is covered by Task 1 and wired in Task 2.
- Empty-field validation remains active in `DEV`.
- Production behavior is tested for unset and non-`DEV` values.
- The plan does not assume a current-time check exists; implementation must resolve whether the intended production rule rejects an end time after now or an end time before now.
- No placeholder files, new dependencies, schema changes, or changes to unrelated quiz timing are required.
