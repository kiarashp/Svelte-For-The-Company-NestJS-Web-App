# src/CLAUDE.md — Frontend Architecture

Detail for everything under `src/`. Assumes you've read root `CLAUDE.md` and `DESIGN_SYSTEM.md`.

---

## Folder layout

```
src/
  app.html               # theme inline script in <head> (see DESIGN_SYSTEM.md)
  hooks.server.ts        # auth resolution + token refresh + theme cookie read
  app.d.ts               # App.Locals types (user, theme)
  lib/
    api/
      client.ts          # openapi-fetch typed client factory
    config/site.ts       # SITE_CONFIG (root CLAUDE.md)
    components/          # shared PascalCase.svelte components
    stores/
      theme.ts           # theme preference cookie helpers
    styles/
      tokens.css         # primitives + semantic + non-color tokens
      _mixins.scss
      global.scss
    types/openapi-types.ts  # AUTO-GENERATED — never edit
    utils/
  routes/
    +layout.server.ts    # exposes user + resolved theme into $page.data
    +layout.svelte       # mounts matchMedia listener, imports global.scss
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
import { env } from '$env/static/public';

/**
 * Browser client. Cookie is HttpOnly and sent automatically with credentials: 'include'.
 */
export const api = createClient<paths>({
  baseUrl: env.PUBLIC_API_URL,
  credentials: 'include',
});

/**
 * Server client. Pass SvelteKit's event.fetch so cookies forward correctly within load/actions.
 */
export function serverApi(fetchFn: typeof fetch) {
  return createClient<paths>({
    baseUrl: env.PUBLIC_API_URL,
    fetch: fetchFn,
  });
}
```

### Rules

- In `load`, `+page.server.ts`, actions, `hooks.server.ts` → use `serverApi(event.fetch)`.
- In `.svelte` components / client code → use the `api` singleton.
- Never call `fetch` against the backend directly. Always go through these.
- Every call is typed. Use the path + method; the request/response shapes come from `paths`.

```ts
// example, server load
const client = serverApi(fetch);
const { data, error } = await client.GET('/posts', { params: { query: { page: 1 } } });
```

---

## Auth flow

### `hooks.server.ts`

Runs on every request, before any `load`:

1. Read the auth cookie.
2. Validate / refresh against the backend (refresh endpoint if access token expired).
3. Set `event.locals.user` (or `null`).
4. Also read the `theme` cookie → `event.locals.theme` (preference).

```ts
// app.d.ts
declare global {
  namespace App {
    interface Locals {
      user: { id: number; email: string; role: 'admin' | 'author' | 'editor' | 'user' } | null;
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

Now `$page.data.user` and `$page.data.theme` are available everywhere.

### Access control

- Guard in server `load` using `locals.user`. Redirect or `error(403)` as appropriate.
- Components use `$page.data.user` only to show/hide UI — never as the access gate.
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

## Stores

- Keep stores minimal. Auth state comes from `$page.data`, not a store — don't duplicate it.
- `src/lib/stores/theme.ts` holds only **preference read/write helpers** (cookie get/set) and the
  toggle logic. It does not hold auth.
- Prefer derived UI state in components over global stores unless genuinely shared.

---

## Animations — Svelte-native only

No external animation libraries. Use the built-ins:

- `transition:fade|fly|slide|scale` for enter/leave.
- `animate:flip` for list reordering.
- `tweened` / `spring` (from `svelte/motion`) for interpolated values.
- `crossfade` for shared-element transitions between routes.

Always respect reduced motion:

```svelte
<script>
  import { fly } from 'svelte/transition';
  import { prefersReducedMotion } from '$lib/utils/motion';
  $: t = prefersReducedMotion() ? { duration: 0 } : { y: 20, duration: 250 };
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
  // Props
  let { title, children } = $props<{ title: string; children: Snippet }>();
  // State
  let open = $state(false);
  // Derived
  let label = $derived(open ? 'Close' : 'Open');
  // Effects
  $effect(() => { document.title = title; });
</script>

<!-- Render slot equivalent -->
{@render children()}

<!-- Events (no on:click) -->
<button onclick={() => (open = !open)}>{label}</button>
```

- `import { page } from '$app/state'` — **not** `$app/stores`
- No `export let`, no `$:`, no `<slot />`, no `on:event`, no `createEventDispatcher`

---

## Don'ts (frontend-specific)

- ❌ Don't read or write tokens/auth in `localStorage`.
- ❌ Don't bypass `serverApi` / `api` with raw `fetch` to the backend.
- ❌ Don't put role-based access gates in components.
- ❌ Don't add a global store for something a `load` already provides.
- ❌ Don't write Svelte 4 syntax — the compiler will reject it in runes mode.
