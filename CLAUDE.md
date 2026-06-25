# CLAUDE.md — Project Root

## Working philosophy — nothing is invented (read first)

**Do not invent product scope.** Pages, sections, content blocks, fields, features, copy, and
navigation are decided **with the human, through discussion**, before they are built. Nothing is
"random" or assumed.

Concretely:
- ❌ Do not add a page, route, section, or content block that wasn't agreed on.
- ❌ Do not invent placeholder copy, fake testimonials, made-up stats, or stock sections ("Our
  Team", "Pricing", "FAQ") just because sites usually have them.
- ❌ Do not add fields, filters, or features beyond what was specified.
- ✅ If something is needed but undecided, **stop and add it to `OPEN_QUESTIONS.md`**, then ask —
  don't fill the gap with a guess.
- ✅ Building the *mechanism* agreed on (e.g. "a blog list page") is fine; inventing its *contents
  and sub-sections* without agreement is not.

The page inventory and per-page content live in `OPEN_QUESTIONS.md` until resolved. Build only
what has been agreed and is reflected in `STATE.md`.

---

## What this project is

A SvelteKit **company website with a built-in CMS**. The public-facing site displays content
(posts, pages, stories, series) managed through an `/admin` panel. The backend is an existing
**NestJS API** with authentication and a 4-role system, consumed via `openapi-fetch` using
auto-generated types.

This file is the top-level context. More specific `CLAUDE.md` files exist deeper in the tree and
add detail for their area:

- `CLAUDE.md` (this file) — stack, env, auth, roles, global rules
- `DESIGN_SYSTEM.md` — color tokens, theming, day/night, design conventions **(read this before writing any CSS)**
- `src/CLAUDE.md` — frontend architecture, API client, auth flow, stores, animations
- `src/routes/admin/CLAUDE.md` — CMS panel: role guards, content endpoints, post workflow

Claude Code reads every `CLAUDE.md` from the working file up to the root, so you automatically
have the relevant context for wherever you are working.

---

## Session workflow — follow this on every "next step" request

1. Read `STATE.md` → find the earliest ⬜ step in the earliest unblocked phase.
2. If the step is ⛔ → open `OPEN_QUESTIONS.md`, surface the blocking question to the human,
   and wait for an answer before doing anything.
3. Once unblocked (or already ⬜) → implement the step.
4. If answering a question introduced a new rule or fact, record it in the relevant `CLAUDE.md`
   file. (Pure implementation steps don't require a `CLAUDE.md` update.)
5. Ask: "Step done — mark it complete?"
6. Human confirms → mark the step ✅ in `STATE.md`. If a question was answered to unblock
   this step, remove that question from `OPEN_QUESTIONS.md`.

---

### Working docs (read/update, not always-on instructions)

These are **reference and tracking** files — consult them when relevant, keep them current:

- `STATE.md` — phased roadmap + open questions. **Read at the start of every session** to find
  the next step and check for blockers.
- `OPEN_QUESTIONS.md` — questions that block specific build steps. **Check before building** in
  an affected area; **add to it** instead of guessing when you hit an unknown.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | SvelteKit (SSR-first) |
| Styling | **Plain native CSS only.** No SCSS, no Sass, no utility framework. Native nesting + CSS custom properties. |
| API client | `openapi-fetch`, typed against `src/lib/types/openapi-types.ts` |
| Auth | JWT — Bearer token in SvelteKit-managed HttpOnly cookies. See Auth rules below. |
| Animations | **Svelte-native only**: `transition:`, `animate:`, `tweened`, `spring`. No GSAP/Motion One/Framer. |
| Theming | CSS custom properties + `data-theme` attribute. See `DESIGN_SYSTEM.md`. |
| Package manager | **pnpm** |

---

## Environment variables

Two config layers: compile-time branding **defaults** in `src/lib/config/site.ts`, and
**build-time env vars** (`$env/static/public`) that override them. Check `src/lib/config/site.ts`
before reaching for `$env` — most branding values already have defaults there.

```
PUBLIC_API_URL=http://localhost:3000     # NestJS backend base URL (required)
PUBLIC_SITE_NAME=                         # overrides SITE_CONFIG.name
PUBLIC_SITE_TAGLINE=                      # overrides SITE_CONFIG.tagline
PUBLIC_SITE_LOGO_URL=                     # overrides SITE_CONFIG.logoUrl
PUBLIC_SUPPORT_EMAIL=                     # overrides SITE_CONFIG.supportEmail
PUBLIC_TWITTER_URL=
PUBLIC_LINKEDIN_URL=
PUBLIC_GITHUB_URL=
```

Never hardcode the API base URL. Always read `PUBLIC_API_URL` from `$env/static/public`.

---

## Branding config

`src/lib/config/site.ts` is the **single source of truth** for company identity. It exports
`SITE_CONFIG` with defaults; env vars override at runtime. Read this file before adding any
company-specific string anywhere.

```ts
// src/lib/config/site.ts
import {
  PUBLIC_SITE_NAME,
  PUBLIC_SITE_TAGLINE,
  PUBLIC_SITE_LOGO_URL,
  PUBLIC_SUPPORT_EMAIL,
  PUBLIC_TWITTER_URL,
  PUBLIC_LINKEDIN_URL,
  PUBLIC_GITHUB_URL,
} from '$env/static/public';

export const SITE_CONFIG = {
  name: PUBLIC_SITE_NAME || 'Acme Corp',
  tagline: PUBLIC_SITE_TAGLINE || 'Building things that matter',
  logoUrl: PUBLIC_SITE_LOGO_URL || '/logo.svg',
  supportEmail: PUBLIC_SUPPORT_EMAIL || 'hello@acme.com',
  socialLinks: {
    twitter: PUBLIC_TWITTER_URL || '',
    linkedin: PUBLIC_LINKEDIN_URL || '',
    github: PUBLIC_GITHUB_URL || '',
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;
```

When the company name/brand is finalized, set the env vars — no code changes needed.

---

## Auth rules (critical — read carefully)

**Token mechanics:** `POST /auth/sign-in` returns `{ accessToken, refreshToken }` in the
response body **and** sets a `refreshToken` HttpOnly cookie scoped to `/auth/refresh-tokens` on
the backend. SvelteKit's login action reads the body and stores **both** tokens as its own
HttpOnly cookies (`access_token` 1 h, `refresh_token` 24 h). Tokens are never in JS-readable
storage.

The flow on every request:

1. `hooks.server.ts` reads the `access_token` cookie and calls `GET /users/me` with
   `Authorization: Bearer <token>` to validate and resolve the user.
2. On `401`, it reads `refresh_token`, POSTs `{ refreshToken }` to `/auth/refresh-tokens`,
   stores the new pair as cookies, and retries.
3. Resolved user → `event.locals.user`. Access token → `event.locals.accessToken`.
4. `hooks.server.ts` also injects `data-theme` into the HTML via `transformPageChunk`.
5. Root `+layout.server.ts` exposes `user` + `theme` → `page.data` (UI hints only; access via `import { page } from '$app/state'`).
6. Server `load` functions call `serverApi(fetch, locals.accessToken)` for authenticated requests.

Rules:

- Never store tokens in `localStorage`, `sessionStorage`, or any JS-readable location.
- Token refresh happens in `hooks.server.ts` **before** any `load` runs.
- Access control lives in server `load` / action functions, **never** in component logic.
- `locals.accessToken` is server-only — it is never serialised into `page.data`.

Details and code in `src/CLAUDE.md`.

---

## Role system

`locals.user.role` is one of: `admin`, `author`, `editor`, `user`.

| Role | Capabilities |
|---|---|
| `admin` | Everything: manage users, change roles, create/edit/delete any post, view audit logs |
| `author` | Create posts; edit/delete **own** posts only |
| `editor` | Edit **any** post; cannot create or delete |
| `user` | Register and view public content. No write access. |

> ⚠️ This matrix is **inferred from the OpenAPI endpoint names**, not from reading the backend's
> `@Roles()` guards (those aren't exposed in the types). Treat it as intended frontend behavior.
> **The backend is the real authority** — a `403` from the API is the source of truth, not this
> table. Build UI that gracefully handles being wrong about permissions.

Role guards belong in `+page.server.ts` / `+layout.server.ts` `load` functions. Components
receive already-guarded data. Client-side role checks are for hiding/showing UI only and must
never be the sole gate on an action.

---

## File structure

```
src/
  app.html                  # no-flash inline theme script (see DESIGN_SYSTEM.md)
  app.d.ts                  # App.Locals + App.PageData types
  hooks.server.ts           # auth resolution + token refresh + data-theme injection
  lib/
    api/client.ts           # openapi-fetch typed client (api + serverApi)
    config/site.ts          # SITE_CONFIG branding source of truth
    components/             # shared components (PascalCase.svelte)
    state/                  # shared helpers and reactive modules (plain .ts for pure utils; .svelte.ts for runes)
    styles/
      tokens.css            # primitives + semantic + non-color tokens
      global.css            # base reset, imports tokens.css
    types/openapi-types.ts  # AUTO-GENERATED — do not edit
    utils/                  # helpers (camelCase.ts)
  routes/
    +layout.server.ts       # exposes user + theme to page.data
    +layout.svelte          # imports global.css, mounts matchMedia listener
    admin/                  # CMS panel (own CLAUDE.md)
```

Naming: components `PascalCase.svelte`; routes per SvelteKit convention (`+page.svelte`,
`+page.server.ts`, etc.); utilities `camelCase.ts`.

---

## Svelte version — ALWAYS Svelte 5

**WE ALWAYS USE SVELTE 5 SYNTAX AND THE SVELTE 5 WAY OF CODING.**

Full reference: `src/CLAUDE.md` → "Svelte 5 — required throughout" (conversion table, debugging rules, self-check).
Mechanical enforcement: `pnpm lint && pnpm check` must pass before any Svelte work is done.

---

## Comments — REQUIRED, not optional

**Default: add a comment.** Only omit one when the code is so self-explanatory that any reader would immediately understand the intent and the constraint behind it.

When in doubt, comment. A short explanation is never wrong; unexplained non-obvious code always is.

### Always comment these patterns

- **SSR guards** — `if (typeof document === 'undefined')`: say why the guard is needed.
- **Cookie reads/writes** — name the purpose of the value, not the mechanics of the read.
- **Immediate DOM mutations** — explain why the change can't wait for a server round-trip.
- **Non-obvious CSS** — any rule that exists to work around a layout constraint or browser quirk.
- **Regex** — one line stating what it matches and why.
- **Auth/token decisions** — why a token lives where it does, why it's read at this point.
- **Magic numbers** — even "obvious" ones like `31536000` get a unit label.
- **Any `onMount` that isn't just animation** — explain why the work is client-only.

### Format

- One line, almost always. Two only if truly necessary.
- Plain English. State the constraint or intent, never the mechanics.
- Write for a junior reader who knows the language but not the project's decisions.

✅ `// SSR guard — document is undefined on the server`  
✅ `// write immediately so the color switches without a round-trip`  
✅ `// keep focus ring visible inside overflow:hidden parent`  
❌ `// this reads the cookie and returns the value`

---

## Global "do not" list

- ❌ Do not install GSAP, Framer Motion, Motion One, or any animation library. Svelte built-ins only.
- ❌ Do not use `localStorage` / `sessionStorage` for auth state.
- ❌ Do not hardcode company name, logo, tagline — always use `SITE_CONFIG`.
- ❌ Do not use raw `fetch` for the API — always use the typed client in `src/lib/api/client.ts`.
- ❌ Do not put access-control role checks in `.svelte` component logic.
- ❌ Do not edit `src/lib/types/openapi-types.ts` — it is generated from the backend.
- ❌ Do not use raw hex colors or CSS primitive tokens (`--slate-500`) in components — use semantic tokens (`--color-text`, `--color-primary`, etc.). See `DESIGN_SYSTEM.md`.
- ❌ Do not install a UI component library (Tailwind, Skeleton, etc.) without discussing first.
- ❌ Do not use Svelte 4 syntax — this project is Svelte 5, runes mode enforced globally.
