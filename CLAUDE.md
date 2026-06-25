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

The page inventory and per-page content live in `OPEN_QUESTIONS.md` until resolved, then move to
`DECISIONS.md`. Build only what `DECISIONS.md` / agreed scope covers.

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

### Working docs (read/update, not always-on instructions)

These are **reference and tracking** files — consult them when relevant, keep them current:

- `STATE.md` — current build progress. **Update it** as you start/finish work.
- `OPEN_QUESTIONS.md` — unresolved decisions needing a human answer. **Check before building** in
  an affected area; **add to it** instead of guessing when you hit an unknown.
- `DECISIONS.md` — log of settled choices and why. Don't re-litigate these; supersede with a new
  entry if something genuinely changes.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | SvelteKit (SSR-first) |
| Styling | Plain CSS / SCSS with Svelte scoped styles. **No utility framework.** |
| API client | `openapi-fetch`, typed against `src/lib/types/openapi-types.ts` |
| Auth | JWT in **HttpOnly cookies**, resolved server-side in `hooks.server.ts` |
| Animations | **Svelte-native only**: `transition:`, `animate:`, `tweened`, `spring`. No GSAP/Motion One/Framer. |
| Theming | CSS custom properties + `data-theme` attribute. See `DESIGN_SYSTEM.md`. |
| Package manager | **pnpm** |

---

## Environment variables

Two config layers: compile-time branding **defaults** in `src/lib/config/site.ts`, and runtime
**env vars** that override them. Check `src/lib/config/site.ts` before reaching for `$env` — most
branding values already have defaults there.

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
import { env } from '$env/static/public';

export const SITE_CONFIG = {
  name: env.PUBLIC_SITE_NAME || 'Acme Corp',
  tagline: env.PUBLIC_SITE_TAGLINE || 'Building things that matter',
  logoUrl: env.PUBLIC_SITE_LOGO_URL || '/logo.svg',
  supportEmail: env.PUBLIC_SUPPORT_EMAIL || 'hello@acme.com',
  socialLinks: {
    twitter: env.PUBLIC_TWITTER_URL || '',
    linkedin: env.PUBLIC_LINKEDIN_URL || '',
    github: env.PUBLIC_GITHUB_URL || '',
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;
```

When the company name/brand is finalized, set the env vars — no code changes needed.

---

## Auth rules (critical — read carefully)

Tokens live in **HttpOnly cookies** set by the NestJS backend. They are never accessible to
client-side JavaScript. The flow:

1. `hooks.server.ts` reads the auth cookie on every request.
2. It validates / refreshes the token against the backend and populates `event.locals.user`.
3. Server `load` functions read the user from `locals.user` (never a client store).
4. The root `+layout.server.ts` exposes the user through `load` → it appears in `$page.data`.
5. Components read auth state from `$page.data` — these are **UI hints only**.

Rules:

- **Server-side** `openapi-fetch` calls forward the cookie manually via SvelteKit's `fetch`.
- **Client-side** `openapi-fetch` calls must use `credentials: 'include'` so the cookie is sent.
- Never store tokens in `localStorage`, `sessionStorage`, or any JS-readable location.
- Token refresh happens in `hooks.server.ts` **before** any `load` runs.
- Access control lives in server `load` functions, **never** in component logic.

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
  app.html                  # contains the no-flash theme inline script (see DESIGN_SYSTEM.md)
  hooks.server.ts           # auth resolution + theme cookie reading
  lib/
    api/client.ts           # the openapi-fetch typed client
    config/site.ts          # SITE_CONFIG branding source of truth
    components/             # shared components (PascalCase.svelte)
    stores/                # Svelte stores (camelCase.ts)
    styles/                # SCSS: tokens.css, _mixins.scss, global.scss
    types/openapi-types.ts # AUTO-GENERATED — do not edit
    utils/                 # helpers (camelCase.ts)
  routes/
    +layout.server.ts       # exposes user + theme to $page.data
    admin/                 # CMS panel (own CLAUDE.md)
```

Naming: components `PascalCase.svelte`; routes per SvelteKit convention (`+page.svelte`,
`+page.server.ts`, etc.); utilities and stores `camelCase.ts`.

---

## Svelte version — ALWAYS Svelte 5

**WE ALWAYS USE SVELTE 5 SYNTAX AND THE SVELTE 5 WAY OF CODING.**

- ✅ Props: `let { foo, children } = $props();`
- ✅ Reactive state: `let count = $state(0);`
- ✅ Derived values: `let double = $derived(count * 2);`
- ✅ Side effects: `$effect(() => { … });`
- ✅ Event handlers: `onclick={handler}` (not `on:click`)
- ✅ Render children: `{@render children()}`
- ✅ `import { page } from '$app/state';` (not `$app/stores`)
- ✅ Snippets over slots: `{#snippet name()}…{/snippet}` + `{@render name()}`, pass snippets as props
- ✅ Pass callbacks as props, not events: `let { onsave } = $props();` then `onsave?.(data)`
- ✅ Bindable props: `let { value = $bindable() } = $props();`
- ✅ Reactive deep state: `$state()` objects/arrays are deeply reactive — mutate directly (`arr.push()`, `obj.x = 1`), don't reassign for reactivity
- ✅ Untrack when needed: `untrack()` from `'svelte'` to read without subscribing
- ✅ Shared logic: extract reactive logic into `.svelte.js` / `.svelte.ts` files using runes, not stores
- ✅ Class-based state with runes (`$state`/`$derived` as class fields) instead of writable stores
- ✅ `$derived.by(() => {…})` for multi-statement derivations
- ✅ `$effect.pre()` for pre-DOM-update effects (replaces `beforeUpdate`)
- ✅ `$props.id()` for unique IDs
- ✅ Component lifecycle: prefer `$effect` for mount/cleanup (return a teardown fn); `onMount` only for genuinely mount-only browser work
- ✅ Type props with interfaces: `interface Props { foo: string; children?: Snippet }` + `let { foo, children }: Props = $props();`
- ❌ Never use: `writable`/`readable`/`derived` from `svelte/store` (use runes), `beforeUpdate`/`afterUpdate`, `$$props`/`$$restProps` (use `let { ...rest } = $props()`), `$$slots`, `createEventDispatcher`, `<svelte:component>` (components are dynamic by default — render the variable directly)
- ❌ Never use: `export let`, `$:`, `<slot />`, `on:event`, `createEventDispatcher`

---

## Global "do not" list

- ❌ Do not install GSAP, Framer Motion, Motion One, or any animation library. Svelte built-ins only.
- ❌ Do not use `localStorage` / `sessionStorage` for auth state.
- ❌ Do not hardcode company name, logo, tagline — always use `SITE_CONFIG`.
- ❌ Do not use raw `fetch` for the API — always use the typed client in `src/lib/api/client.ts`.
- ❌ Do not put access-control role checks in `.svelte` component logic.
- ❌ Do not edit `src/lib/types/openapi-types.ts` — it is generated from the backend.
- ❌ Do not use raw hex colors or SCSS color variables in components — use semantic CSS tokens (see `DESIGN_SYSTEM.md`).
- ❌ Do not install a UI component library (Tailwind, Skeleton, etc.) without discussing first.
- ❌ Do not use Svelte 4 syntax — this project is Svelte 5, runes mode enforced globally.
