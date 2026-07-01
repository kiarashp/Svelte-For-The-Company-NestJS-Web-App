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

> ✅ Confirmed from the API `403` descriptions in the regenerated `openapi-types.ts` (the backend
> lists the allowed roles in each forbidden response). The backend is still authoritative — handle
> `403` gracefully and treat it as truth over this table.

| Area | admin | author | editor | user |
|---|:--:|:--:|:--:|:--:|
| Create post | ✅ | ✅ | ✅ | ❌ |
| Edit / delete **own** post | ✅ | ✅ | own | ❌ |
| Edit / delete **any** post | ✅ | ✅ | ❌ | ❌ |
| Attach / detach tags **on** post | ✅ | ✅ | own | ❌ |
| Upload / delete post images | ✅ | ✅ | own | ❌ |
| Manage post meta-options | ✅ | own | own | ❌ |
| Manage **tag vocabulary** (`/tags` CRUD) | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Change user roles | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ |
| Manage avatar options | ✅ | ❌ | ❌ | ❌ |
| Create/edit/delete product | ✅ | ❌ | ❌ | ❌ |
| Upload / delete product image | ✅ | ❌ | ❌ | ❌ |
| Create/edit/delete product type | ✅ | ❌ | ❌ | ❌ |

Two separate "tag" capabilities — don't conflate them:
- **Attach/detach tags on a post** (`POST/DELETE /posts/{id}/tags`) → `editor, author, admin`;
  only **editor** is limited to their own posts — author/admin can tag/untag any post (same as
  edit/delete).
- **Tag vocabulary CRUD** (`POST /tags`, `PATCH /tags/{id}`, `DELETE /tags/{id}`, `DELETE
  /tags/soft/{id}`) → `author, admin` only. **Editors are excluded here per the API** — this is the
  one capability where `author > editor`. (If editors should manage the vocabulary too, that's a
  backend change.)

`editor == author` for everything post-related. The product rows are admin-only (explicit in the
OpenAPI descriptions), so authors/editors get no product write access.

### Ownership logic

Confirmed from the `PATCH/DELETE /posts/{id}` 403 descriptions in `openapi-types.ts`:
_"requires role: editor, author, admin; EDITOR limited to their own posts"_

- **admin & author (identical for posts)**: may edit/delete **any** post, and attach/detach tags or
  manage images on **any** post, regardless of who wrote it. Both can also **create** posts. Compute
  this in the server `load` and pass `canEdit` / `canDelete` booleans to the component.
- **editor**: same create/edit/delete/tag/image rights, but **limited to own posts** only
  (`post.author.id === locals.user.id`). Compute in the server `load` — don't recompute in the UI.
- **Meta-options are the one exception to "author == admin."** Both **editor and author** are
  restricted to their own post's meta-options there — only admin is unrestricted. (Backend reason:
  `MetaOption` write routes use a separate ownership constant that includes author, unlike every
  other post sub-resource.)
- The other real difference between author and editor: **author** can manage the tag vocabulary
  (`/tags` CRUD); **editor** cannot.

---

## Relevant backend endpoints (from openapi-types.ts)

### Posts
- `GET /posts` — list (public listing; admin list may need its own filtering)
- `GET /posts/my` — current user's own posts (the author dashboard list)
- `GET /posts/{id}` — single post, **published only** (mirrors the public by-slug endpoint) — not
  suitable for the admin edit form, which must be able to load drafts.
- `GET /posts/{id}/admin` — single post, **any status** (staff dashboard/edit-form load); same
  ownership rule as `PATCH /posts/{id}` (editor limited to own posts; author/admin unrestricted) —
  its 401/403/404 is authoritative, no separate ownership check needed on the frontend.
- `GET /posts/slug/{slug}` — by slug (public detail)
- `POST /posts` — create (admin, author, editor)
- `PATCH /posts/{id}` — update (admin, author, editor; author/editor own posts only)
- `DELETE /posts/{id}` — delete (admin, author, editor; author/editor own posts only)
- `POST /posts/{id}/tags` / `DELETE /posts/{id}/tags` — add/remove tags (admin, author, editor; editor limited to own posts, author/admin any)
- `GET /posts/{id}/images` / `POST /posts/{id}/images` — list/upload images (editor limited to own posts; author/admin any)
- `DELETE /posts/{id}/images/{fileId}` — delete a single post image (editor limited to own posts; author/admin any)

### Tags
- `GET /tags` — public list. **Vocabulary CRUD is `author, admin` only** (editors excluded):
  `POST /tags`, `PATCH /tags/{id}`, `DELETE /tags/{id}` (hard), `DELETE /tags/soft/{id}` (soft).

### Users (admin)
- `GET /users` (paginated: `?page&limit` **only** — no search/filter query param exists; the
  `/admin/users` list is pagination-only, no search box)
- `POST /users`, `POST /users/create-many`
- `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}`
- `PATCH /users/{id}/role` — change role (admin only) — **not yet consumed by the frontend**; the
  built `/admin/users` list/edit/delete (`src/routes/admin/users/`) deliberately shows role
  read-only everywhere and never calls this endpoint — role change is its own separate step.
- `GET /users/me`, `PATCH /users/me` — current user profile
- `PATCH /users/avatar` — select predefined avatar
- `GET /users/avatar-options`, `POST /users/avatar-options`, `DELETE /users/avatar-options/{id}` (admin manage)
- `GET /users/{id}/profile` — public author/editor profile

`DELETE /users/{id}` has **no backend guard against an admin deleting their own account** — the
frontend enforces this itself in `src/routes/admin/users/[id]/delete/+page.server.ts` (both `load`
and the `delete` action check `id === locals.user.id` and throw `403`), and the list template
omits the delete link on the signed-in admin's own row. If this endpoint ever gains its own
server-side self-delete guard, the frontend check becomes redundant but still harmless.

### Audit logs (admin)
- `GET /audit-logs`

### Meta options
- `GET /meta-options/{id}`, `PATCH /meta-options/{id}`, `DELETE /meta-options/{id}` — admin, author,
  editor; **both editor and author** are limited to their own post's meta-options here — the one
  post sub-resource where author is NOT treated like admin.

### Products (writes admin-only; reads public; lists **are paginated**)
- `GET /products` — published list; filters `productTypeId` | `typeSlug`, `q`, `sort` (`newest`/`oldest`/`name`), `specs[...]`; **paginated** (`page`/`limit`, `{ data, meta, links }` envelope)
- `GET /products/admin` — full list **including drafts** (the admin product list source); same paginated envelope
- `GET /products/slug/{slug}`, `GET /products/{id}` — single product
- `POST /products` — create (admin); `409` on duplicate slug or SKU
- `PATCH /products/{id}` — update (admin); `409` on duplicate slug or SKU (same as create)
- `DELETE /products/{id}` — soft-delete (admin)
- `GET /products/{id}/images` / `POST /products/{id}/images` — list/upload product images (admin),
  **multipart** — gallery, same handling as post images
- `DELETE /products/{id}/images/{fileId}` — delete a single product image (admin)

### Product types (writes admin-only; reads public; list is a **bare array**)
- `GET /product-types` — **not paginated**: `data` is a plain `ProductType[]`. Each type carries `productCount` (published-product count) and its `filterableFields`.
- `GET /product-types/slug/{slug}`, `GET /product-types/{id}` — single type
- `POST /product-types` — create (admin); `409` on duplicate name or slug
- `PATCH /product-types/{id}` — update (admin). **Constrained** — see "Updating a saved product type" below. `400` on an illegal facet change; `409` on duplicate name/slug **or** a blocked facet/option removal.
- `DELETE /product-types/{id}` — delete (admin); `409` if products still reference the type

#### Updating a saved product type (critical — the API enforces this)

`PATCH /product-types/{id}` is **not** a free-form edit. The backend diffs the `filterableFields`
array you send against what's stored and rejects illegal changes:

- **Send the complete field list**, always. The patch replaces the whole `filterableFields` array
  (it is diffed, not merged) — omitting a facet means "remove it", not "leave it untouched".
- **Facets are add/remove only.** You may add new facets or drop existing ones, but an existing
  facet's **`key` and `type` are immutable**. Changing either → **`400`** *"Illegal field change"*.
  (`label`, `unit`, and an enum's `options` list can still be edited on an existing facet.)
- **Removal is blocked while in use.** Removing a facet — or removing an `option` from an enum
  facet — returns **`409`** if any product still references that field/option. `name`/`slug`
  duplicates also surface as `409`; distinguish by the response message.
- **`name` and `slug` are freely editable** (subject to the uniqueness `409`).

Facet-editor UI must therefore, **on edit** (not create): lock `key` and `type` on existing rows,
allow editing `label`/`unit`/`options` and adding/removing whole rows, always submit the full
array, and surface `400`/`409` (especially "removal blocked because products use it") back to the
user instead of silently failing.

---

## Post model facts (from DTOs)

- **status**: `draft` | `scheduled` | `review` | `published` (there is no `postType` — a post is
  just a post).
- `publishOn` is an ISO date-time — relevant when `status = scheduled`.
- `slug` — generate from title if the user doesn't supply one; ensure uniqueness server-side.
- `tags` on create/patch is an array of tag identifiers. **Type quirk:** `CreatePostDto.tags` /
  `PatchPostDto.tags` are typed `string[]`, but `PostTagsDto.tagIds` (the `/posts/{id}/tags`
  endpoints) is `number[]` — convert accordingly in the editor.
- `content` is the **Markdown** body; `schema` is a serialized JSON string for structured meta.
- `featuredImage` is a URL string. Additional images go through `POST /posts/{id}/images`.

### Post create v1 — fields intentionally deferred

The Post create form (`/admin/posts/new`) deliberately omits three `CreatePostDto` fields — this
was a scope decision, not an oversight, so Post edit shouldn't assume they were missed:

- **`publishOn`** — no backend automation flips `scheduled` → `published` at that time yet, so a
  date picker for it would control nothing.
- **`featuredImage`** — a bare URL field has no legitimate value source before the post has an id
  (no upload flow yet; that's the separate "Image upload" step in `STATE.md`).
- **`schema`** — unused anywhere in the app, and not editable again after creation.

Because `publishOn` is deferred, the create form's status dropdown also **excludes `scheduled`**
(offering it without a publish date would create posts stuck in limbo) — options are
`draft | review | published`, defaulting to `draft`.

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
  keys its products may use. **On create** all fields are editable. **On edit** the backend locks
  existing facets to add/remove only — `key` and `type` become immutable (changing them → `400`),
  and removing a facet/option that products still use → `409`. Reflect this in the UI: disable
  `key`/`type` inputs on rows that already exist, keep `label`/`unit`/`options` editable, and always
  POST the complete field array. See "Updating a saved product type" above.
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
  `POST /posts/{id}/images` and products use `POST /products/{id}/images` — both are galleries that
  return an `UploadFile` record, with `GET …/images` to list and `DELETE …/images/{fileId}` to remove.

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
