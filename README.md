# Hope Hub

Hope Hub is a web-based Physical Education platform for students and teachers. It packages PE lectures, quizzes, physical fitness testing, workout guidance, health calculators, and class tracking into a single app backed by Supabase.

This README is derived from [PRD.md](./PRD.md) and aligned with the current repository structure.

## Overview

Hope Hub is built around two active roles:

- `student`: studies lecture content, takes quizzes, completes physical fitness tests, joins a class, and tracks progress
- `teacher`: creates classes, monitors student activity, reviews results, and exports class data

The app is organized around these modules:

- Authentication: registration, login, email verification, password reset, and password change
- Lectures: lesson browsing, PDF/video delivery, progress tracking, and quiz unlock flow
- Quizzes: shuffled questions, timers, resumable progress, scoring, and leaderboard
- Physical Fitness Test: PAR-Q screening, pre-test and post-test flows, and summaries
- Health Calculators: BMI, BMR, IBW, water intake, body fat, and heart rate tools
- Workout Zone: categorized exercise videos with instructions and references
- Dashboard: student self-tracking and teacher class management with export support
- About: static organization and contact page

## Product Flow

At a high level, the app works like this:

1. A user registers and verifies their account through Supabase Auth.
2. Hope Hub creates the user profile and baseline progress records in Supabase.
3. Students consume lectures, unlock quizzes, and record physical fitness data.
4. Teachers manage classes and review student performance by class code.

The detailed product behavior, route map, and module breakdown live in [PRD.md](./PRD.md).

## Tech Stack

- Frontend: React + Vite
- Routing: `react-router-dom`
- Styling: Tailwind CSS
- UI primitives: Radix UI, shadcn/ui, Sonner
- Backend: Supabase Auth, Postgres, Storage, RPC, Edge Functions
- Charts and export: Recharts, `xlsx`
- Deployment target: Vercel

## Key Capabilities

- Role-based experience for students and teachers
- Lecture completion tracking tied to quiz availability
- Quiz resume state, timed scoring, and leaderboard display
- Physical fitness pre-test and post-test recording
- Teacher-owned class codes and class-level student views
- Excel export for teacher reporting
- Profile picture upload through Supabase Storage
- Client-side health calculators and workout reference content

## Project Structure

```text
.
├── PRD.md
├── db/
│   └── schema.sql
├── public/
│   ├── covers/
│   └── videos/
├── src/
│   ├── assets/
│   ├── client/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── providers/
│   ├── services/
│   ├── styles/
│   └── utilities/
├── supabase/
│   ├── config.toml
│   └── functions/
└── vercel.json
```

## Local Development

### Requirements

- Node.js 18+
- A package manager: `pnpm` or `npm`
- A Supabase project, local or hosted

### Install

Using `pnpm`:

```bash
pnpm install
pnpm dev
```

Using `npm`:

```bash
npm install
npm run dev
```

The Vite dev server is exposed with `--host`.

### Available Scripts

- `dev`: start the Vite development server
- `build`: create a production build
- `lint`: run ESLint
- `preview`: preview the production build locally

## Environment Variables

Create a local `.env` file with the frontend Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional:

```bash
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```

For local physical-fitness testing, set the exact value below to skip timing
validation. Leave it unset in normal environments.

```bash
VITE_APP_ENV=DEV
```

Only `VITE_APP_ENV=DEV` disables physical-fitness timing validation. The variable
must be supplied to the Vite dev server or build process.

`VITE_YOUTUBE_API_KEY` exists in [src/client/youtube.js](./src/client/youtube.js), but it is not part of the main app bootstrap path today.

## Supabase Notes

The repo includes multiple Supabase-related pieces:

- [db/schema.sql](./db/schema.sql): current database schema dump
- [supabase/config.toml](./supabase/config.toml): local Supabase CLI configuration
- [supabase/functions/login/index.ts](./supabase/functions/login/index.ts): login edge function source
- [supabase/functions/registration/index.ts](./supabase/functions/registration/index.ts): registration edge function source

Current application flows rely primarily on the browser Supabase client in [src/client/supabase.js](./src/client/supabase.js) and database RPCs described in the PRD:

- `register_user(...)`
- `retrieve_students_by_class(...)`

This repo currently contains a schema dump, not an ordered migration set.

## Deployment

The app is configured for Vercel. [vercel.json](./vercel.json) includes:

- SPA rewrites so client-side routes resolve correctly
- security headers
- a CSP that allows Supabase connections and YouTube embeds

## Important References

- Product behavior and route map: [PRD.md](./PRD.md)
- Database layer: [db/schema.sql](./db/schema.sql)
- App routes and wrappers: [src/App.jsx](./src/App.jsx)
- Supabase client: [src/client/supabase.js](./src/client/supabase.js)

## Current State

The product brief in [PRD.md](./PRD.md) describes the intended platform clearly, while the repository reflects the current implementation. Where they differ, this README favors the repository for setup details and the PRD for product scope.
