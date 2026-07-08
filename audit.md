# Standards Compliance Audit - Hope Hub

**Date:** 2026-07-07
**Scope:** Best-effort repository audit of `/home/charles/Documents/Work/Hope-Hub`, focused on React/Vite client code, Supabase edge functions, and committed migrations. Local ignored `.env` files were detected but not treated as committed secrets.

---

## Overall Score

| Category | ERRORs | WARNINGs |
|----------|--------|----------|
| Security | 3 | 3 |
| Data Integrity | 1 | 1 |
| Performance | 1 | 2 |
| Code Quality | 0 | 1 |
| Error Handling | 1 | 1 |
| Testing | 0 | 1 |
| **Total** | **6** | **9** |

---

## CRITICAL - Must Fix Before Public Registration

---

### 1. Public Signup Lets Students Create Teacher Accounts and View Quiz Answers

**Severity:** ERROR - Security  
**Files:** `src/pages/Auth/Register.tsx:133-140`, `src/pages/Auth/Register.tsx:223-230`, `supabase/migrations/20260613000000_auto_create_profile_on_signup.sql:58-77`, `src/pages/Quiz.tsx:29-63`, `src/pages/Quiz.tsx:78-103`, `src/pages/Quiz.tsx:116-120`

Registration lets the browser choose `userType`, and the signup trigger trusts that metadata when creating the profile. The quiz page then treats `profile.user_type === 'teacher'` as permission to render the teacher preview, which displays all questions and answers.

```ts
// Register.tsx
userType: state.userType,
```

```sql
v_user_type := COALESCE(NEW.raw_user_meta_data ->> 'userType', 'student');
```

```tsx
if (userType === 'teacher') {
  return <TeacherQuizView quizId={quizId} />;
}
```

`TeacherQuizView` renders `Quiz Preview - All Questions & Answers`, including identification answers and `choice.isCorrect` markers.

**Risk:** A student can create a second account as a teacher, open quiz preview, copy the answers, then use them on a student account.

**Fix:** Do not allow public self-service teacher creation unless teachers are allowed to see answer keys before taking quizzes. Use an invite/admin approval flow for teacher accounts, or hide quiz answer keys from unverified teachers.

---

### 2. Edge Functions Leak Raw Auth/Internal Errors to Clients

**Severity:** ERROR - Security / Error Handling  
**Files:** `supabase/functions/registration/index.ts:106-116`, `supabase/functions/login/index.ts:87-96`

Both edge functions return raw caught error text to the caller.

```ts
return new Response(JSON.stringify({
  message: errorMessage
}), { status: 500 })
```

```ts
return new Response(JSON.stringify({
  message: String(err)
}), { status: 500 })
```

**Risk:** Supabase/Auth/Redis errors can reveal implementation details and make account probing easier.

**Fix:** Log the real error server-side with safe context, and return a generic message such as `Registration failed. Please try again.` or `Login failed. Please try again.`.

---

### 3. Registration/Login Rate Limiting Uses One Global Bucket

**Severity:** ERROR - Security / Availability  
**Files:** `supabase/functions/registration/index.ts:42-48`, `supabase/functions/login/index.ts:42-48`

Both functions rate-limit the constant identifier `api`.

```ts
const identifier = "api";
const { success } = await ratelimit.limit(identifier);
```

**Risk:** One abusive client can exhaust the shared bucket and block all users. It also does not create separate limits per IP, email, or account.

**Fix:** Build the key from request IP plus normalized email where available, for example `registration:${ip}` and `login:${ip}:${email.toLowerCase()}`.

---

## HIGH - Fix Before Scaling Real Users

---

### 4. PFT Writes Do Not Invalidate the Shared PFT Query Cache

**Severity:** ERROR - Data Integrity  
**Files:** `src/mutations/pft-mutations.ts:4-17`, `src/pages/PhysicalActivityReadinessQuestionnaire.tsx:104-108`, `src/pages/PhysicalFitnessTestPage.tsx:40-46`, `src/components/physical-fitness-test/PhysicalFitnessTest.tsx:278-286`

PFT pages read `pftKeys.session(userId)` through React Query, but `savePftSession` writes directly to Supabase and never invalidates or updates that query.

```ts
await savePftSession(userId, testType, updatedData);
```

**Risk:** After a write, later screens can derive pre/post status from stale cached data and send the next save to the wrong test column. This is the exact read/write cache failure class called out in the repo guidance.

**Fix:** Wrap PFT saves in a mutation or pass `queryClient` at the call site and run `queryClient.invalidateQueries({ queryKey: pftKeys.session(userId) })` after every successful save.

---

### 5. Class Roster RPC Uses Correlated Subqueries Per Student

**Severity:** ERROR - Performance  
**File:** `supabase/migrations/20260419233014_fix_retrieve_students_tenant_isolation.sql:28-62`

`retrieve_students_by_class` returns each student, then runs separate correlated subqueries for lecture progress, pre-PFT, post-PFT, and quiz data.

```sql
SELECT jsonb_agg(lp.lecture_progress) FROM lecture_progress lp WHERE lp.uuid = p.uuid
SELECT json_agg(pft.pre_physical_fitness_test) FROM physical_fitness_test pft WHERE pft.uuid = p.uuid
SELECT jsonb_agg(...) FROM quiz_progress qr WHERE qr.user_id = p.uuid
```

**Risk:** This is a database-side N+1 pattern: one class roster query performs multiple lookups per student, so teacher dashboards get slower as class size grows.

**Fix:** Pre-aggregate once with CTEs keyed by student UUID, then join those aggregates to the class roster.

---

### 6. Quiz Ranking Performs One Full Leaderboard Query Per Completed Quiz

**Severity:** WARNING - Performance  
**Files:** `src/lib/quiz-state.ts:61-72`, `src/queries/quiz-queries.ts:150-161`

`extractQuizDetails` calls `getUserRanking` for every completed quiz, and each call fetches every done row for that quiz before ranking in JavaScript.

```ts
await Promise.all(
  quizData.filter(...).map(async (q) => [q.id, String(await getUserRanking(q.id) ?? '')])
)
```

```ts
.select('user_id, score')
.eq('quiz_id', quizId)
.eq('status', 'Done')
.order('points', { ascending: false })
```

**Risk:** Dashboard load cost scales with completed quizzes times quiz submissions. Large classes will load many unnecessary rows.

**Fix:** Add an RPC using `rank() over (partition by quiz_id order by points desc)` for the current user across all quiz IDs, or fetch all relevant progress rows once and rank server-side.

---

## MEDIUM - Fix Soon

---

### 7. Client-Side Login Rate Limiter Is Easy to Bypass

**Severity:** WARNING - Security  
**Files:** `src/pages/Auth/Login.tsx:94-150`, `src/hooks/useRateLimiter.ts:16-49`

The active login form calls `supabase.auth.signInWithPassword` directly and only uses an in-memory `useRef` limiter.

```ts
const attemptCount = useRef(0);
```

**Risk:** Refreshing the page resets the counter. Automated login attempts can bypass this limiter entirely by calling Supabase Auth directly. Supabase may still have its own protections, but this app-level limiter should not be treated as security.

**Fix:** Route login through a server/edge function with per-IP/email rate limiting, or rely on documented Supabase Auth rate limits and remove the misleading client limiter.

---

### 8. Logs Include Sensitive User Context and Lose Error Details

**Severity:** WARNING - Security / Error Handling  
**Files:** `src/utilities/logger.ts:1-11`, `src/pages/Auth/Login.tsx:163-165`

The logger stringifies arbitrary `meta`, and login logs the user's email when profile loading fails.

```ts
logger.error('Login succeeded but profile could not be loaded', 'missing profile', { email: state.email });
```

It also `JSON.stringify`s `Error` objects, which usually produces `{}` and drops `message`/`stack`.

**Risk:** PII can appear in browser logs, while the useful error details are often missing.

**Fix:** Do not log emails/tokens/passwords. Normalize errors to `{ name, message }` and log safe IDs or operation names only.

---

### 9. Registration Has No Local Password Strength Check

**Severity:** WARNING - Security  
**File:** `src/pages/Auth/Register.tsx:90-123`

Registration validates matching and non-empty passwords but has no length or complexity floor before sending to the edge function.

**Risk:** If Supabase project settings are weak or changed, the client accepts weak passwords and gives no early feedback.

**Fix:** Enforce at least the same minimum as Supabase Auth in the client and edge function. Prefer 12+ characters over composition rules.

---

### 10. `xlsx` Dependency Has Known Security/Maintenance Risk

**Severity:** WARNING - Security  
**Files:** `package.json:38`, `src/utilities/exportStudentExcel.ts`

The app depends on `xlsx@^0.18.5`, a package with known unresolved vulnerability history and limited modern maintenance. It is used for teacher exports.

**Risk:** Export paths can become a supply-chain/security liability, especially when processing user-controlled workbook content in the future.

**Fix:** If only writing simple teacher exports, replace with a maintained export path such as CSV generation or a maintained XLSX writer already approved by the project.

---

### 11. Public Workout Routes Are Outside Auth Protection

**Severity:** WARNING - Security / Product Logic  
**File:** `src/App.tsx:273-312`

Most learning routes are under `ProtectedRoute`, but workout routes are public.

```tsx
<Route path="workout-zone/:videoUrl" element={<WorkoutZone />} />
<Route path="workout-zone/" element={<WorkoutZone />} />
```

**Risk:** If workout content is intended for enrolled/authenticated users, it is accessible without login. This may be intentional; the code does not document that choice.

**Fix:** Move workout routes under `ProtectedRoute` if they are private, or add a comment/test stating they are intentionally public.

---

## LOW - Should Fix

---

### 12. Edge Function CORS Allows All Origins

**Severity:** WARNING - Security  
**File:** `supabase/functions/_shared/cors.ts:1-5`

```ts
'Access-Control-Allow-Origin': '*'
```

**Risk:** Public auth endpoints can be called from any website. This is often acceptable for public registration, but it increases abuse surface when paired with weak/global rate limiting.

**Fix:** Restrict origins to the production app and local dev origins unless a truly public API is required.

---

### 13. PFT Time Debug Log Left in Production Path

**Severity:** WARNING - Code Quality  
**File:** `src/components/physical-fitness-test/PhysicalFitnessTest.tsx:327-330`

```ts
console.log('PFT time:', { timeStarted, timeEnded, nowTime, ... });
```

**Risk:** Noisy logs leak student activity timing and make real debugging harder.

**Fix:** Delete the log or route it through a development-only logger.

---

### 14. No Unit/Integration Tests Found for Data Utilities and Mutations

**Severity:** WARNING - Testing  
**Files:** `src/queries/*`, `src/mutations/*`, `src/lib/*`

The repo has E2E specs, but no `*.spec.ts(x)` unit/integration tests were found for the Supabase query/mutation utilities or PFT/quiz state derivation.

**Risk:** Data-integrity bugs in cache invalidation, quiz state, class ownership assumptions, and PFT pre/post transitions depend on manual/E2E coverage only.

**Fix:** Add small tests around `derivePftStatus`, quiz ranking/detail shaping, class filtering, and PFT save invalidation behavior.

---

### 15. Local Ignored Environment Files Contain Real Keys

**Severity:** WARNING - Security / DevOps  
**Files:** `.env`, `.env.local`

`.env` and `.env.local` exist locally and are ignored by git. They include real project URLs/API keys, including a YouTube API key. They are not currently tracked according to `git status --short --ignored -- .env .env.local audit.md`.

**Risk:** Local secrets can still leak through screenshots, logs, accidental copies, or a future `.gitignore` mistake.

**Fix:** Keep them ignored, rotate keys if they were ever shared, and store only example placeholders in committed docs.

---

## Files With Zero Violations

- `src/lib/query-keys.ts` - consistent query-key helpers with stable tuple keys.
- `supabase/migrations/20260705000000_add_quiz_progress_unique_constraint.sql` - enforces one quiz progress row per `(user_id, quiz_id)`.
- `src/queries/auth-queries.ts` - authenticated profile lookup scopes by current session user ID.

---

## Things that we're done correctly

- `src/App.tsx:78-110` separates authenticated routes from teacher-only routes and blocks non-teachers from class pages.
- `supabase/migrations/20260526083000_secure_student_data_access.sql:81-292` replaces broad table access with owner/teacher-scoped RLS policies.
- `supabase/migrations/20260526083100_add_get_pft_summary_for_viewer_rpc.sql:20-31` checks authentication, test type, and teacher-student relationship before returning PFT summaries.
- `src/queries/pft-queries.ts:67-79` uses `Promise.all` for the fallback PFT summary reads instead of sequential round trips.
- `src/pages/Auth/Login.tsx:68-86` maps Supabase auth errors to safer user-facing messages instead of showing raw auth errors in the active login UI.

---

## Priority Fix Roadmap

### P0 - Security / Data Integrity

| # | Issue | File(s) |
|---|-------|---------|
| 1 | Prevent unverified teacher accounts from viewing quiz answer keys | `Register.tsx`, signup trigger, `Quiz.tsx` |
| 2 | Stop returning raw edge-function errors | `supabase/functions/*/index.ts` |
| 3 | Replace global auth rate-limit buckets | `supabase/functions/*/index.ts` |
| 4 | Invalidate PFT query cache after every PFT save | `pft-mutations.ts`, PFT pages/components |

### P1 - Performance

| # | Issue | File(s) |
|---|-------|---------|
| 5 | Rewrite class roster RPC to aggregate once | `retrieve_students_by_class` migration |
| 6 | Batch quiz ranking instead of one leaderboard query per quiz | `quiz-state.ts`, `quiz-queries.ts` |

### P2 - Hardening

| # | Issue | File(s) |
|---|-------|---------|
| 7 | Move real login throttling server-side or remove misleading client limiter | `Login.tsx`, `useRateLimiter.ts` |
| 8 | Sanitize frontend logging | `logger.ts`, login paths |
| 9 | Add password minimum checks | `Register.tsx`, registration edge function |
| 10 | Review/replace `xlsx` | `package.json`, export utility |

### P3 - Cleanup / Coverage

| # | Issue | File(s) |
|---|-------|---------|
| 11 | Decide/document whether workout routes are public | `App.tsx` |
| 12 | Restrict edge-function CORS if possible | `_shared/cors.ts` |
| 13 | Remove PFT debug log | `PhysicalFitnessTest.tsx` |
| 14 | Add focused data-layer tests | `src/queries`, `src/mutations`, `src/lib` |

---

*Generated by audit-repo best-effort sweep on 2026-07-07. Heuristic N+1 / repeated round-trip analysis was included.*
