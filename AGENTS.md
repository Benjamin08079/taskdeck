<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — project rules for AI coding agents

Persistent project context for AI coding agents working in this repository.
Read this file before making changes and follow it across sessions.

> Standing rule: *"Write tests for all the endpoints that you create and
> always validate that those endpoints are working."*

## 1. Project overview

**TaskDeck** — a tasks & notes web application with a neo-brutalist two-pane
board: tasks on the left, notes on the right.

- **Core features:** task creation, viewing, editing/updating, deletion, a
  notes feature, plus priorities, due dates, search, a progress dashboard and
  dark mode.
- **Quality bar:** every API endpoint has tests that prove it works.

## 2. Tech stack

| Layer     | Choice                                   |
| --------- | ---------------------------------------- |
| Framework | Next.js (App Router) + TypeScript        |
| UI        | Tailwind CSS v4, React client components |
| Storage   | JSON file store (`src/lib/store.ts`)     |
| Tests     | Vitest (direct endpoint invocation)      |

Do not introduce new frameworks, state libraries, or databases without a
demonstrated need — keep the stack boring and the diff small.

## 3. Commands

| Command         | Purpose                        |
| --------------- | ------------------------------ |
| `npm run dev`   | Start the dev server           |
| `npm run build` | Production build (must pass)   |
| `npm run start` | Serve the production build     |
| `npm run test`  | Run the Vitest endpoint suite  |
| `npm run lint`  | ESLint                         |

## 4. Architecture rules

- **Data flow is one-directional:** routes (`src/app/api/**`) → validation
  (`src/lib/validation.ts`) → store (`src/lib/store.ts`). Never read or write
  the database file from a route or component directly.
- **Validation lives in one place.** All request bodies must pass through
  `src/lib/validation.ts`. Never trust client input, even in internal tools.
- **Response envelope is fixed.** Success: `{ "data": ... }`. Failure:
  `{ "error": string, "details"?: string[] }`. Do not invent new shapes.
- **HTTP semantics:** `201` on create, `200` on read/update/delete, `400`
  validation (with `details`), `404` unknown id, `500` unexpected.
- Route handlers export `const dynamic = "force-dynamic"`; they must never be
  statically prerendered.
- Shared types live in `src/lib/types.ts`; UI primitives in
  `src/components/ui.tsx`.
- **Storage caveat:** the JSON file store keeps data in `data/db.json`
  (`DATA_DIR` overrides it). On serverless hosts the filesystem is ephemeral —
  the store falls back to an on-demand temp directory, so writes work but data
  resets between cold starts. Swapping in a hosted database means replacing
  the function bodies inside `src/lib/store.ts` only. Nothing else should
  change.

## 5. Code style

- TypeScript strict mode. No `any`, no non-null `!` assertions on data.
- Name event handlers `handleX`; prefer clarity over brevity in names.
- Comments only for constraints the code cannot express (e.g. the storage
  caveat above) — never narrate the obvious.
- Tailwind utility classes inline; shared class strings and the `brutal`
  utilities live in `src/components/ui.tsx` and `src/app/globals.css`.
  Dark mode uses the `dark:` variant driven by a `.dark` class on `<html>`
  (persisted in `localStorage` under `"theme"`).
- Keep functions small; extract a component when JSX nesting grows deep.

## 6. Testing rules — mandatory

- **Write tests for all the endpoints that you create and always validate
  that those endpoints are working.**
- Endpoint tests live in `tests/api.test.ts` and call the route handlers
  directly (see the existing patterns: `request()`, `routeCtx()`, delta-based
  stats assertions).
- Cover, per endpoint: success (`200`/`201`), validation failure (`400`),
  unknown id (`404`), and persisted side effects (re-fetch after mutation).
- Run `npm run test` before every commit. Never commit with failing tests.
- If you add an endpoint and not a test, the change is not done.

## 7. Git rules

- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`.
- Commit small and often; a commit should build and pass tests.
- Never commit `data/db.json`, `.env*`, or `node_modules` (see `.gitignore`).

## 8. Deployment rules

- Deploy on Vercel (or similar) by importing the GitHub repository — zero
  config needed.
- After deploying, **open the live URL and exercise the features**; a green
  build does not prove the app works.

## 9. Working with the agent

- Prefer short, iterative instructions over one huge prompt: build, run,
  observe, then tell the agent exactly what is broken or missing.
- When this file is missing a rule that would have helped, add it here in the
  same change.
