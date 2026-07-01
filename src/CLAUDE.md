# src/CLAUDE.md — Frontend Architecture

Detail for everything under `src/`. Assumes you've read root `CLAUDE.md` and `DESIGN_SYSTEM.md`.

---

## Folder layout

```
src/
  app.html               # no-flash inline theme script in <head> (see DESIGN_SYSTEM.md)
  app.d.ts               # App.Locals (user, theme, accessToken) + App.PageData
  hooks.server.ts        # auth resolution + token refresh + data-theme injection
  lib/
    api/
      client.ts          # openapi-fetch typed client (api singleton + serverApi factory)
    config/site.ts       # SITE_CONFIG branding (root CLAUDE.md)
    components/          # shared PascalCase.svelte components
    state/
      theme.svelte.ts    # theme preference — module-level $state + cookie helpers
    styles/
      tokens.css         # primitives + semantic + non-color tokens
      global.css         # base reset; @import './tokens.css' at the top
    types/openapi-types.ts  # AUTO-GENERATED — never edit
    utils/
  routes/
    +layout.server.ts    # exposes user + theme into page.data
    +layout.svelte       # imports global.css, mounts matchMedia listener
    admin/               # CMS (own CLAUDE.md)
```

---

## API client — `src/lib/api/client.ts`

Use `openapi-fetch`, typed from the generated `paths`. The cookie carries auth, so the client
config differs between server and client contexts.

```ts
// src/lib/api/client.ts
import createClient from 'openapi-fetch';
import type { paths } from '$lib/types/openapi-types';
import { PUBLIC_API_URL } from '$env/static/public';

/** Browser client — access token is HttpOnly and never readable client-side. */
export const api = createClient<paths>({
  baseUrl: PUBLIC_API_URL,
  credentials: 'include',
});

/**
 * Server client for load functions and actions.
 * Pass event.fetch (forwards cookies) and locals.accessToken (adds Bearer header).
 */
export function serverApi(fetchFn: typeof fetch, accessToken?: string | null) {
  return createClient<paths>({
    baseUrl: PUBLIC_API_URL,
    fetch: fetchFn,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}
```

### Rules

- In `load`, `+page.server.ts`, actions → `serverApi(fetch, locals.accessToken)`.
- In `hooks.server.ts` → raw `fetch` with manual Bearer header (before locals are set).
- In `.svelte` components / client code → `api` singleton (public/unauthenticated endpoints only).
- Never call `fetch` against the backend directly. Always go through these.
- **Always check `error` / `response.ok`, never destructure only `data`.** A failed request
  (400/401/403/500) still resolves without throwing — `data` is simply `undefined`, which looks
  identical to "the list is genuinely empty." The admin post list shipped with this bug: it read
  only `data`, so a backend `400` on `GET /posts/admin` silently rendered "No posts found" instead
  of surfacing the real error. Every `load`/action that reads `data` from a typed client call must
  branch on `error`/`response.ok` first and surface a message (via returned `loadError` in `load`,
  or `fail()` in an action) — don't let a failed fetch look like an empty result.

```ts
// example, authenticated server load
export const load: PageServerLoad = async ({ fetch, locals }) => {
  const client = serverApi(fetch, locals.accessToken);
  const { data, error, response } = await client.GET('/posts/my');
  if (error || !response.ok) {
    return { posts: [], loadError: `Could not load posts (${response.status}).` };
  }
  return { posts: data?.data?.data ?? [], loadError: null };
};
```

---

## Auth flow

### Registration endpoint
`POST /users` — public, no authentication required. NestJS creates the user, hashes the
password, and fires the email-verification event automatically. There is no separate
`/auth/signup` or `/auth/register` route.

### `hooks.server.ts`

Runs on every request, before any `load`:

1. Read `access_token` cookie → call `GET /users/me` with `Authorization: Bearer <token>`.
2. On `401`: read `refresh_token` cookie → `POST /auth/refresh-tokens` with `{ refreshToken }` in body → store new pair as HttpOnly cookies → retry `/users/me`. On refresh failure (401/403), delete both stale cookies so subsequent requests don't re-attempt two futile API calls.
3. Set `event.locals.user` (full shape defined in `app.d.ts` below) and `event.locals.accessToken`, or both `null`. These two are always a consistent pair — `accessToken` is only set when `user` is non-null.
4. Read `theme` cookie → `event.locals.theme`.
5. Inject `data-theme` onto `<html>` via `transformPageChunk` (SSR zero-flash for explicit `light`/`dark`; skip for `system` — the inline matchMedia script in `app.html` handles that).

**Google Identity Services (GIS) integration pattern:**
- Load the SDK dynamically in `onMount` via `document.createElement('script')` + `script.onload` — no polling, no `<svelte:head>` script block.
- In the GIS `callback`, call an `async function` that POSTs the credential directly with `fetch('?/google', { method: 'POST', body: formData })` → `deserialize` → `applyAction`. Never bridge the credential through a hidden DOM input (proxy timing issues cause the token to arrive empty).
- `POST /google-authentication` returns **409 Conflict** when the email already exists as a local account. Parse `res.status === 409` in the server action to show a specific message instead of the generic error.
- GIS warns about `initialize()` being called multiple times on HMR reloads. Guard with `if (window.google?.accounts?.id) return;` inside `script.onload` if it becomes noisy.

**Response envelope (universal):** every endpoint now returns `{ apiVersion?, data }`. Single
reads/writes put the entity at `data`; paginated lists put `{ data, meta, links }` at `data` (so
items are at `data.data`). This applies to auth, users, posts, tags, meta-options, audit, contact,
products, and product-types alike. `GET /users/me` is now typed `AdminUser` (no longer
`content?: never`), and the auth endpoints return typed `AuthTokensDto` / `MessageResponseDto`
envelopes — new code may use the typed client directly.

**Auth behaviors still NOT captured by the types** (keep handling these manually):
- `POST /auth/sign-in` — returns `401` for both wrong credentials AND unverified email (the `401`
  body isn't typed). Distinguish by parsing the body: unverified contains `"verify"` in
  `body.message`; wrong credentials says `"Invalid credentials"`.
- `POST /auth/change-password` — authenticated; `403` means wrong current password.
- `POST /auth/resend-verification` & `POST /auth/forgot-password` — return a generic success
  regardless of whether the email exists, to avoid account enumeration.
- `POST /auth/reset-password` — token comes from `?token=` in the email link; pass it through a
  hidden form field. Keep `expired: boolean` in every `fail()` return so the ActionData union stays
  consistent and `form.expired` is always readable.
- `POST /auth/sign-in` is **tightly throttled** (confirmed via e2e testing — a handful of requests
  per ~20-30s window, backend returns `429` + a `Retry-After` header). The login action's generic
  `!res.ok` branch maps a `429` onto the same "Sign-in failed. Please try again." message as any
  other non-401 failure — there's no user-facing "too many attempts, try again in Xs" distinction
  today. Worth knowing if a user reports login "randomly" failing during rapid retries.
- `POST /users` (registration) success redirects straight to `/login` with **no confirmation
  message** — there is no "check your email" state in the UI. The backend fires the verification
  email regardless; the frontend just doesn't say so.

**Auth-route code / `hooks.server.ts` parse `res.json()` manually** (written against the older
`content?: never` types). The manual parse is fine, but **you must still read the entity from
`.data`** — every response is enveloped as `{ apiVersion?, data }` (see "API response envelope" in
root `CLAUDE.md`). Casting `res.json()` straight to the entity type skips the envelope and yields an
object with every field `undefined` — e.g. `GET /users/me` → `locals.user.role` came back
`undefined` and silently 403'd all staff. The correct unwrap is `(await res.json()).data`.

**Product / product-type read responses are fully typed** (unlike the auth endpoints). Every
response is wrapped in a `{ apiVersion?, data? }` envelope:

- **Single reads** (and create / update / image upload) — `data` *is* the entity. With
  openapi-fetch: `const { data } = await client.GET('/products/slug/{slug}', …)` → `data?.data` is
  the `Product` (schema `components['schemas']['Product']`).
- **Product lists** (`GET /products`, `GET /products/admin`) — **paginated**. `data` is
  `{ data: Product[], meta, links }`: items at `data?.data?.data`, pagination at `data?.data?.meta`
  (`itemsPerPage`, `totalItems`, `currentPage`, `totalPages`, `hasNextPage`, `hasPrevPage`). Send
  `page` / `limit` as typed query params. (Paging UX is Q11 in `OPEN_QUESTIONS.md`.)
- **Product-types list** (`GET /product-types`) — a **bare `ProductType[]`** at `data?.data` (not
  paginated). `ProductType` carries `productCount` (published-product count, for the landing cards)
  and an embedded `filterableFields` facet array.

Two caveats remain:

- **Write DTOs are mistyped.** `CreateProductDto` / `UpdateProductDto` type `description`, `sku`,
  `imageUrl`, `images`, `specs` as `Record<string, never>`, and the product-type DTOs type
  `filterableFields` the same way (a leftover generator artifact). Build the real payload
  (`description: string`, `images: string[]`, `specs: object`, `filterableFields:
  FilterableFieldDto[]`) and **cast** in the admin actions. Do **not** edit `openapi-types.ts`.
  Also note `isPublished` is typed **required** on *both* product DTOs (only field without `?`) —
  another generator quirk; an update payload must include it, or cast around it.
- **`PATCH /product-types/{id}` is a constrained diff, not a free-form patch.** You must send the
  **complete** `filterableFields` array; the backend diffs it and allows facets to be **added or
  removed only** — an existing facet's `key`/`type` are immutable (change → `400`), and removing a
  facet/option that products still use → `409`. Full rules + the facet-editor UI implications live
  in `src/routes/admin/CLAUDE.md` → "Updating a saved product type".
- The `GET /products` **spec filter** query is bracket-nested (`specs[key]=v` for enum/string,
  `specs[key][min]=…&specs[key][max]=…` for number ranges) and must be sent alongside a type context
  (`typeSlug` or `productTypeId`). `openapi-fetch`'s default serializer won't produce this shape — a
  small dedicated serializer util is needed (Phase 5 step in `STATE.md`). Put it in `src/lib/utils/`
  (e.g. `productQuery.ts`), per the utilities convention.

```ts
// app.d.ts — canonical App.Locals['user'] shape
declare global {
  namespace App {
    interface Locals {
      user: {
        id: number;
        firstName: string;
        lastName: string | null;
        email: string;
        role: 'admin' | 'author' | 'editor' | 'user';
        isEmailVerified: boolean;
        avatarUrl?: string;
        bio?: string | null;
      } | null;
      theme: 'light' | 'dark' | 'system';
      accessToken: string | null; // server-only — never exposed to page.data
    }
    interface PageData {
      user: App.Locals['user'];
      theme: 'light' | 'dark' | 'system';
    }
  }
}
export {};
```

### `routes/+layout.server.ts`

Expose user + resolved theme to the whole app:

```ts
export const load = async ({ locals }) => ({
  user: locals.user,
  theme: locals.theme,
});
```

Now `page.data.user` and `page.data.theme` are available everywhere (via `import { page } from '$app/state'`).

### Access control

- Guard in server `load` using `locals.user`. Redirect or `error(403)` as appropriate.
- Components use `page.data.user` (from `import { page } from '$app/state'`) only to show/hide UI — never as the access gate.
- Treat backend `401`/`403` as authoritative; surface them gracefully.

```ts
// example route guard
import { redirect } from '@sveltejs/kit';
export const load = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/login');
  return {};
};
```

---

## Shared state

- Keep shared state minimal. Auth state comes from `page.data` (via `import { page } from '$app/state'`) — don't duplicate it in a module.
- `src/lib/state/theme.svelte.ts` holds module-level `$state` for the current preference plus
  cookie read/write helpers. Import `getPreference` / `setPreference` / `getResolved` from it.
  Components do not need local state or `onMount` — the module state is reactive.
  **Import convention:** when using a `$lib` alias, omit the `.ts` extension:
  `import { getPreference } from '$lib/state/theme.svelte'` — TypeScript resolves `theme.svelte.ts`
  automatically; the `.ts` suffix on an alias path causes a type-check error.
- When state genuinely needs to be shared across files, use a `.svelte.ts` module with runes
  (`$state` / `$derived`) — never `svelte/store` (`writable` / `readable` / `derived`).
- Prefer derived UI state in components over shared modules unless it is genuinely cross-component.

---

## Animations — Svelte-native only

No external animation libraries. Use the built-ins:

- `transition:fade|fly|slide|scale` for enter/leave.
- `animate:flip` for list reordering.
- `tweened` / `spring` (from `svelte/motion`) for interpolated values.
- `crossfade` for shared-element transitions between routes.

Always respect reduced motion:

```svelte
<script lang="ts">
  import { fly } from 'svelte/transition';
  import { prefersReducedMotion } from '$lib/utils/motion';
  let show = $state(false);
  let t = $derived(prefersReducedMotion() ? { duration: 0 } : { y: 20, duration: 250 });
</script>
{#if show}<div in:fly={t}>…</div>{/if}
```

Use the motion tokens from `DESIGN_SYSTEM.md` (`--duration-*`, `--ease-out`) for CSS transitions.

---

## Theme toggle

- `src/lib/components/ThemeToggle.svelte` — three-way Light/Dark/System control.
- On change: write `theme` cookie + set `<html data-theme>` to resolved value.
- The `matchMedia('change')` listener (for live system updates) is mounted once in
  `routes/+layout.svelte`. See `DESIGN_SYSTEM.md` for the exact mechanism.

---

## Svelte 5 — required throughout

All `.svelte` files in this project run in **runes mode** (enforced in `vite.config.ts`).
Use Svelte 5 APIs exclusively:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  // Props — type via an interface, never the $props<...>() generic form
  interface Props {
    title: string;
    children: Snippet;
  }
  let { title, children }: Props = $props();

  // State
  let open = $state(false);
  // Derived
  let label = $derived(open ? 'Close' : 'Open');
  // Effects (return a cleanup fn when needed)
  $effect(() => { document.title = title; });
</script>

<!-- Render children (slot equivalent) -->
{@render children()}

<!-- Optional/named content: snippets, not slots -->
{#snippet badge(text: string)}<span class="badge">{text}</span>{/snippet}
{@render badge('new')}

<!-- Events (no on:click) -->
<button onclick={() => (open = !open)}>{label}</button>
```

- `import { page } from '$app/state'` — **not** `$app/stores`
- Component callbacks are **props**, not events: `let { onsave } = $props()` → call `onsave?.(data)`. No `createEventDispatcher`.
- Two-way binding only via `$bindable()`, and only where a parent genuinely needs it.
- `$state` objects/arrays are deeply reactive — mutate in place (`items.push(x)`); don't reassign to "trigger" updates.
- Shared reactive logic lives in `.svelte.ts` files using runes — **not** `svelte/store`. No `writable`/`readable`/`derived`.
- `$derived.by(() => {…})` for multi-line derivations; `$effect.pre()` instead of `beforeUpdate`.
- Prefer `$effect` (return a cleanup fn) over `onMount` unless the work is strictly mount-only browser code.
- No `export let`, no `$:`, no `<slot />`, no `on:event`, no `createEventDispatcher`.

### Legacy → runes conversion table

| Concept | ❌ Legacy (forbidden) | ✅ Svelte 5 runes (required) |
|---|---|---|
| Reactive state | `let count = 0;` (implicit) | `let count = $state(0);` |
| Props | `export let title;` | `let { title } = $props();` |
| Prop with default | `export let title = 'x';` | `let { title = 'x' } = $props();` |
| Renamed/reserved prop | `export let klass;` | `let { class: klass } = $props();` |
| Rest props | `$$restProps` | `let { foo, ...rest } = $props();` |
| All props object | `$$props` | `let props = $props();` |
| Derived value | `$: double = count * 2;` | `let double = $derived(count * 2);` |
| Derived (multiline) | `$: { ... }` | `let x = $derived.by(() => { ... });` |
| Side effect | `$: if (count > 5) {...}` | `$effect(() => { if (count > 5) {...} });` |
| DOM events | `on:click={fn}` | `onclick={fn}` |
| Event modifiers | `on:click\|preventDefault` | `e.preventDefault()` inside the handler |
| Component events | `createEventDispatcher()` | callback prop: `let { onsave } = $props();` |
| Slots (default) | `<slot />` | `{@render children()}` + `let { children } = $props();` |
| Named slots | `<slot name="header" />` | `{@render header()}` as a snippet prop |
| Slot fallback | `<slot>fallback</slot>` | `{#if children}{@render children()}{:else}fallback{/if}` |
| Passing markup in | `<div slot="x">` | `{#snippet x()}...{/snippet}` |
| Two-way bindable | `export let value;` (implicit) | `let { value = $bindable() } = $props();` |
| Lifecycle reactivity | `beforeUpdate`/`afterUpdate` | `$effect.pre` / `$effect` |
| Store auto-subscribe | `$store` | `$state`/`$derived` in a `.svelte.ts` module |

`onMount`, `onDestroy`, `tick`, `getContext`/`setContext` are **not** legacy — still valid.

### `let` not `const` for rune declarations

Always use `let` for rune bindings (`let count = $state(0)`, `let { x } = $props()`).
The compiler rewrites runes into getters/setters — `const` would break that. The ESLint
config already turns off `prefer-const` inside `.svelte` files.

### Debugging — when something isn't working

- **Reactivity not updating?** Don't add `$:`. Check the source is `$state`. Arrays/objects
  are deeply reactive — mutate directly (`arr.push(x)`, `obj.x = 1`), don't reassign.
- **`export let` error?** Convert *all* props in that file to `$props()`. Don't remove the
  `$state` that triggered runes mode.
- **Need a computed value?** Use `$derived`, never a manually re-run function or `$:`.
- **Effect loops / runs too often?** Narrow dependencies, use `untrack()`, or move pure
  computation into `$derived` (never mutate state inside `$derived`).
- **Sharing state across files?** Use a `.svelte.ts` module with runes — not a store.

### Self-check before writing any Svelte code

- About to type `export let`? → `$props()`
- About to type `$:`? → `$derived` or `$effect`
- About to type `on:`? → plain event attribute (`onclick`)
- About to type `<slot`? → `{@render ...}` + snippets
- About to type `createEventDispatcher`? → callback prop
- Reaching for legacy because runes "isn't working"? → **STOP** — the bug is in the rune usage, fix that

**Guiding principles:**
1. Runes everywhere — any reactivity (props, state, derived, effects, shared modules) uses runes. If you reach for a store, stop and use `$state` in a `.svelte.ts` module instead.
2. Data flows down via props, up via callback props. No event dispatching, no two-way binding unless `$bindable` is explicitly intended.

---

## SvelteKit form actions

- When a `+page.server.ts` has **any named action**, the `default` action is **forbidden** — SvelteKit will throw at runtime. Give every action an explicit name (`login`, `google`, etc.) and point forms at `action="?/name"`.
- Consequence: the email/password login form must use `action="?/login"`, not the bare `method="POST"` that implies `default`.

### Form submission method — critical

`use:enhance` intercepts the **`submit` event**. Only these two paths fire it:

| Method | Fires `submit`? | `use:enhance` works? |
|---|:--:|:--:|
| User clicks `<button type="submit">` | ✅ | ✅ |
| `form.requestSubmit()` | ✅ | ✅ |
| `form.submit()` | ❌ | ❌ — full-page POST, bypasses everything |

**Never call `form.submit()`.** It skips the `submit` event entirely, so `use:enhance` is never invoked — the browser does a raw full-page navigation, `fail()` handling and client-side redirects don't work, and the page reloads.

**When JavaScript (not a button) must trigger submission** (e.g. a third-party SDK callback like Google Identity Services, Stripe, etc.), choose one of:

1. `form.requestSubmit()` — fires the `submit` event; `use:enhance` intercepts it normally.
2. Skip the form entirely: `fetch('?/action', { method: 'POST', body: formData })` → `deserialize()` → `applyAction()`. This is the right choice when the credential/payload comes from a JS callback and you want to avoid bridging it through a DOM input.

Avoid hybrid patterns (attaching `use:enhance` to a form but submitting with `form.submit()`) — they add complexity while gaining nothing.

---

## Don'ts (frontend-specific)

- ❌ Don't read or write tokens/auth in `localStorage`.
- ❌ Don't bypass `serverApi` / `api` with raw `fetch` to the backend. Exception: `hooks.server.ts` must use raw `event.fetch` because `locals` (and therefore `serverApi`) aren't set yet when the hook runs.
- ❌ Don't put role-based access gates in components.
- ❌ Don't add a global store for something a `load` already provides.
- ❌ Don't write Svelte 4 syntax — the compiler will reject it in runes mode.
- ❌ Don't import from `svelte/store` (`writable`/`readable`/`derived`) — use `$state` in a `.svelte.ts` module.
- ❌ Don't use `beforeUpdate`/`afterUpdate`, `$$props`, `$$restProps`, or `$$slots`. Use `let { ...rest } = $props()`.
- ❌ Don't dispatch events between components — pass callback props down.
- ❌ Don't reach for `$bindable` by default — data flows down via props, up via callbacks.