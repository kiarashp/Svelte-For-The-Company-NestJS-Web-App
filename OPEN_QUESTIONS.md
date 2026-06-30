# OPEN_QUESTIONS.md — Unresolved Decisions

> Questions that block specific build steps. When a question is answered:
> 1. Record the rule or fact in the relevant `CLAUDE.md` file.
> 2. Remove the question from this file.
> 3. Change the dependent step in `STATE.md` from ⛔ to ⬜.

> **Resolved 2026-06-30 by the regenerated `openapi-types.ts`:** Q1 (tag roles), Q2 (post-image
> roles), Q3 (meta-option roles), Q6 (post read shape), Q10 (postType — removed from the model),
> Q11 (pagination — numbered pages). The role rules are now baked into the API `403` descriptions;
> the authoritative permission matrix lives in `src/routes/admin/CLAUDE.md`.

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
tag? Sorting? (Pagination is numbered pages; keyword search via `?q=` is available.)
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
