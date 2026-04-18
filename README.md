# Hope Hub Database

This folder contains the PostgreSQL schema for the Hope Hub platform described in [../PRD.md](../PRD.md). It represents the Supabase database layer that supports authentication-driven profile setup, lecture progress tracking, quizzes, physical fitness testing, and teacher class management.

## Scope

The product is a web-based Physical Education platform with two active application roles:

- `student`: consumes lessons, takes quizzes, records physical fitness data, and joins a class with a class code
- `teacher`: creates and manages classes, monitors students, and exports student progress

An `admin` enum value exists in the schema, but the PRD does not describe a dedicated admin UI yet.

## Files

- [schema.sql](./schema.sql): PostgreSQL dump for the current Hope Hub schema
- [../PRD.md](../PRD.md): product and app-flow reference used to derive this README

## Database Model

### Enum types

- `public.user_type`: `admin`, `student`, `teacher`
- `public.quiz_status`: `All`, `Done`, `Pending`, `Locked`

### Core tables

- `profile`: one row per authenticated user; stores `uuid`, `full_name`, `email`, and `user_type`
- `lecture_progress`: one row per user; stores lecture completion state in `jsonb`
- `physical_fitness_test`: one row per user; stores `pre_physical_fitness_test` and `post_physical_fitness_test`
- `quiz`: quiz definitions, metadata, and `questions` JSON
- `quiz_progress`: per-user quiz state and completion data
- `student_class_code`: student-to-class assignment
- `teacher_class_code`: teacher-owned classes with `class_code`, `class_name`, and `class_color`

### Relationships

- `profile.uuid` is the parent key for `lecture_progress`, `physical_fitness_test`, `quiz_progress.user_id`, `student_class_code.uuid`, and `teacher_class_code.uuid`
- `quiz_progress.quiz_id` references `quiz.id`
- `physical_fitness_test.uuid` is unique, enforcing one fitness record per user
- `lecture_progress.uuid` is the primary key, enforcing one lecture-progress record per user

## RPC Functions

The schema includes two application-facing Postgres functions:

- `register_user(...)`: creates the initial records for a newly verified user across `profile`, `lecture_progress`, `physical_fitness_test`, and the appropriate class-code table
- `retrieve_students_by_class(class_code_input)`: returns an aggregated teacher view of students in a class, including profile data, lecture progress, physical fitness results, and quiz progress

## How It Supports The App

Based on the PRD, the database is responsible for:

- creating user records after email verification
- persisting lecture progress and quiz unlock/completion state
- storing quiz definitions and per-student quiz attempts
- recording pre-test and post-test physical fitness data
- linking students to teacher-managed classes via class codes
- providing teacher dashboards with class-level student summaries through RPC

## Security

Row Level Security is enabled on all application tables in `schema.sql`.

The current dump includes policies for:

- self-service insert and update paths tied to `auth.uid()`
- profile updates tied to the authenticated JWT email
- broad read access on several tables

Because this is a dump, policy intent should be reviewed in Supabase before production use, especially the tables with unrestricted `SELECT` or permissive `UPDATE` behavior.

## Applying The Schema

If you want to load this schema into a PostgreSQL or Supabase-backed database, apply `schema.sql` with your normal database workflow. Examples:

```bash
psql "$DATABASE_URL" -f schema.sql
```

or through Supabase SQL Editor by pasting the file contents.

## Product Alignment Notes

- The PRD describes the frontend stack as React 18 + Vite, Supabase, Tailwind CSS, React Router v6, and Framer Motion.
- This folder only covers the database portion of that stack.
- The schema already contains the main entities and RPC endpoints referenced in the PRD's Supabase integration section.

## Current State

This folder currently contains a schema dump, not a migration set. If the project moves toward iterative database delivery, the next step would be to split `schema.sql` into ordered migrations and add seed data for quizzes and initial app content.
