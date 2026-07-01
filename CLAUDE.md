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
(posts) and a **product catalog** (products grouped by product type, with
type-specific filterable specs) managed through an `/admin` panel. The backend is an existing
**NestJS API** with authentication and a 4-role system, consumed via `openapi-fetch` using
auto-generated types.

This file is the top-level context. More specific `CLAUDE.md` files exist deeper in the tree and
add detail for their area:

- `CLAUDE.md` (this file) — stack, env, auth, roles, global rules
- `DESIGN_SYSTEM.md` — color tokens, theming, day/night, design conventions **(read this before writing any CSS)**
- `src/CLAUDE.md` — frontend architecture, API client, auth flow, stores, animations
- `src/routes/admin/CLAUDE.md` — CMS panel: role guards, content endpoints, post workflow, product catalog

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
PUBLIC_GOOGLE_CLIENT_ID=                  # Google OAuth client ID — leave empty to disable the button
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

## API response envelope (critical — every endpoint, no exceptions)

**The backend wraps EVERY response in `{ apiVersion?, data }`.** The thing you want is always at
`.data` — never at the top level. This trips up agents repeatedly; do not forget it.

- **Single read / create / update / image upload** → the entity is at `.data`.
  `const json = await res.json(); const user = json.data;` (raw fetch), or
  `const { data } = await client.GET(...); const user = data?.data;` (openapi-fetch).
- **Paginated lists** (`/users`, `/products`, `/products/admin`, `/posts/admin`, `/posts/my`) →
  `.data` is `{ data: T[], meta, links }`, so **items are at `.data.data`** and pagination at
  `.data.meta`.
- **Bare-array lists** (`/product-types`) → still enveloped: the array is at `.data`.

⚠️ Casting `res.json()` directly to the entity type (skipping `.data`) compiles fine but yields an
object missing every real field — e.g. `user.role` comes back `undefined`, silently breaking role
guards (this was a real `hooks.server.ts` bug). When a field you expect is missing, suspect a
forgotten `.data` unwrap first.

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
| `admin` | Everything, unrestricted: manage users, change roles, manage the tag vocabulary, view audit logs, manage products; create/edit/delete **any** post |
| `author` | Create posts; full management of **own** posts only (edit, delete, images, tags-on-post, meta-options); manage the tag vocabulary (`/tags` CRUD) |
| `editor` | Same as `author` for posts (create + own-posts-only); **cannot** manage the tag vocabulary |
| `user` | Register and view public content. No write access. |

> ✅ This matrix is now **confirmed from the API `403` descriptions** in the regenerated
> `openapi-types.ts` (the backend embeds the allowed roles in each forbidden response), not merely
> inferred from endpoint names. **The backend is still the real authority** — a `403` from the API
> is the source of truth, so build UI that gracefully handles being wrong about permissions.
> Note: `editor == author` for posts; the only `author > editor` difference is tag-vocabulary CRUD.

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
    products/               # public product catalog: type directory → per-type list → detail
    admin/                  # CMS panel (own CLAUDE.md)
```

Naming: components `PascalCase.svelte`; routes per SvelteKit convention (`+page.svelte`,
`+page.server.ts`, etc.); utilities `camelCase.ts`.

---

## Testing

- **Playwright is the primary trust signal**, not Vitest. Specs drive a real browser against the
  real dev server (`pnpm dev`) talking to a **real local NestJS backend** (`PUBLIC_API_URL`) — no
  network-layer mocking. This is what catches the bugs this codebase has actually had: role-guard
  mistakes, ownership gaps, the `.data` envelope bug, cookie/auth regressions.
- **Vitest is intentionally not installed yet.** It's only worth adding once genuine pure logic
  exists to stress-test with many inputs and no backend (e.g. the future product spec-filter
  serializer in `src/lib/utils/`, which is empty today). Don't add Vitest speculatively.
- Specs live in `tests/`, not `e2e/` — SvelteKit's generated `.svelte-kit/tsconfig.json` only
  auto-includes `test/**`/`tests/**` for `svelte-check`, so this naming gets type-checked for free.
- `POST /auth/sign-in` is **tightly throttled** on the real backend (a handful of requests per
  ~20-30s window, `429` + `Retry-After`). `tests/global-setup.ts` logs in once per seeded role
  (admin/author/editor/user) through the real `/login` form and caches the session as Playwright
  `storageState` in `tests/.auth/` (gitignored) — specs start pre-authenticated instead of
  resubmitting the login form. `tests/fixtures.ts` → `loginAs` / `submitLoginExpectingFailure`
  retry-and-wait on a throttled attempt (reading the real `Retry-After` header) rather than
  assuming a form submission just works first try.
- Seeded test credentials split like the rest of the env files: non-secret config
  (`PUBLIC_API_URL`) lives in the git-tracked `.env.test`; the actual `SEED_ADMIN_EMAIL`/
  `SEED_ADMIN_PASSWORD` etc. (same var names as the backend's `pnpm run seed:dev`) live in the
  gitignored `.env.test.local` — never put real credentials in `.env.test`.
- Run with `pnpm test:e2e` (headless) or `pnpm test:e2e:ui` (interactive debugging).
- **The backend's rate limiting is environment-gated, not just per-route.** When the backend runs
  with `NODE_ENV=development` (e.g. `pnpm run start:dev`), its global throttler limit is
  effectively removed (`1_000_000`/60s) — every endpoint, not just the ones with a `@SkipThrottle`
  bypass, including `GET /users/me` (called on every request by `hooks.server.ts`) and
  `POST /users` (registration). Production/staging/`NODE_ENV=test` keep the real `60 req/60s` cap.
  So a `429` from `GET /users/me`, `POST /users`, or any other non-sign-in endpoint during local
  Playwright runs means the backend **isn't** running in development mode (or was restarted into a
  different mode) — restart it with `pnpm run start:dev`, don't add retry/backoff code for it. The
  `POST /auth/sign-in` throttle handling above (`Retry-After`, `loginAs` retry loop) exists for
  staging/prod-like backends and still applies there, but is not expected to trigger against a
  properly-started local dev backend.
- **`browser.newContext()` inherits the enclosing `test.use({ storageState })` by default.** A test
  that needs a genuinely logged-out second context (e.g. to exercise `/register`, which redirects
  an already-authenticated visitor away) must pass `{ storageState: undefined }` explicitly, or the
  new context silently carries the describe block's authenticated session.
- **Edit forms are a real hydration-race risk for Playwright `.fill()`.** Inputs are SSR-prefilled
  via a one-way `value={...}` binding (not `bind:value`). Filling such an input immediately after
  navigating can race client-side hydration, which re-applies the original SSR value a moment later
  and silently clobbers the fill — the page still redirects normally, so the failure only shows up
  as "the saved value didn't change" on the next read. `await page.waitForLoadState('networkidle')`
  before filling avoids it. Create forms never hit this (they start blank, nothing for hydration to
  reset to), which is why it went undetected until the first edit-form spec was written
  (`tests/admin-users.spec.ts`). Apply the same wait in any future spec that fills a pre-populated
  edit form (e.g. the still-uncovered post edit form).

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
