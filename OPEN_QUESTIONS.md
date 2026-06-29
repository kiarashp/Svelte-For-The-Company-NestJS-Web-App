# OPEN_QUESTIONS.md — Unresolved Decisions

> Questions that block specific build steps. When a question is answered:
> 1. Record the rule or fact in the relevant `CLAUDE.md` file.
> 2. Remove the question from this file.
> 3. Change the dependent step in `STATE.md` from ⛔ to ⬜.

---

## Backend permissions — blocks Phase 4

### Q1. Tag management — which roles?
The permission matrix in `src/routes/admin/CLAUDE.md` marks tag create/edit/delete as `?` for
`author` and `editor`. The OpenAPI types expose the endpoints but not the `@Roles()` guards.
**Need:** the actual roles allowed on `POST /tags`, `PATCH /tags/{id}`, `DELETE /tags/{id}`,
`DELETE /tags/soft/{id}`.
→ _Unblocks: Phase 4 → Tag management_

### Q2. Post image upload — which roles, and ownership?
`POST /posts/{id}/images`: can an `author` upload only to their own posts? Can `editor` upload to
any post? Confirm so the UI gates correctly.
→ _Unblocks: Phase 4 → Image upload per post_

### Q3. Who can manage meta-options?
`/meta-options/{id}` (GET/PATCH/DELETE) — role(s)? Where does meta-option creation happen (no
POST endpoint is visible; are they created as part of post creation via `metaOptions` on the DTO)?
→ _Unblocks: Phase 4 → Meta-options_

---

## Post response shape — blocks Phase 3 post rendering

### Q6. `Post` response shape
What does a post object look like on read (`GET /posts`, `GET /posts/slug/{slug}`)? Specifically:
the author object shape (for ownership checks + display), tag shape, image list shape, and whether
`content` is HTML, markdown, or structured JSON. Affects rendering and sanitization.
→ _Unblocks: Phase 3 → Post detail `[slug]`_

---

## Page inventory — blocks all of Phase 3

### Q-PAGES-1. Public page inventory
Which public pages exist? (e.g. home, blog list, post detail, author profile, contact, login,
register — and anything else like about / services / portfolio?) Confirm the **exact** list.
Nothing gets built that isn't on it.
→ _Unblocks: all Phase 3 steps_

### Q-PAGES-2. Homepage content
What sections does the homepage contain, in what order? (Hero — with what message / CTA?
Featured content — how many, chosen how? Anything else?) No invented sections.
→ _Unblocks: Phase 3 → Homepage_

### Q-PAGES-3. Navigation
What's in the header nav and footer? What links, what grouping, what's in the footer (social,
legal, contact, sitemap)? Social links come from `SITE_CONFIG`.
→ _Unblocks: Phase 3 → Public layout_

### Q-PAGES-4. Blog list page
Layout (cards / list)? What shows per item (image, excerpt, author, date, tags)? Filtering by
tag? Sorting? Pagination style (ties to Q11)?
→ _Unblocks: Phase 3 → Blog list_

### Q-PAGES-5. Post detail page
What's shown beyond title + content? (Author block, publish date, tags, share, related posts,
reading time, comments?) Confirm each — none assumed.
→ _Unblocks: Phase 3 → Post detail_

### Q-PAGES-6. Auth pages
Do login / register live on their own pages or in a modal? What fields on register? Is Google
OAuth shown as a button there? Post-login redirect target?
→ _Unblocks: Phase 3 → Auth page layout_

### Q-PAGES-7. Admin page inventory
Which admin screens exist and what does each contain? (Dashboard, post list, post editor, user
management, roles, audit log, avatar options, tags.) Confirm the set before building.
→ _Unblocks: Phase 4 → Full admin page inventory_

### Q-PAGES-8. Empty / loading / error states
What does each list show when empty? What's the 404 / 403 / error page treatment?
→ _Unblocks: Phase 3 + Phase 4 → error handling_

---

## Product / design

### Q9. Brand identity
Company name, logo asset, tagline, brand colors. Until decided, `SITE_CONFIG` defaults +
slate / indigo / teal palette stand in. When known: set env vars — no code changes needed.
→ _Unblocks: final polish (not blocking any build step)_

### Q10. postType layouts
Do `post` / `page` / `story` / `series` need distinct public layouts, or render uniformly for
now? `series` in particular may imply grouping / ordering of child posts — is there a data model
relationship for that?
→ _Unblocks: Phase 3 → Post detail, Phase 4 → Post create / edit_

### Q11. Pagination UX
`GET /posts`, `GET /users`, and the product lists (`GET /products`, `GET /products/admin`) are
paginated (`page` / `limit`). Preference: numbered pages, load-more, or infinite scroll? Affects
public blog list, public product lists, and admin tables. (Note: `GET /product-types` is a bare
array — not paginated.)
→ _Unblocks: Phase 3 → Blog list; Phase 4 → Post list / user list; Phase 5 → all-products list, per-type list; Phase 6 → admin product list_
