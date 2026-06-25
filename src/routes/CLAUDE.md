# src/routes/CLAUDE.md — Public Site

Conventions for the public-facing, non-admin routes. Assumes root `CLAUDE.md`,
`DESIGN_SYSTEM.md`, and `src/CLAUDE.md` are read. (`/admin` has its own `CLAUDE.md` that
overrides for that subtree.)

The public site is what anonymous visitors and signed-in `user`s see. It is content-driven:
the homepage and content pages render published material from the CMS.

---

## Rendering strategy

- **SSR-first.** Public content pages must render on the server for SEO and first-paint. Use
  `+page.server.ts` `load` to fetch content, not client-side `onMount` fetching.
- Use `serverApi(fetch)` for all content fetches in `load` (see `src/CLAUDE.md`).
- Only published content is public. When listing/fetching, rely on the backend to scope to
  `published`; never render `draft`/`review`/`scheduled` content on public routes.

---

## Expected public routes

> ⚠️ **Provisional — not yet agreed.** The list below is a likely shape, **not** an approved page
> inventory. Do not build a page until it's confirmed and the blocking question removed from `OPEN_QUESTIONS.md`.
> The actual set of pages and what each contains is decided with the human (see `OPEN_QUESTIONS.md` → "Page inventory").
> Do not invent pages, sections, or content.

These are conventions for *how* routes are structured once agreed, not a mandate to build them all:

```
src/routes/
  +page.svelte               # homepage (hero, featured content)
  +layout.svelte             # public shell: header, footer, ThemeToggle
  blog/
    +page.server.ts          # list published posts (GET /posts, paginated)
    +page.svelte
    [slug]/
      +page.server.ts        # GET /posts/slug/{slug}
      +page.svelte           # post detail
  authors/
    [id]/
      +page.server.ts        # GET /users/{id}/profile (public author/editor profile)
      +page.svelte
  contact/
    +page.server.ts          # form action → POST /contact
    +page.svelte
  login/  register/          # auth entry points
```

Adjust naming to taste, but keep content detail on a `[slug]` route (slugs come from the backend).

---

## Content rendering rules

- **Post detail** comes from `GET /posts/slug/{slug}`. Render `content`; show `featuredImage`,
  tags, author, and publish date when present.
- `content` may be HTML or rich text from the CMS — sanitize before rendering if it can contain
  user/author HTML. Never inject unsanitized HTML with `{@html}`.
- `postType` (`post` | `page` | `story` | `series`) may warrant different layouts later; for now
  treat them uniformly unless told otherwise.
- Use `SITE_CONFIG` for all brand chrome (name, logo, tagline, social links, support email).

---

## SEO

- Set `<title>` and meta description per page via `<svelte:head>`, driven by content + `SITE_CONFIG`.
- Post detail pages should set Open Graph tags (title, description, `featuredImage`).
- Canonical URLs use the slug.

---

## Auth-aware UI

- Header shows login/register when `!page.data.user`, and account/sign-out when signed in.
- Staff (`admin`/`author`/`editor`) see an entry link to `/admin`; plain `user` does not.
- These are UI hints from `page.data.user` (`import { page } from '$app/state'`) — the real gate is in `/admin`'s server guard.

---

## Animations on the public site

This is where the "cool animations" focus lives. Svelte-native only (per `src/CLAUDE.md`):

- Hero and section entrances: `fly` / `fade` with the motion tokens.
- Scroll-reveal: use an `IntersectionObserver` action in `src/lib/utils/` that toggles a class,
  then animate with CSS transitions + `--ease-out`. (No scroll-animation libraries.)
- List/grid reordering or filtering (e.g. blog by tag): `animate:flip`.
- Always gate non-essential motion behind `prefers-reduced-motion`.

---

## Don'ts (public-specific)

- ❌ Don't fetch content client-side for primary page content — SSR it.
- ❌ Don't render non-published content publicly.
- ❌ Don't `{@html}` untrusted content without sanitizing.
- ❌ Don't hardcode brand strings — use `SITE_CONFIG`.
