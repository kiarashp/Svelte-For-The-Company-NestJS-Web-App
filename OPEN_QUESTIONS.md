# OPEN_QUESTIONS.md — Unresolved Decisions

> Things that need a human answer before they can be built correctly. Each has enough context to
> be answered later without re-deriving it. When answered, move the resolution into `DECISIONS.md`
> and delete (or strike) it here. The agent should consult this before building anything in an
> affected area, and **add new questions here rather than guessing**.

---

## Backend / permissions

### Q1. Tag management — which roles?
The permission matrix in `src/routes/admin/CLAUDE.md` marks tag create/edit/delete as `?` for
`author` and `editor`. The OpenAPI types expose the endpoints but not the `@Roles()` guards.
**Need:** the actual roles allowed on `POST /tags`, `PATCH /tags/{id}`, `DELETE /tags/{id}`,
`DELETE /tags/soft/{id}`.

### Q2. Post image upload — which roles, and ownership?
`POST /posts/{id}/images`: can an `author` upload only to their own posts? Can `editor` upload to
any post? Confirm so the UI gates correctly.

### Q3. Who can manage meta-options?
`/meta-options/{id}` (GET/PATCH/DELETE) — role(s)? Where does meta-option creation happen (no POST
endpoint is visible; are they created as part of post creation via `metaOptions` on the DTO only)?

### Q4. Registration flow shape
Is public self-registration `POST /users`, or is there a separate sign-up endpoint? `POST /users`
looks admin-flavored (it sits next to create-many). Confirm which endpoint the public register
form should hit, and whether email verification is mandatory before login.

---

## Response shapes (types gap)

### Q6. `Post` response shape
What does a post object look like on read (`GET /posts`, `/posts/slug/{slug}`)? Specifically: the
author object shape (for ownership checks + author display), tag shape, image list shape, and
whether `content` is HTML, markdown, or structured JSON. This affects rendering + sanitization.

_Q5, Q7, Q8 resolved → see DECISIONS.md D17, D18._

---

## Page inventory & content (decide before building any page)

> Nothing here is assumed. Each page and its contents must be agreed with the human before it's
> built. Build only what's been moved to `DECISIONS.md`.

### Q-PAGES-1. Public page inventory
Which public pages exist? (e.g. home, blog list, post detail, author profile, contact, login,
register — and anything else like about/services/portfolio?) Confirm the **exact** list. Nothing
gets built that isn't on it.

### Q-PAGES-2. Homepage content
What sections does the homepage contain, in what order? (Hero — with what message/CTA? Featured
content — how many, chosen how? Anything else?) No invented sections.

### Q-PAGES-3. Navigation
What's in the header nav and footer? What links, what grouping, what's in the footer (social,
legal, contact, sitemap)? Social links come from `SITE_CONFIG`.

### Q-PAGES-4. Blog list page
Layout (cards/list)? What shows per item (image, excerpt, author, date, tags)? Filtering by tag?
Sorting? Pagination style (ties to Q11).

### Q-PAGES-5. Post detail page
What's shown beyond title + content? (Author block, publish date, tags, share, related posts,
reading time, comments?) Confirm each — none assumed.

### Q-PAGES-6. Auth pages
Do login/register live on their own pages or in a modal? What fields on register? Is Google OAuth
shown as a button there? Post-login redirect target?

### Q-PAGES-7. Admin page inventory
Which admin screens exist and their layout? (Dashboard, post list, post editor, user management,
roles, audit log, avatar options, tags.) Confirm the set and each screen's contents before building.

### Q-PAGES-8. Empty / loading / error states
What does each list show when empty? What's the 404 / 403 / error page treatment? Decide rather
than letting them default.

---

## Product / design

### Q9. Brand identity
Company name, logo asset, tagline, brand colors. Until decided, `SITE_CONFIG` defaults +
the starter slate/indigo/teal palette stand in. When known: set env vars and tweak primitives.

### Q10. postType layouts
Do `post` / `page` / `story` / `series` need distinct public layouts, or render uniformly for now?
`series` in particular may imply grouping/ordering of child posts — is there a relationship in the
data model for that?

### Q11. Pagination UX
`GET /posts` and `GET /users` are paginated (`page`/`limit`). Preference: numbered pages,
load-more, or infinite scroll? Affects both public blog list and admin tables.

---

## How to use

- Before building in an area, scan for a relevant open question. If one exists and blocks correct
  work, surface it rather than guessing.
- When you discover a new unknown, add it here with enough context to answer cold.
- When answered, record the decision in `DECISIONS.md` and remove it here.
