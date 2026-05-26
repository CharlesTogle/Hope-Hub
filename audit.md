# Hope Hub Repository Audit

**Date:** 2026-05-26
**Scope:** Whole-repo audit of non-ignored source, config, schema, and test files in `/home/charles/Documents/Work/Hope-Hub` using the root `.gitignore`; binary/media assets were excluded from detailed analysis. Static verification included `pnpm lint`, `pnpm type-check`, and `pnpm build`.

---

## Overall Score

| Category | ERRORs | WARNINGs |
|----------|--------|----------|
| Security | 3 | 0 |
| Data Integrity | 1 | 0 |
| Performance | 0 | 2 |
| Code Quality | 0 | 1 |
| Error Handling | 0 | 1 |
| Logic | 0 | 2 |
| DevOps | 0 | 2 |
| **Total** | **4** | **8** |

---

## CRITICAL

### 1. Database RLS exposes every student's PII, progress, class membership, and fitness records to the public API

**Severity:** ERROR — Security  
**Files:** `db/schema.sql:511-553`, `db/schema.sql:616-652`, `src/client/supabase.ts:6-17`, `README.md:118-123`

The schema enables row-level security, but the actual `SELECT` policies are wide open:

```sql
CREATE POLICY "Enable read access for all users" ON public.profile FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.quiz_progress FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.physical_fitness_test FOR SELECT USING (true);
```

Because this app ships the Supabase project URL and anon key to the browser, these policies turn the REST API into a directory of all profiles, quiz scores, lecture progress, class-code mappings, and physical-fitness data. In Postgres, omitting `TO ...` means the policy applies to `PUBLIC`, so this is not limited to the owner of the row.

**Risk:** Any caller that can hit the Supabase API can enumerate or scrape student names, emails, UUIDs, class relationships, quiz performance, and PFT results. This is a direct privacy breach.

**Fix:** Replace every `USING (true)` read policy on user-owned tables with owner-scoped rules such as `auth.uid() = uuid` / `auth.uid() = user_id`, and move teacher aggregate access behind narrow `SECURITY DEFINER` RPCs that verify class ownership.

---

### 2. Write policies let users forge teacher ownership, mutate quiz data, and tamper with quiz progress

**Severity:** ERROR — Security  
**Files:** `db/schema.sql:490`, `db/schema.sql:504`, `db/schema.sql:546-553`, `db/schema.sql:602-609`, `supabase/migrations/20260419233014_fix_retrieve_students_tenant_isolation.sql:20-25`

Several write policies are effectively open:

```sql
CREATE POLICY ... ON public.quiz_progress FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ... ON public.teacher_class_code FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ... ON public.quiz FOR UPDATE USING (true);
CREATE POLICY ... ON public.quiz_progress FOR UPDATE USING (true);
```

This means an authenticated user can at minimum:

- Insert arbitrary `quiz_progress` rows for any `user_id`
- Insert `teacher_class_code` rows for their own UUID or another UUID
- Discover class codes through the globally readable `student_class_code` / `teacher_class_code` tables
- Satisfy the migration's teacher-ownership check simply by inserting a matching `teacher_class_code` row for themselves

If the standard Supabase browser roles retain table update grants, the open `quiz` and `quiz_progress` update policies also allow direct mutation of quiz definitions and scores.

**Risk:** Students can self-grant teacher-style ownership over classes, read class rosters through the RPC, and forge or rewrite quiz state. This breaks both authorization and data integrity.

**Fix:** Lock insert/update policies to the owning user, add role checks against `profile.user_type`, and remove direct client write access to shared tables such as `quiz`. Sensitive writes should go through audited RPCs or server code.

---

## HIGH

### 3. The PFT summary page is an IDOR over `?student=<uuid>`

**Severity:** ERROR — Security  
**Files:** `src/components/dashboard/ViewClass/Table.tsx:19-27`, `src/App.tsx:260-275`, `src/pages/PhysicalFitnessTestSummary.tsx:20-56`, `db/schema.sql:518-525`

Teachers navigate to student summaries by appending a raw UUID in the query string:

```ts
navigate(`/physical-fitness-test/summary/${summaryType}?student=${student.uuid}`);
```

The route itself is not teacher-only; it sits under the general authenticated area. The summary page then trusts any `student` query param and only checks whether that UUID exists before loading `profile(full_name, email)` and `physical_fitness_test` for that target user.

**Risk:** Any authenticated user can manually visit `/physical-fitness-test/summary/pre-test?student=<another-user-uuid>` and retrieve another student's personal data and PFT history. The open schema read policies make this work end to end.

**Fix:** Restrict this route to teachers, require a verified teacher-to-student class relationship before loading target data, and never treat a raw UUID query param as sufficient authorization.

---

### 4. Class-code uniqueness is enforced only in application code and is race-prone

**Severity:** ERROR — Data Integrity  
**Files:** `db/schema.sql:308-315`, `src/mutations/class-mutations.ts:64-112`

`teacher_class_code.class_code` has no `UNIQUE` constraint in the schema. The frontend tries to compensate by:

1. generating a random code,
2. checking whether it exists,
3. inserting it if the preflight query returned empty.

That is a classic check-then-insert race. Two concurrent requests can both observe "available" and both insert the same class code successfully.

**Risk:** Duplicate class codes collapse tenant boundaries, make ownership ambiguous, and can cause students to join or be exported from the wrong class.

**Fix:** Add a database-level unique constraint on `teacher_class_code.class_code`, generate the code server-side if possible, and retry on unique-violation errors instead of trusting a preflight read.

---

## MEDIUM

### 5. The repository has two conflicting versions of `retrieve_students_by_class`, and the insecure one is still in the schema dump

**Severity:** WARNING — DevOps  
**Files:** `db/schema.sql:108-135`, `supabase/migrations/20260419233014_fix_retrieve_students_tenant_isolation.sql:1-26`, `README.md:137-147`

`db/schema.sql` still defines `retrieve_students_by_class` without tenant verification or `SECURITY DEFINER`, while the migration adds the missing ownership check. The README then says the schema dump is "current" and that the repo does not have an ordered migration set.

**Risk:** Anyone restoring or reviewing from `db/schema.sql` can reintroduce the cross-class data leak, and there is no authoritative migration history that proves which version production should be running.

**Fix:** Make migrations authoritative, regenerate `db/schema.sql` from the migrated database, and delete or clearly mark any stale dump that no longer reflects the expected security posture.

---

### 6. Password-reset links are pinned to one hard-coded deployment URL

**Severity:** WARNING — Logic  
**Files:** `src/pages/Auth/ForgotPassword.tsx:88-90`, `src/pages/Auth/Register.tsx:150-156`

Registration uses `VITE_APP_URL` for its verification redirect, but password reset uses a single hard-coded domain:

```ts
redirectTo: 'https://hope-hub-dcvm.vercel.app/auth/change-password'
```

**Risk:** Password-reset emails will likely send users to the wrong site in any environment other than that exact Vercel deployment, which strands recovery flows and creates environment drift between auth features.

**Fix:** Use the same environment-driven base URL as registration, or derive the origin from configuration shared across all auth flows.

---

### 7. “Remember me” is applied after authentication, so the session can persist to the wrong storage backend

**Severity:** WARNING — Logic  
**Files:** `src/client/supabase.ts:4-15`, `src/pages/Auth/Login.tsx:117-130`

The Supabase client chooses `localStorage` vs `sessionStorage` once, at module import time:

```ts
const rememberMe = localStorage.getItem('rememberMe') === 'true';
storage: rememberMe ? localStorage : sessionStorage,
```

The checkbox value is not written until after `signInWithPassword()` succeeds.

**Risk:** On the first login after changing the checkbox, the session is stored using the old persistence mode. Users can ask for a persistent session and still get session-only auth, or uncheck persistence and keep getting local persistence until a reload.

**Fix:** Persist the preference before starting auth, or construct/reconstruct the client after the preference is known so the storage backend matches the current choice.

---

### 8. Student Excel export performs 2N sequential PFT reads

**Severity:** WARNING — Performance  
**Files:** `src/utilities/exportStudentExcel.ts:10-34`, `src/utilities/exportStudentExcel.ts:182-242`

`generateStudentExcel()` loops over students and, for each student, may call `getDetailedPFTData()` twice: once for pre-test and once for post-test. Each helper call performs its own `physical_fitness_test` query.

**Risk:** Export cost scales as `1 class export + up to 2 queries per student`. A 50-student class can trigger roughly 100 extra round-trips, making exports slow and increasing the chance of throttling or transient failures.

**Fix:** Fetch all required PFT rows in one query with `in('uuid', [...])`, build a lookup map, and render the spreadsheet from in-memory data.

---

### 9. Quiz dashboard ranking does a query per quiz

**Severity:** WARNING — Performance  
**Files:** `src/lib/quiz-state.ts:62-72`, `src/queries/quiz-queries.ts:148-159`

`extractQuizDetails()` awaits `getUserRanking()` inside a `for...of` loop. `getUserRanking()` performs a full `quiz_progress` query for each quiz.

**Risk:** Completed-quiz dashboards scale as `1 base quiz fetch + N ranking queries`, which becomes noticeably slower as more quizzes are added and repeatedly re-scans the same table.

**Fix:** Fetch leaderboard/rank data in one batched query, or compute the current user's rank from already fetched progress rows instead of round-tripping once per quiz.

---

## LOW

### 10. The font asset pipeline is broken in production builds and currently duplicates font-loading strategies

**Severity:** WARNING — Code Quality  
**Files:** `src/styles/global.css:5-9`, `src/assets/fonts/fonts.css:4-148`

The app imports both self-hosted font files and Google Fonts. On `pnpm build`, Vite reported unresolved font assets for the local `Poppins`, `Montserrat`, and `Marcellus` URLs, and the resulting `dist/` output did not contain matching emitted font files.

There is also a likely bad path for Marcellus:

```css
src: url('./Marcellus/MarcellusSC-Regular.ttf')
```

while the repo stores that font under `Marcellus_SC/`.

**Risk:** Production will 404 local font requests, fall back unpredictably, and keep the extra remote-font dependency that your Playwright fixtures already have to block for stability.

**Fix:** Pick one font-loading strategy, correct the Marcellus path, and ensure Vite emits local assets by importing them in a way the bundler understands or by serving them from `public/`.

---

### 11. The committed Supabase edge functions are not deployable as-is and would leak raw backend errors if they were

**Severity:** WARNING — DevOps  
**Files:** `supabase/functions/login/index.ts:6`, `supabase/functions/login/index.ts:87-96`, `supabase/functions/registration/index.ts:6`, `supabase/functions/registration/index.ts:106-110`

Both edge functions import `../_shared/cors.ts`, but that file is missing from the repository. Their catch blocks also return `String(err)` / raw `err.message` directly to clients.

**Risk:** A fresh deployment of these functions will fail immediately, and a repaired deployment would still expose backend/provider error strings to callers instead of returning stable client-safe messages.

**Fix:** Add the missing shared module, run `deno check` in CI, and return generic client messages while logging detailed errors server-side.

---

### 12. Class roster RPC failures are silently converted into “empty class” responses

**Severity:** WARNING — Error Handling  
**Files:** `src/services/getStudentDataByClassCode.ts:7-14`

`getStudentsByClassCode()` catches any RPC failure by returning `[]`:

```ts
if (error) {
  return [];
}
```

**Risk:** Permission failures, tenant-isolation exceptions, networking problems, and backend regressions become indistinguishable from a legitimately empty class. That hides broken access control and makes operational issues much harder to notice.

**Fix:** Propagate a typed error to the React Query layer and render an explicit error state or toast so authorization failures and outages are visible.

---

## Files With Zero Violations

- `src/lib/query-keys.ts`
- `src/lib/pft-session.ts`
- `src/lib/utils.ts`
- `src/client/youtube.ts`
- `e2e/fixtures/index.ts`

---

## Things that we're done correctly

- `vercel.json:8-40` adds explicit security headers instead of relying on hosting defaults, including `nosniff`, a referrer policy, a permissions policy, and a CSP.
- `e2e/fixtures/index.ts:50-61` automatically blocks external font requests for every Playwright test, which is a concrete safeguard against the CDN-related flakiness documented in your team experiences.
- `src/client/youtube.ts:17-39` wraps outbound YouTube requests with an `AbortController` timeout and clears the timer in `finally`, which prevents hung requests from lingering indefinitely.
- `src/lib/query-keys.ts:1-33` centralizes React Query keys, reducing cache-key drift and making invalidation behavior easier to reason about.

---

## Priority Fix Roadmap

1. Lock down the database first.
Replace every `USING (true)` / `WITH CHECK (true)` policy on user-owned tables, remove direct client writes to shared tables, and add DB-enforced uniqueness for class codes.

2. Fix the privilege-escalation and IDOR paths.
Require server-verified teacher ownership for class and student-summary access, and stop authorizing sensitive reads from raw UUID query params.

3. Reconcile the Supabase source of truth.
Make migrations authoritative, regenerate the schema dump, and add CI checks for schema drift and edge-function deployability.

4. Remove the most expensive repeated reads.
Batch PFT export data and quiz-ranking lookups so dashboards and exports do not issue N+1 request patterns.

5. Normalize auth and asset configuration.
Unify redirect URLs across auth flows, fix the remember-me storage timing, and repair the font pipeline so builds do not emit broken asset references.

---

Generated on 2026-05-26. Heuristic N+1 analysis was included. Static verification on this audit run: `pnpm lint` passed, `pnpm type-check` passed, and `pnpm build` passed with unresolved-font and large-chunk warnings.
