# DECISIONS.md — Locked Decisions

> Append-only log of settled choices and the reasoning behind them. Purpose: stop the agent (and
> future you) from re-litigating decided things. If a decision changes, add a new dated entry that
> supersedes the old one rather than editing history.

---

### D1. Framework: SvelteKit, SSR-first
Content site needs SEO + fast first paint; SvelteKit's SSR + file routing fits. Svelte's native
animation primitives also serve the "cool animations" goal without extra libraries.

### D2. Styling: plain CSS/SCSS with scoped styles
No utility framework (no Tailwind). Chosen for control and because the design system is expressed
as CSS custom properties (required for runtime theming anyway).

### D3. API client: openapi-fetch
Typed directly from the existing `openapi-types.ts` — zero manual client maintenance, request and
response shapes stay in sync with the backend. Server uses `serverApi(event.fetch)`; client uses
the `api` singleton with `credentials: 'include'`.

### D4. Auth: JWT in HttpOnly cookies, resolved server-side
Tokens never touch client JS (XSS-safer). `hooks.server.ts` resolves `locals.user`; access control
lives in server `load` functions. Components use `$page.data.user` only as UI hints.

### D5. Roles: admin / author / editor / user
Permission model documented in `src/routes/admin/CLAUDE.md`. Frontend treats backend `403` as
authoritative because role guards aren't exposed in the types (some specifics still open — see
OPEN_QUESTIONS Q1–Q3).

### D6. Branding via SITE_CONFIG + env override
`src/lib/config/site.ts` holds defaults (name, tagline, logo, support email, socials); `PUBLIC_*`
env vars override at runtime. Lets the brand be finalized without code changes.

### D7. Animations: Svelte-native only
`transition:`, `animate:`, `tweened`, `spring`, `crossfade`, plus IntersectionObserver actions for
scroll reveal. No GSAP / Motion One / Framer. Keeps bundle light; Svelte's built-ins are strong.

### D8. Theming token structure: two layers
Primitive tokens (raw palette, theme-independent) + semantic tokens (role-based, remap per theme).
Components use semantic tokens only. Scales to rebrands/new themes by touching only the semantic layer.

### D9. Theme tokens are CSS custom properties (not SCSS variables)
Day/night must switch at runtime; SCSS variables compile away and can't. SCSS is still used for
mixins/math/nesting, never for the color values themselves.

### D10. Theme switching: `data-theme` on `<html>`, three-way preference
Preference (`light`/`dark`/`system`) stored in a cookie = source of truth. Resolved theme
(`light`/`dark`) computed from preference + OS and set on `<html data-theme>`. "system" follows
`prefers-color-scheme` live via a `matchMedia` listener.

### D11. Zero-flash theming: cookie-as-truth + inline script (Option A)
Server SSRs the resolved theme directly when preference is explicit. For `system`/first-visit, a
blocking inline script in `app.html` resolves before paint and normalizes the cookie. Accepts at
most a single pre-paint correction for a brand-new "system" visitor — deemed negligible.

### D12. Starter palette: slate neutrals + indigo primary + teal accent
Placeholder until brand is set; tuned for WCAG AA on both themes. Swappable by editing primitives
only (semantic mappings and components unaffected).

### D13. Docs structure: layered CLAUDE.md + separate working docs
`CLAUDE.md` files (root, `src/`, `src/routes/`, `src/routes/admin/`) hold always-on instructions.
`DESIGN_SYSTEM.md` holds design rules. `STATE.md`, `OPEN_QUESTIONS.md`, `DECISIONS.md` are working
docs the agent reads/updates but that aren't always-on instructions.

### D14. Admin panel: same app, `/admin` route subtree
One codebase. Gated by a server `load` guard in `src/routes/admin/+layout.server.ts` restricting to
`admin`/`author`/`editor`.

### D15. Nothing is invented — scope is decided through discussion
Pages, sections, content blocks, fields, features, and copy are agreed with the human before being
built. The agent never adds speculative pages/sections/placeholder content. Undecided items go to
`OPEN_QUESTIONS.md` and are surfaced, not guessed. Enforced as a hard rule in root `CLAUDE.md`.

### D16. Styling: native CSS only (supersedes D2 re: SCSS)
D2 stands: no Tailwind, no utility framework. Additionally confirmed: no Sass/SCSS. Use native CSS
nesting, CSS custom properties for the two-layer token system, and `color-mix()` / relative color
syntax for color manipulation. Svelte component-scoped `<style>` blocks (no `lang="scss"`). No
`sass` dependency.

### D17. Auth token storage: SvelteKit-managed HttpOnly cookies
Backend sign-in (`POST /auth/sign-in`) returns `{ accessToken, refreshToken }` in the body AND sets
a `refreshToken` HttpOnly cookie scoped to the backend's `/auth/refresh-tokens`. SvelteKit stores
both tokens as its own HttpOnly cookies (`access_token`, `access_token` 1 h TTL; `refresh_token`,
24 h TTL) via the login action. `hooks.server.ts` reads these to resolve the user and refresh
expired tokens by POSTing `{ refreshToken }` to the backend. `locals.accessToken` is available for
server load functions. The access token is never exposed to client JS.

### D18. User (locals.user) type
`GET /users/me` returns (under the `admin` serialization group):
`{ id: number; firstName: string; lastName: string | null; email: string;
  role: 'admin'|'author'|'editor'|'user'; isEmailVerified: boolean;
  avatarUrl?: string; bio?: string | null }`
This is the canonical `App.Locals['user']` shape declared in `app.d.ts`.
