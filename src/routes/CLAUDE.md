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
  products/
    +page.server.ts          # GET /product-types → directory of type cards (landing; uses productCount)
    +page.svelte
    all/
      +page.server.ts        # GET /products (all types) — sort + pagination only, NO spec filters
      +page.svelte
    [typeSlug]/
      +page.server.ts        # GET /product-types/slug/{typeSlug} + GET /products?typeSlug=…(+specs/q/sort/page)
      +page.svelte           # filtered list; filters built from type.filterableFields
      [productSlug]/
        +page.server.ts      # GET /products/slug/{productSlug}
        +page.svelte         # detail: gallery, specs table, description, related (same type)
  login/  register/          # auth entry points
```

Adjust naming to taste, but keep content detail on a `[slug]` route (slugs come from the backend).

> **Products are agreed** (structure above), even though the rest of Phase 3's inventory is still
> provisional: `/products` is a **directory of product-type cards** (no products listed there), each
> type has its own filtered list page, and detail lives at the **nested**
> `/products/[typeSlug]/[productSlug]`. There is a filter-less **`/products/all`** list (sort +
> pagination only — spec filters need a single-type context), but **no** unified "all products with
> every *spec* filter" page (those filters differ too much between types). Note the static `all/`
> route outranks `[typeSlug]/` in SvelteKit, so `all` is a reserved (non-usable) product-type slug.
> The read schemas are fully typed; the only remaining blockers are Q11 (pagination UX) for the
> paginated lists and Q-PAGES-3 (nav). See `STATE.md` → Phase 5.

---

## Content rendering rules

- **Post detail** comes from `GET /posts/slug/{slug}`. Render `content`; show `featuredImage`,
  tags, author, and publish date when present.
- `content` may be HTML or rich text from the CMS — sanitize before rendering if it can contain
  user/author HTML. Never inject unsanitized HTML with `{@html}`.
- `postType` (`post` | `page` | `story` | `series`) may warrant different layouts later; for now
  treat them uniformly unless told otherwise.
- Use `SITE_CONFIG` for all brand chrome (name, logo, tagline, social links, support email).

### Product rendering rules

- Products are admin-curated content. **Product `description` is plain text** — render it with
  `white-space: pre-wrap` to preserve line breaks. Do **not** use `{@html}` and no sanitization is
  needed. (A rich-text editor may be added later if a field ever needs formatting.)
- **Product lists are paginated** — `GET /products` returns a `{ apiVersion, data: { data, meta,
  links } }` envelope. Read items from `data.data.data` and pagination from `data.data.meta`; send
  `page`/`limit` plus the filters (`typeSlug`, `specs[...]`, `q`, `sort`) as query params in the
  `load`. Paging control style follows Q11. (`GET /product-types` is a bare array — not paginated.)
- Each product embeds its `productType` on read — no extra fetch needed to show the type.
- The **per-type filter UI** is built from `type.filterableFields` (number facets → min/max range or
  exact; enum → dropdown; string → text/exact). Don't hardcode filter fields — derive them from the type.
- **`/products/all`** is the cross-type catalog list: **sort + pagination only, no spec filters**
  (spec filters require a single-type context). `all` is a reserved product-type slug (the static
  route wins over `[typeSlug]`).
- **Related products** on a detail page = `GET /products?typeSlug=…` for the same type, excluding the
  current product's slug.
- The spec filters serialize to bracket-nested query params (`specs[key]=v`,
  `specs[key][min]=…&specs[key][max]=…`) — see `src/CLAUDE.md` for the serializer note.

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
- A top-level **Products** link (→ `/products`) is expected in the header nav; the full nav set is
  still pending Q-PAGES-3.

---

## Animations on the public site

This is where the "cool animations" focus lives. Svelte-native only (per `src/CLAUDE.md`):

- Hero and section entrances: `fly` / `fade` with the motion tokens.
- Scroll-reveal: use an `IntersectionObserver` action in `src/lib/utils/` that toggles a class,
  then animate with CSS transitions + `--ease-out`. (No scroll-animation libraries.)
- List/grid reordering or filtering (e.g. blog by tag): `animate:flip`.
- Always gate non-essential motion behind `prefers-reduced-motion`.

---

## Internal navigation links

Always use `resolve()` from `$app/paths` for `<a href>` values that point to internal routes.
The `svelte/no-navigation-without-resolve` ESLint rule (enabled in recommended config) enforces
this so links work correctly regardless of the app's `base` path setting.

```svelte
<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<a href={resolve('/login')}>Sign in</a>
```

Plain string literals like `href="/login"` will fail the lint gate.

---

## Don'ts (public-specific)

- ❌ Don't fetch content client-side for primary page content — SSR it.
- ❌ Don't render non-published content publicly.
- ❌ Don't `{@html}` untrusted content without sanitizing.
- ❌ Don't hardcode brand strings — use `SITE_CONFIG`.
- ❌ Don't use plain string literals for internal `<a href>` — wrap with `resolve()` from `$app/paths`.
