## Goal

Require students to be actively enrolled in a class before they can use lectures, quizzes, or the PFT. Keep lecture and quiz progress student-owned, while storing PFT sessions per student and class code so leaving a class starts a blank PFT and rejoining the same active class restores its prior PFT.

## Source Of Truth

- User requirements from this conversation, September 2, 2026.
- `src/mutations/class-mutations.ts`
- `src/queries/pft-queries.ts`
- `supabase/migrations/20260526083000_secure_student_data_access.sql`

## Non-Goals

- Do not make lectures or quiz progress class-scoped.
- Do not let a retired class code be recreated or reissued.
- Do not restore PFT data after a teacher retires a class; only a student leaving and rejoining the same still-active code restores it.
- Do not change teacher access to lectures, quizzes, or the PFT workflow.

## Execution Order

## PR Stacking Strategy

```
master
  └── feat/class-scoped-pft-schema-and-membership-rpcs
        └── feat/student-class-access-and-pft-client
              └── feat/class-membership-regression-tests
```

Merge in the order shown. The schema/RPC PR must land before client changes; use vanilla Git branches because no Graphite configuration is present.

## Linear Sub-Issue Tracking

Create sub-issues from this plan when ready.

### 1. Make class codes durable and membership changes atomic

- Touch `supabase/migrations/<timestamp>_class_scoped_pft_and_membership.sql`, `src/types/supabase.ts`, and `src/mutations/class-mutations.ts`.
- Add `retired_at` to `teacher_class_code` instead of deleting its row, preserving the code permanently; make active-code validation ignore retired codes while uniqueness checks include both active and retired codes.
- Replace direct updates to `student_class_code` with security-definer RPCs: join validates an active code, leave clears only the caller's membership, and retire verifies the teacher owns the active code, clears enrolled students' memberships, then timestamps the class as retired in one transaction.
- Create `class_physical_fitness_test` with `uuid`, `class_code`, pre/post PFT JSON, timestamps, a unique `(uuid, class_code)` constraint, and an FK to `teacher_class_code.class_code`; backfill each existing PFT only to the student's current active class, leaving ambiguous unassigned legacy records untouched rather than guessing their owner.
- Add RLS and helper functions so students can read/write only their own PFT row for their current active code, and teachers can read only PFT rows for students currently enrolled in one of their active classes.

### 2. Move PFT reads, writes, and teacher reports to the class-owned record

- Touch `src/queries/pft-queries.ts`, `src/mutations/pft-mutations.ts`, `src/queries/dashboard-queries.ts`, `src/queries/quiz-queries.ts`, `src/services/getStudentDataByClassCode.ts`, `src/types/student.ts`, `src/types/supabase.ts`, and the PFT-related pages/components that call these helpers.
- Fetch and save PFT by authenticated student plus current class code; a missing membership returns no active PFT, and joining a new code naturally creates a blank row on the first save while rejoining the same active code retrieves the prior row.
- Include the active class code in `pftKeys` so React Query cannot briefly reuse the previous class's PFT; invalidate class and PFT queries after a successful join, leave, or class retirement.
- Update `get_pft_summary_for_viewer` and `retrieve_students_by_class` to select `class_physical_fitness_test` by both student and requested class code, while leaving their existing teacher-ownership checks intact.
- Keep the existing `physical_fitness_test` table read-only during the migration window, then remove it only in a later cleanup migration after production backfill verification.

### 3. Gate student learning routes and expose a clear blocked state

- Touch `src/App.tsx`, `src/components/Sidebar.tsx`, add `src/components/auth/StudentClassAccess.tsx`, and add a small membership query/helper beside `src/queries/dashboard-queries.ts` if the route guard needs one.
- Wrap `/lectures/**`, `/quizzes/**`, and `/physical-fitness-test/**` in a student-class guard: teachers pass through, enrolled students pass through, and unenrolled students see the requested access page with a direct Dashboard/Join Class action instead of a redirect.
- Disable or visually mark the three restricted sidebar entries for unenrolled students, while keeping the route guard as the authoritative UI barrier for pasted URLs and stale tabs.
- Enforce the same rule in the database policies/RPCs from phase 1 so a modified browser client cannot read quiz questions, write progress, or access a PFT without current membership.

### 4. Add teacher retirement confirmation and membership-aware UI updates

- Touch `src/pages/Dashboard/TeacherDashboard.tsx`, `src/components/dashboard/ClassCode.tsx`, `src/pages/Dashboard/StudentDashboard.tsx`, and `src/mutations/class-mutations.ts`.
- Require a two-step confirmation before retiring a class. The confirmation must state that enrolled students immediately lose access to lectures, quizzes, and PFT; their quiz/lecture history remains student-owned; their PFT remains retained but inactive under the retired class code.
- Call the retirement RPC rather than deleting `teacher_class_code`, invalidate the teacher's class list and affected class views, and show a success/error toast.
- After a student leaves, clear in-memory PFT session state and invalidate membership/PFT queries; do not alter quiz or lecture progress.

### 5. Verify the security and lifecycle rules

- Touch `supabase/tests/database/class_membership_and_pft.sql`, `src/lib/__tests__/query-keys.test.ts`, and add focused tests next to the new route guard if the project test setup supports component tests.
- Cover: unenrolled student reads/writes are rejected; joining creates access; leaving blocks access and selects no active PFT; rejoining the same active code restores its PFT; joining another code starts blank; teacher retirement clears memberships; retired codes cannot be joined or regenerated; teachers see only PFT data for their current class.
- Run `pnpm lint`, `pnpm build`, the applicable Vitest command discovered from `package.json`, and the Supabase database test command used by this repository.

## Acceptance Criteria

- A student without a class code sees an access page, not learning/PFT content, for every restricted route including direct URLs.
- Quiz and lecture progress persist across every join, leave, and class retirement event.
- Leaving a class removes the student's active PFT; rejoining that same active code restores the exact prior PFT.
- Joining a different class presents a blank PFT and never exposes the other class's PFT.
- Retiring a class requires confirmation, clears current student memberships, preserves historical class PFT rows, and permanently retires its code.
- RLS/RPC enforcement matches the UI so membership cannot be bypassed through Supabase client calls.
