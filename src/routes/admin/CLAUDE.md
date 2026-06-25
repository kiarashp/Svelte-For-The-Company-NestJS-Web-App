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

Cells marked `?` are unverified from the types — confirm against the backend before relying on them.

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

## Forms & actions

- Use SvelteKit **form actions** in `+page.server.ts` for all mutations (create/update/delete).
- Validate on the server inside the action; mirror the DTO field rules from `openapi-types.ts`.
- Call the backend via `serverApi(fetch)` (see `src/CLAUDE.md`).
- Surface backend validation errors back to the form; don't swallow them.
- Image upload (`POST /posts/{id}/images`) is multipart — handle the file in the action, forward
  to the backend.

---

## Admin UI conventions

- Reuse the design tokens and semantic colors from `DESIGN_SYSTEM.md` — the admin panel is themed
  exactly like the public site (day/night included).
- Tables: paginate anything backed by a paginated endpoint (`/users` supports `page`/`limit`).
- Destructive actions (delete user/post, change role) require an explicit confirm step.
- Show role- and ownership-derived affordances from server-provided booleans, never from
  client-side role math.

---

## Don'ts (admin-specific)

- ❌ Don't expose admin-only endpoints (users, roles, audit logs) to author/editor UIs.
- ❌ Don't let editors see create/delete post controls.
- ❌ Don't compute post ownership in the component — get it from the server load.
- ❌ Don't assume the inferred permission matrix is correct where backend `403` says otherwise.
