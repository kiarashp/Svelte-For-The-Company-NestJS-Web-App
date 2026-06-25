# STATE.md — Project State

> Living document. The agent reads this to know where things stand and **updates it as work
> progresses**. This is not instructions (those are in `CLAUDE.md` files) — it's the current
> snapshot. Keep it honest and current; stale state is worse than none.

_Last updated: (set on first real change)_

---

## Status legend

- ⬜ Not started
- 🟨 In progress
- ✅ Done
- ⛔ Blocked (see OPEN_QUESTIONS.md)

---

## Foundations

| Item | Status | Notes |
|---|:--:|---|
| SvelteKit project scaffolded | ⬜ | pnpm |
| `src/lib/types/openapi-types.ts` present | ✅ | Provided from backend |
| `src/lib/config/site.ts` (SITE_CONFIG) | ⬜ | Branding defaults + env override |
| `.env` / env var wiring | ⬜ | `PUBLIC_API_URL` etc. |
| `src/lib/api/client.ts` (openapi-fetch) | ⬜ | `api` + `serverApi` |
| `hooks.server.ts` (auth + theme) | ⬜ | Resolve user, refresh, read theme cookie |
| `app.d.ts` (App.Locals) | ⬜ | user + theme types |

## Design system

| Item | Status | Notes |
|---|:--:|---|
| `src/lib/styles/tokens.css` | ⬜ | Primitives + semantic + non-color |
| `app.html` inline theme script | ⬜ | No-flash, system resolution |
| `src/lib/stores/theme.ts` | ⬜ | Preference cookie helpers |
| `ThemeToggle.svelte` (3-way) | ⬜ | Light/Dark/System |
| `matchMedia` live-system listener | ⬜ | In root +layout.svelte |
| `global.scss` + load order | ⬜ | |

## Auth flow

| Item | Status | Notes |
|---|:--:|---|
| Login route + action | ⬜ | → backend sign-in |
| Register route + action | ⬜ | → POST /users (or sign-up flow) |
| Sign-out | ⬜ | → /auth/sign-out |
| Token refresh in hooks | ⬜ | /auth/refresh-tokens |
| Google OAuth | ⬜ | /google-authentication |
| Email verification UI | ⬜ | /auth/verify-email, resend |
| Password reset/forgot UI | ⬜ | forgot/reset/change |

## Public site

| Item | Status | Notes |
|---|:--:|---|
| Public layout (header/footer/toggle) | ⬜ | |
| Homepage | ⬜ | Hero + featured |
| Blog list | ⬜ | GET /posts paginated |
| Post detail `[slug]` | ⬜ | GET /posts/slug/{slug} |
| Author public profile | ⬜ | GET /users/{id}/profile |
| Contact form | ⬜ | POST /contact |

## Admin / CMS

| Item | Status | Notes |
|---|:--:|---|
| `/admin` staff gate (layout guard) | ⬜ | |
| Post list / dashboard | ⬜ | GET /posts/my + admin all |
| Post create | ⬜ | admin, author |
| Post edit (ownership rules) | ⬜ | author own / editor any |
| Post delete | ⬜ | admin / owning author |
| Image upload per post | ⬜ | POST /posts/{id}/images |
| Tag management | ⬜ | role rules unconfirmed (see OPEN_QUESTIONS) |
| User management | ⬜ | admin only |
| Role change | ⬜ | admin only |
| Audit log viewer | ⬜ | admin only |
| Avatar option management | ⬜ | admin only |

---

## How to use this file

When you complete or start a unit of work, update the relevant row's status and add a brief note.
If you hit something you can't resolve, mark it ⛔ and add an entry to `OPEN_QUESTIONS.md`.
