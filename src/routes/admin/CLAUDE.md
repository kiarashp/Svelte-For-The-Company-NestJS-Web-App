# src/routes/admin/CLAUDE.md — CMS Panel

Everything under `/admin`. Assumes root `CLAUDE.md`, `DESIGN_SYSTEM.md`, and `src/CLAUDE.md`
are already read.

The admin panel is the authenticated content-management area for `admin`, `author`, and `editor`
roles. Plain `user` and anonymous visitors must never reach it.

---

## Gate the whole section

Put the guard in `src/routes/admin/+layout.server.ts` so every admin route inherits it:

```ts
import { redirect, error } from '@sveltejs/kit';

const STAFF = new Set(['admin', 'author', 'editor']);

export const load = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/login');
  if (!STAFF.has(locals.user.role)) throw error(403, 'Staff access only');
  return { user: locals.user };
};
```

Per-route guards then narrow further (e.g. user-management is admin-only).

---

## Permission matrix (frontend intent)

> ⚠️ Inferred from OpenAPI endpoint names, **not** from backend `@Roles()` guards. The backend is
> authoritative — handle `403` gracefully and treat it as truth over this table.

| Area | admin | author | editor | user |
|---|:--:|:--:|:--:|:--:|
| Create post | ✅ | ✅ | ❌ | ❌ |
| Edit **own** post | ✅ | ✅ | ✅ | ❌ |
| Edit **any** post | ✅ | ❌ | ✅ | ❌ |
| Delete post | ✅ | own only | ❌ | ❌ |
| Manage tags | ✅ | ? | ? | ❌ |
| Upload post images | ✅ | own posts | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Change user roles | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ |
| Manage avatar options | ✅ | ❌ | ❌ | ❌ |
| Create/edit/delete product | ✅ | ❌ | ❌ | ❌ |
| Upload product image | ✅ | ❌ | ❌ | ❌ |
| Create/edit/delete product type | ✅ | ❌ | ❌ | ❌ |

Cells marked `?` are unverified from the types — confirm against the backend before relying on them.
The product rows are **not** inferred: the OpenAPI descriptions state these endpoints are "admin only"
explicitly, so authors/editors get no product write access.

### Ownership logic

- **author**: may edit/delete a post only if `post.author.id === locals.user.id`. Compute this in
  the server `load` and pass an `canEdit` / `canDelete` boolean to the component; don't recompute
  ownership in the UI.
- **editor**: may edit any post, but **cannot** create or delete. Hide create/delete affordances
  for editors and guard the corresponding routes/actions server-side.
- **admin**: no ownership restriction.

---

## Relevant backend endpoints (from openapi-types.ts)

### Posts
- `GET /posts` — list (public listing; admin list may need its own filtering)
- `GET /posts/my` — current user's own posts (the author dashboard list)
- `GET /posts/{id}` — single post
- `GET /posts/slug/{slug}` — by slug (public detail)
- `POST /posts` — create (admin, author)
- `PATCH /posts/{id}` — update (admin, editor, or owning author)
- `DELETE /posts/{id}` — delete (admin, or owning author)
- `POST /posts/{id}/tags` / `DELETE /posts/{id}/tags` — add/remove tags
- `GET /posts/{id}/images` / `POST /posts/{id}/images` — list/upload images

### Tags
- `GET /tags`, `POST /tags`, `PATCH /tags/{id}`, `DELETE /tags/{id}`, `DELETE /tags/soft/{id}`

### Users (admin)
- `GET /users` (paginated: `?page&limit`), `POST /users`, `POST /users/create-many`
- `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}`
- `PATCH /users/{id}/role` — change role (admin only)
- `GET /users/me`, `PATCH /users/me` — current user profile
- `PATCH /users/avatar` — select predefined avatar
- `GET /users/avatar-options`, `POST /users/avatar-options`, `DELETE /users/avatar-options/{id}` (admin manage)
- `GET /users/{id}/profile` — public author/editor profile

### Audit logs (admin)
- `GET /audit-logs`

### Meta options
- `GET /meta-options/{id}`, `PATCH /meta-options/{id}`, `DELETE /meta-options/{id}`

### Products (writes admin-only; reads public; lists **are paginated**)
- `GET /products` — published list; filters `productTypeId` | `typeSlug`, `q`, `sort` (`newest`/`oldest`/`name`), `specs[...]`; **paginated** (`page`/`limit`, `{ data, meta, links }` envelope)
- `GET /products/admin` — full list **including drafts** (the admin product list source); same paginated envelope
- `GET /products/slug/{slug}`, `GET /products/{id}` — single product
- `POST /products` — create (admin); `409` on duplicate slug or SKU
- `PATCH /products/{id}` — update (admin)
- `DELETE /products/{id}` — soft-delete (admin)
- `POST /products/{id}/image` — upload main image (admin), **multipart** — same handling as post images

### Product types (writes admin-only; reads public; list is a **bare array**)
- `GET /product-types` — **not paginated**: `data` is a plain `ProductType[]`. Each type carries `productCount` (published-product count) and its `filterableFields`.
- `GET /product-types/slug/{slug}`, `GET /product-types/{id}` — single type
- `POST /product-types`, `PATCH /product-types/{id}` — create / update (admin)
- `DELETE /product-types/{id}` — delete (admin); `409` if products still reference the type

---

## Post model facts (from DTOs)

- **postType**: `post` | `page` | `story` | `series` (required on create)
- **status**: `draft` | `scheduled` | `review` | `published`
- `publishOn` is an ISO date-time — relevant when `status = scheduled`.
- `slug` — generate from title if the user doesn't supply one; ensure uniqueness server-side.
- `tags` on create/patch is an array of tag identifiers.
- `content` is the body; `schema` is a serialized JSON string for structured meta.
- `featuredImage` is a URL string. Additional images go through `POST /posts/{id}/images`.

### Status workflow (UI guidance)

- `draft` → editable, not public.
- `review` → author submits; editors act on these.
- `scheduled` → has a future `publishOn`.
- `published` → live on the public site.

Map these to clear status badges and sensible default filters (e.g. author dashboard defaults to
their drafts + review; admin sees all).

---

## Product model facts (from the typed schemas)

- **Product**: `id`, `name`, `slug` (unique site-wide), `productTypeId`, `shortDescription`
  (card/search text), `description` (**plain text** — render `white-space: pre-wrap`, no sanitize),
  `sku`, `imageUrl` (main), `images[]` (gallery URLs), `specs` (JSONB), `isPublished`, timestamps,
  `deletedAt?`. The **`productType` object is embedded** on every read — no extra fetch to show the
  type on a product.
- Draft vs published is a single boolean `isPublished` — there is no multi-stage post-style status
  workflow. Admin list pulls `GET /products/admin` to see drafts; the public site never does.
- **`specs` is keyed by the product type's `filterableFields`** — a product's spec keys must match
  the facet `key`s defined on its type. Changing a product's type invalidates its existing specs.
- **ProductType**: `id`, `name`, `slug`, `productCount` (published-product count, for landing
  cards), `filterableFields[]` where each facet is
  `{ key, label, type: 'number' | 'enum' | 'string', unit?, options?: string[] }`
  (number → range, enum → dropdown, string → text).
- **Write DTOs are mistyped.** `CreateProductDto`/`UpdateProductDto` type `description`, `sku`,
  `imageUrl`, `images`, `specs` as `Record<string, never>`, and the product-type DTOs type
  `filterableFields` the same way. Build the real payload in the action and **cast** — reads are
  correct, only the request types are wrong. (See `src/CLAUDE.md`.)

### Two admin builds specific to products

- **Facet editor** (product-type create/edit): edit `filterableFields` as repeatable rows
  (`key`, `label`, `type`, `unit?`, `options?`). This is what defines a type's filters and the spec
  keys its products may use.
- **Dynamic specs form** (product create/edit): after the type is chosen, render one input per
  facet from that type's `filterableFields` (number input for `number`, select for `enum`, etc.) and
  collect them into the `specs` object. Don't hardcode spec fields — derive them from the type.

---

## Forms & actions

- Use SvelteKit **form actions** in `+page.server.ts` for all mutations (create/update/delete).
- Validate on the server inside the action; mirror the DTO field rules from `openapi-types.ts`.
- Call the backend via `serverApi(fetch)` (see `src/CLAUDE.md`).
- Surface backend validation errors back to the form; don't swallow them.
- Image upload is multipart — handle the file in the action, forward to the backend. Posts use
  `POST /posts/{id}/images` (gallery); products use `POST /products/{id}/image` (the single main
  image), returning the product with its updated `imageUrl`.

---

## Admin UI conventions

- Reuse the design tokens and semantic colors from `DESIGN_SYSTEM.md` — the admin panel is themed
  exactly like the public site (day/night included).
- Tables: paginate anything backed by a paginated endpoint (`/users`, `/products`, `/products/admin`
  all support `page`/`limit`). `/product-types` is a bare array — no pagination.
- Destructive actions (delete user/post, change role) require an explicit confirm step.
- Show role- and ownership-derived affordances from server-provided booleans, never from
  client-side role math.

---

## Don'ts (admin-specific)

- ❌ Don't expose admin-only endpoints (users, roles, audit logs) to author/editor UIs.
- ❌ Don't let editors see create/delete post controls.
- ❌ Don't compute post ownership in the component — get it from the server load.
- ❌ Don't assume the inferred permission matrix is correct where backend `403` says otherwise.
