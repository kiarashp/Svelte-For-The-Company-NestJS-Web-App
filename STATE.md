# STATE.md — Roadmap & Build Progress

> Phased roadmap. Unblocked phases are ready to build now. Blocked phases wait on answers in
> `OPEN_QUESTIONS.md`. Follow the session workflow in root `CLAUDE.md`.

_Last updated: 2026-06-25_

---

## Status legend

- ⬜ Not started
- 🟨 In progress
- ✅ Done
- ⛔ Blocked — see `OPEN_QUESTIONS.md` for the referenced question

---

## Phase 1 — Foundation `UNBLOCKED`

> All steps fully specified by rules already in the CLAUDE.md files and DESIGN_SYSTEM.md.
> Execute in order, one step at a time.

| # | Step | Status | Spec |
|---|---|:--:|---|
| 0 | **ESLint gate** | ✅ | root CLAUDE.md |
| 1 | **Remove Tailwind** | ✅ | root CLAUDE.md → stack + do-not list |
| 2 | **Design tokens** | ✅ | DESIGN_SYSTEM.md → `tokens.css` (primitives + semantic + non-color) |
| 3 | **`app.html`** | ✅ | DESIGN_SYSTEM.md → inline no-flash script |
| 4 | **Types (`app.d.ts`)** | ✅ | src/CLAUDE.md → `app.d.ts` block |
| 5 | **API client** | ✅ | src/CLAUDE.md → `client.ts` block |
| 6 | **Branding config** | ✅ | root CLAUDE.md → SITE_CONFIG section |
| 7 | **Theme system** | ✅ | DESIGN_SYSTEM.md → toggle + `theme.ts` cookie helpers |
| 8 | **Auth hooks** | ✅ | src/CLAUDE.md → `hooks.server.ts` block |
| 9 | **Root layout** | ✅ | src/CLAUDE.md → `+layout.server.ts` + `+layout.svelte` |

---

## Phase 2 — Auth Routes `UNBLOCKED`

> After Phase 1. Registration endpoint confirmed: `POST /users` (see src/CLAUDE.md).
> All other auth routes are fully specified by existing rules.

| # | Step | Status | Notes |
|---|---|:--:|---|
| A1 | Login route + action | ⬜ | `POST /auth/sign-in` → set HttpOnly cookies |
| A2 | Sign-out route | ⬜ | `POST /auth/sign-out` → clear cookies |
| A3 | Register route + action | ⬜ | `POST /users` — public, triggers email verification |
| A4 | Google OAuth | ⬜ | `/google-authentication` |
| A5 | Email verification UI | ⬜ | `GET /auth/verify-email` + resend endpoint |
| A6 | Password reset UI | ⬜ | forgot / reset / change-password flow |

---

## Phase 3 — Public Site `⛔ BLOCKED`

> Blocked until page inventory and content questions are answered.
> Once a question is resolved, remove its ⛔ and mark the step ⬜.

| Step | Status | Blocked by |
|---|:--:|---|
| Public layout (header / footer / ThemeToggle) | ⛔ | Q-PAGES-3 (navigation) |
| Homepage | ⛔ | Q-PAGES-1, Q-PAGES-2 |
| Blog list | ⛔ | Q-PAGES-1, Q-PAGES-4, Q11 |
| Post detail `[slug]` | ⛔ | Q-PAGES-1, Q-PAGES-5, Q6 |
| Author public profile | ⛔ | Q-PAGES-1 |
| Contact form | ⛔ | Q-PAGES-1 |
| Auth page layout (login / register) | ⛔ | Q-PAGES-6 |

---

## Phase 4 — Admin CMS `PARTIALLY UNBLOCKED`

> Admin gate and core post CRUD are fully specified. Tag / image / meta steps need permission
> answers first.

| Step | Status | Blocked by |
|---|:--:|---|
| Admin layout guard (`+layout.server.ts`) | ⬜ | — |
| Post list / dashboard | ⬜ | — |
| Post create | ⬜ | — |
| Post edit (ownership rules) | ⬜ | — |
| Post delete | ⬜ | — |
| User management | ⬜ | — |
| Role change | ⬜ | — |
| Audit log viewer | ⬜ | — |
| Avatar option management | ⬜ | — |
| Tag management | ⛔ | Q1 |
| Image upload per post | ⛔ | Q2 |
| Meta-options | ⛔ | Q3 |
| Full admin page inventory | ⛔ | Q-PAGES-7 |
| Empty / error / loading states | ⛔ | Q-PAGES-8 |
