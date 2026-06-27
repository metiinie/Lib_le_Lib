# AGENTS.md — Lib le Lib

This file is the entry point. Read this first, every session, before writing any code.

## What this is

Lib le Lib is a verified dating and matchmaking app for people living with HIV (PLHIV),
built with **Expo (React Native)** on the frontend and **NestJS + PostgreSQL** on the
backend. The full product spec lives in `lib-le-lib-build-documentation.docx`; the full
database schema lives in `lib-le-lib-schema.sql`. This file, and everything in `docs/`,
is the *engineering* rulebook layered on top of those two documents.

## Non-negotiable framing

This app handles HIV status — among the most sensitive categories of personal data that
exist. Every rule below exists because of that, not as generic best practice. When in
doubt, default to the more private, more restrictive option, and raise it explicitly
before relaxing anything in `docs/constraints.md`.

## The rulebook

| File | Covers |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Layers, folder structure, data flow, module boundaries |
| [docs/conventions.md](docs/conventions.md) | Naming, formatting, error handling, logging |
| [docs/constraints.md](docs/constraints.md) | Hard limits the AI must never cross |
| [docs/stack.md](docs/stack.md) | Exact pinned versions, frontend + backend |
| [docs/business-rules.md](docs/business-rules.md) | Domain logic: verification, age, matching, moderation |
| [docs/scope.md](docs/scope.md) | How to scope an individual task before starting it |
| [docs/patterns.md](docs/patterns.md) | Repository/service patterns, the Reveal Grant pattern |
| [docs/testing.md](docs/testing.md) | What "tested" means here, and how to run it |

## Definition of done

A task is **not done** when it compiles and runs. For this app, done means:

1. **Tested** (`docs/testing.md`) — including the privacy/security cases, not just the happy path.
2. **Documented** — public functions, API endpoints, and any new table/column.
3. **Checked against `docs/constraints.md`** — explicitly, not by assumption.

## Before starting any task

1. Read the task's scope card (`docs/scope.md`) — or write one if it doesn't exist yet.
2. Check `docs/constraints.md`. If the task touches photos, location, verification, or
   chat, the constraints there are not optional or "best effort."
3. Build inside the architecture in `docs/architecture.md`. Don't invent new top-level
   folders or layers to make one task easier.

Context isn't overhead here. For this particular app, it's the difference between a
trustworthy product and a data-breach headline.
