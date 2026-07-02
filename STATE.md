# STATE.md — Roadmap & Build Progress

> Phased roadmap. Unblocked phases are ready to build now. Blocked phases wait on answers in
> `OPEN_QUESTIONS.md`. Follow the session workflow in root `CLAUDE.md`.

_Last updated: 2026-07-02_ (Audit log viewer built — filters, sortable columns, deleted-user-safe
user column, see Phase 4 notes; user management — list/view/edit/delete + admin-create-user +
email-verified toggle + role change — built; post create + post edit + post delete built; post
list bug fix — see Phase 4 notes; Playwright e2e testing infra added — see "Testing
infrastructure" below)

---

## Status legend

- ⬜ Not started
- 🟨 In progress
- ✅ Done
- ⛔ Blocked — see `OPEN_QUESTIONS.md` for the referenced question

---

## Testing infrastructure `AVAILABLE`

> Not a roadmap phase — cross-cutting tooling, added once Phase 2 (auth) and part of Phase 4
> (admin post list/create) had enough built to be worth testing. Full detail in root `CLAUDE.md` →
> "Testing"; don't duplicate it here.

Playwright is set up under `tests/` and runs against the real local backend (no mocking). Coverage:
`tests/auth.spec.ts` (login for all 4 seeded roles via `tests/global-setup.ts`, wrong password,
logout, register), `tests/admin-access.spec.ts` (role-gate matrix — guest → `/login`, `user` → 403,
staff → through), `tests/admin-posts.spec.ts` (post list loads without the `.data`-envelope
`loadError`, post create redirects and the new post appears in the list),
`tests/admin-posts-delete.spec.ts` (admin deletes their own post and it disappears from the list;
editor gets the backend's `403` navigating directly to another author's delete route — the
ownership rule), `tests/admin-users.spec.ts` (guest/author/editor gates on the admin-only
`/admin/users` narrowing, list loads without a `loadError`, admin edits a user's first name, admin
creates a user with a chosen role via `/admin/users/new`, admin toggles a user's email-verified
status via the edit page's separate verify/unverify action), `tests/admin-users-delete.spec.ts`
(admin deletes a non-self user; the admin's own row omits the delete link and direct navigation to
its delete route gets the server's `403`), and `tests/admin-audit-logs.spec.ts` (guest/author/editor
gates on the admin-only viewer, list loads without a `loadError`, column-header sorting — asc then
desc, asserted on real ID-column ordering — and the action-filter GET form updating the URL and
re-rendering cleanly). All 30 specs pass as of this writing. Not covered yet: tags, products, role
change, self-verify-toggle guard — add specs there when those areas get e2e-worthy. Run with
`pnpm test:e2e`. Vitest is intentionally not installed — see root `CLAUDE.md` → "Testing" for why.

> Role change (`/admin/users/{id}/role`) and the self-verify-toggle guard on
> `verifyEmail`/`unverifyEmail` were checked with one-off Playwright scripts run manually against
> the real dev server, then deleted — not committed as specs. So unlike everything listed above,
> these two paths have **no permanent regression coverage yet**; a future session adding
> `tests/admin-users-role.spec.ts` (or extending `admin-users.spec.ts`/`admin-users-delete.spec.ts`)
> should cover: the role `<select>` + disabled-until-changed button, the redirect + updated badge,
> and the self-guard 403 on both the role route and the verify/unverify actions.

> Two test-writing gotchas surfaced while building the user-management specs (`browser.newContext()`
> silently inheriting the enclosing `storageState`; an SSR-hydration race that can clobber
> Playwright's `.fill()` on pre-populated edit forms) — recorded in root `CLAUDE.md` → "Testing",
> not duplicated here. Apply the hydration-wait fix when post edit gets its own spec.

---

## Phase 1 — Foundation `UNBLOCKED`

> All steps fully specified by rules already in the CLAUDE.md files and DESIGN_SYSTEM.md.
> Execute in order, one step at a time.

| # | Step | Status | Spec |
|---|---|:--:|---|
| 0 | **ESLint gate** | ✅ | root CLAUDE.md |
| 1 | **Remove Tailwind** | ✅ | root CLAUDE.md → stack + do-not list |
| 2 | **Design tokens** | ✅ | DESIGN_SYSTEM.md → `tokens.css` (primitives + semantic + non-color) |
| 3 | **`app.html`** | ✅ | DESIGN_SYSTEM.md → inline no-flash script |
| 4 | **Types (`app.d.ts`)** | ✅ | src/CLAUDE.md → `app.d.ts` block |
| 5 | **API client** | ✅ | src/CLAUDE.md → `client.ts` block |
| 6 | **Branding config** | ✅ | root CLAUDE.md → SITE_CONFIG section |
| 7 | **Theme system** | ✅ | DESIGN_SYSTEM.md → toggle + `theme.ts` cookie helpers |
| 8 | **Auth hooks** | ✅ | src/CLAUDE.md → `hooks.server.ts` block |
| 9 | **Root layout** | ✅ | src/CLAUDE.md → `+layout.server.ts` + `+layout.svelte` |

---

## Phase 2 — Auth Routes `UNBLOCKED`

> After Phase 1. Registration endpoint confirmed: `POST /users` (see src/CLAUDE.md).
> All other auth routes are fully specified by existing rules.

| # | Step | Status | Notes |
|---|---|:--:|---|
| A1 | Login route + action | ✅ | `POST /auth/sign-in` → set HttpOnly cookies |
| A2 | Sign-out route | ✅ | `POST /auth/sign-out` → clear cookies |
| A3 | Register route + action | ✅ | `POST /users` — public, triggers email verification |
| A4 | Google OAuth | ✅ | `POST /google-authentication` → GIS SDK + fetch/deserialize/applyAction; 409 = existing local account |
| A5 | Email verification UI | ✅ | `GET /auth/verify-email` + resend endpoint |
| A6 | Password reset UI | ✅ | forgot / reset / change-password flow |

---

## Phase 3 — Public Site `⛔ BLOCKED`

> Blocked until page inventory questions are answered (the `Q-PAGES-*` set — human decisions, not
> backend). The post read shape is now fully typed, pagination is numbered pages, and post `content`
> is **Markdown** — rendering needs `pnpm add marked isomorphic-dompurify` (see `src/routes/CLAUDE.md`).
> Once a question is resolved, remove its ⛔ and mark the step ⬜.

| Step | Status | Blocked by |
|---|:--:|---|
| Public layout (header / footer / ThemeToggle) | ⛔ | Q-PAGES-3 (navigation) |
| Homepage | ⛔ | Q-PAGES-1, Q-PAGES-2 |
| Blog list | ⛔ | Q-PAGES-1, Q-PAGES-4 |
| Post detail `[slug]` | ⛔ | Q-PAGES-1, Q-PAGES-5 |
| Author public profile | ⛔ | Q-PAGES-1 |
| Contact form | ⛔ | Q-PAGES-1 |
| Auth page layout (login / register) | ⛔ | Q-PAGES-6 |

---

## Phase 4 — Admin CMS `PARTIALLY UNBLOCKED`

> Admin gate, post list, and post create are done. Remaining post CRUD and other steps are fully
> specified. Role rules confirmed from API `403` text — **author can edit/delete any post** (same
> as admin; editor limited to own posts only). See `src/routes/admin/CLAUDE.md` for the corrected
> matrix. Only the two inventory/treatment steps remain blocked on human page-inventory decisions.
>
> **Post create v1 scope:** intentionally excludes `publishOn`, `featuredImage`, and `schema`
> (and therefore the `scheduled` status option) — see `src/routes/admin/CLAUDE.md` → "Post create
> v1 — fields intentionally deferred" for the reasoning. **Post edit is now built and verified**
> (same deferred-fields scope as create — no `publishOn`/`featuredImage`/`schema`/`scheduled`).
> It required a new backend endpoint, `GET /posts/{id}/admin` (any status, same ownership as
> `PATCH /posts/{id}`), since the original `GET /posts/{id}` turned out to be published-only — see
> `src/routes/admin/CLAUDE.md` → "Relevant backend endpoints". Image upload/gallery and meta-options
> remain their own separate ⬜ steps below, not bundled into post edit.
>
> **Bug fixed in the post list load** (`src/routes/admin/posts/+page.server.ts`): it read only
> `data` from the typed client call and ignored `error`/`response.ok`, so a failed fetch (hit
> during Post create testing — a backend `400` on `GET /posts/admin`) silently rendered "No posts
> found" instead of surfacing the real error. Now returns `loadError` and the template shows it.
> The underlying `400` itself was a backend query-validation issue (now fixed backend-side) — see
> `src/CLAUDE.md` → API client rules for the "always check `error`/`response.ok`" convention this
> introduced, which should be followed in every new `load`/action from here on.
>
> **User management scope (confirmed with the human):** list + view/edit + delete of existing
> users at `/admin/users` (admin-only — see `src/routes/admin/users/+layout.server.ts`, which
> narrows the shared staff gate). **Role change is a deliberately separate, later step** — role is
> shown read-only on the edit page, no dropdown, `PATCH /users/{id}/role` is untouched. The edit
> form includes an optional password-reset field (blank = unchanged). **Self-delete is blocked**:
> the signed-in admin's own row has no delete link, and direct navigation to
> `/admin/users/{ownId}/delete` gets a server-side `403` (there's no backend guard against it, so
> the frontend enforces it). `GET /users` has no search/filter query param — only `page`/`limit` —
> so the list is pagination-only, no search box.
>
> **Admin-create-user + email-verified toggle (added once the backend shipped the endpoints):** the
> backend added `POST /users/admin` (create with an explicit `role` and `isEmailVerified`, admin
> only) and `PATCH /users/{id}/verify-email` (toggle verified status, clearing any outstanding
> token when set `true`) — both are now wired up. `/admin/users/new` is the admin "create user"
> flow (superseding the earlier "no admin create-user flow, registration already covers that" note
> — it now exists specifically because this endpoint lets an admin set role and skip email
> verification, which self-registration can't do); its role `<select>` intentionally allows **all
> four roles including `admin`** (confirmed with the human — no extra restriction beyond the
> section's existing admin-only gate). The edit page's verified-status toggle is a **separate
> action** (`verifyEmail`/`unverifyEmail`, each posting a fixed boolean) from the main "Save
> changes" form, not a checkbox folded into it — matches this codebase's convention of one named
> action per distinct mutation.
>
> **Role change (built):** mirrors the delete-confirmation pattern — a dedicated route,
> `/admin/users/{id}/role` (`src/routes/admin/users/[id]/role/`), shows the target's current role
> in a `<select>` (all 4 roles selectable, including promoting to `admin` — confirmed with the
> human, same no-extra-restriction stance as the create form's role dropdown) with the submit
> button disabled until a different role is chosen, then calls `PATCH /users/{id}/role` and
> redirects back to `/admin/users/{id}`. **Self role-change is blocked** the same way as
> self-delete: there's no backend guard against an admin changing their own role, so both `load`
> and the `changeRole` action 403 on `id === locals.user.id`, and the "Role"/"Change role" links
> are omitted from the admin's own row (list) and own edit page. Entry points: a "Role" action link
> per non-self row on `/admin/users`, and a "Change role" link next to the (still read-only) role
> badge on the edit page. Verified end-to-end against the real backend (role change + revert both
> confirmed via the UI; invalid-role and same-role-no-op payloads handled cleanly server-side).
>
> **Audit log viewer (built):** read-only table at `/admin/audit-logs` (admin-only narrowing guard
> in its `+page.server.ts` — no sub-routes, so no layout guard). Exact-match `action`/`entity`
> filters as a GET form (state lives in the URL), click-to-sort column headers (all six columns,
> asc/desc toggle, jumps to page 1 on sort change), and pagination — filters + sort + page all
> carry each other along in every link. Two follow-ups raised by the human after v1 shipped were
> resolved same-day by backend additions (`sortBy`/`order` params and an embedded per-row `user`
> snapshot with a `deleted` flag; types regenerated): hard-deleted users now render as unlinked
> "#id (deleted)" instead of 404ing links, live users show a linked name. Dates render d/m/y 24 h
> via `toLocaleString('en-GB')` (human-requested). Endpoint details in
> `src/routes/admin/CLAUDE.md` → "Audit logs (admin)".

| Step | Status | Blocked by |
|---|:--:|---|
| Admin layout guard (`+layout.server.ts`) | ✅ | — |
| Post list / dashboard | ✅ | — |
| Post create | ✅ | — |
| Post edit (ownership rules) | ✅ | — |
| Post delete | ✅ | — |
| User management | ✅ | — |
| Role change | ✅ | — |
| Audit log viewer | ✅ | — |
| Avatar option management | ⬜ | — |
| Tag management (vocabulary CRUD — author/admin) | ⬜ | — |
| Image upload + delete per post (own posts) | ⬜ | — |
| Meta-options | ⬜ | — |
| Full admin page inventory | ⛔ | Q-PAGES-7 |
| Empty / error / loading states | ⛔ | Q-PAGES-8 |

---

## Phase 5 — Products (Public Site) `PARTIALLY UNBLOCKED`

> Structure agreed (see `src/routes/CLAUDE.md`): `/products` is a product-type directory (cards use
> `productCount`), `/products/all` is a filter-less sort+paginate list, each type has a filtered
> list at `/products/[typeSlug]`, detail at `/products/[typeSlug]/[productSlug]`. Read schemas are
> fully typed and pagination is numbered pages, so only adding Products to the public nav
> (Q-PAGES-3) remains blocked.

| Step | Status | Blocked by |
|---|:--:|---|
| Spec-filter query serializer util (`specs[k]`, `[min]`/`[max]`) | ⬜ | — |
| Products landing `/products` (type cards + `productCount`) | ⬜ | — |
| `SpecFilters` component (renders facets → inputs) | ⬜ | — |
| Product detail `/products/[typeSlug]/[productSlug]` (gallery, specs, description, related) | ⬜ | — |
| All-products list `/products/all` (sort + pagination, no spec filters) | ⬜ | — |
| Per-type list `/products/[typeSlug]` (+ filters, sort, search, pagination) | ⬜ | — |
| Add Products to public nav | ⛔ | Q-PAGES-3 |

---

## Phase 6 — Products (Admin CMS) `PARTIALLY UNBLOCKED`

> Product writes are admin-only (explicit in the OpenAPI text). Read schemas are typed; **write DTOs
> are mistyped** (`Record<string, never>` on JSON fields, plus `isPublished` typed required) so
> create/edit actions build + cast the payload. Nothing here is blocked — pagination is numbered
> pages and the image endpoints are the plural gallery (`/products/{id}/images`). **New constraint:**
> `PATCH /product-types/{id}` is a diff, not a free patch — facets are add/remove only, `key`/`type`
> immutable (`400`), in-use facet/option removal blocked (`409`); send the full field array. See
> `src/routes/admin/CLAUDE.md` → "Updating a saved product type".

| Step | Status | Blocked by |
|---|:--:|---|
| Admin product create/edit + dynamic specs form (cast write DTO; always send `isPublished`) | ⬜ | — |
| Admin product image gallery (`GET/POST /products/{id}/images`, `DELETE …/{fileId}`) | ⬜ | — (multipart pattern known) |
| Admin product delete (soft) | ⬜ | — |
| Admin product-type list (bare array) | ⬜ | — |
| Admin product-type create/edit + facet editor (add/remove-only on edit; lock `key`/`type`; full-array PATCH; handle `400`/`409`) | ⬜ | — |
| Admin product-type delete (handle 409 — still referenced) | ⬜ | — |
| Admin product list (`GET /products/admin`, incl. drafts, paginated) | ⬜ | — |
