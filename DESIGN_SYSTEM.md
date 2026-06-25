# DESIGN_SYSTEM.md

The design bible. **Read this before writing any CSS.** It defines the color token system,
the day/night theming mechanism, and the rules every component must follow.

---

## Core philosophy: two-layer tokens

Colors are defined in **two layers**:

1. **Primitive tokens** — the raw palette. Theme-independent. Named by hue + scale
   (`--blue-500`, `--slate-900`). These never change between light and dark. Components
   **never** use these directly.

2. **Semantic tokens** — meaning-based. Named by role (`--color-bg`, `--color-text`,
   `--color-primary`). These **remap per theme** and point at primitives. Components use
   **only** these.

Why: when you add a theme or rebrand, you only touch the semantic mappings. Components never change.

> **Hard rule:** Components reference semantic tokens only (`var(--color-bg)`). Never a raw hex,
> never a primitive (`var(--blue-500)`), never an SCSS color variable. Colors must be CSS custom
> properties — SCSS variables compile away and **cannot** switch at runtime, which day/night needs.

---

## Theming mechanism

A `data-theme` attribute on `<html>` selects the active semantic mapping:

- `data-theme="light"` → light semantic tokens
- `data-theme="dark"` → dark semantic tokens

The value of `data-theme` is always a **resolved** theme (`light` or `dark`), never `system`.

### Three concepts — keep them distinct

| Concept | Values | Lives where |
|---|---|---|
| **Preference** | `light` / `dark` / `system` | `theme` cookie (source of truth) |
| **Resolved** | `light` / `dark` | `<html data-theme>`, computed from preference + OS |
| **OS signal** | from `prefers-color-scheme` | browser only; read by inline script + `matchMedia` |

- If preference is `light` or `dark` → resolved = that value.
- If preference is `system` (or cookie unset) → resolved = the OS `prefers-color-scheme`.

### Zero-flash strategy (SSR + cookie + inline script)

The goal: the correct theme renders **server-side**, no flash of the wrong theme.

1. `hooks.server.ts` reads the `theme` cookie (the preference).
2. If preference is `light`/`dark`, the server knows the resolved theme and sets
   `<html data-theme="...">` directly during SSR. Zero flash. (The common, returning-visitor case.)
3. If preference is `system` or the cookie is unset, the server **cannot** know the OS preference
   (it's not in any cookie). It renders a neutral default, and a **blocking inline script** in
   `app.html` resolves the real theme from `prefers-color-scheme` **before first paint**.
4. The inline script also writes/normalizes the cookie so subsequent requests are server-correct.

This means: returning visitors with an explicit choice get perfect SSR; a brand-new visitor in
"system" mode may have at most a single pre-paint correction by the inline script — imperceptible.

### The inline script (goes in `app.html`, in `<head>`, before any stylesheet)

```html
<script>
  (function () {
    try {
      var m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
      var pref = m ? decodeURIComponent(m[1]) : 'system';
      var resolved =
        pref === 'light' || pref === 'dark'
          ? pref
          : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', resolved);
      // Normalize cookie so the server can SSR correctly next time.
      if (!m) {
        document.cookie =
          'theme=system; path=/; max-age=31536000; samesite=lax';
      }
    } catch (e) {}
  })();
</script>
```

### Live OS updates while in "system" mode

When preference is `system`, the resolved theme must follow the OS **live** (user flips OS dark
mode while the tab is open). Add a `matchMedia` listener in a root client component:

```ts
// runs only on the client, e.g. in root +layout.svelte onMount
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const apply = () => {
  if (getPreference() === 'system') {
    document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
  }
};
mq.addEventListener('change', apply);
```

### The toggle

Three-way: **Light / Dark / System**. On change it:

1. Writes the `theme` cookie (`light` | `dark` | `system`), `path=/`, 1-year max-age, `samesite=lax`.
2. Updates `<html data-theme>` immediately to the resolved value.

Toggle component lives at `src/lib/components/ThemeToggle.svelte`. The cookie helpers live in
`src/lib/stores/theme.ts`.

---

## Starter palette

Slate neutrals + indigo primary + teal accent. Tweak freely — only the primitive values change;
semantic mappings and components stay put. Tuned so `--color-primary` meets WCAG AA on its
background in both themes.

### Primitives — `src/lib/styles/tokens.css`

```css
:root {
  /* Slate (neutrals) */
  --slate-50:  #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-300: #cbd5e1;
  --slate-400: #94a3b8;
  --slate-500: #64748b;
  --slate-600: #475569;
  --slate-700: #334155;
  --slate-800: #1e293b;
  --slate-900: #0f172a;
  --slate-950: #020617;

  /* Indigo (primary) */
  --indigo-300: #a5b4fc;
  --indigo-400: #818cf8;
  --indigo-500: #6366f1;
  --indigo-600: #4f46e5;
  --indigo-700: #4338ca;

  /* Teal (accent) */
  --teal-300: #5eead4;
  --teal-400: #2dd4bf;
  --teal-500: #14b8a6;
  --teal-600: #0d9488;

  /* Status */
  --red-500:   #ef4444;
  --amber-500: #f59e0b;
  --green-500: #22c55e;
}
```

### Semantic tokens — light + dark

```css
:root,
[data-theme='light'] {
  --color-bg:            var(--slate-50);
  --color-surface:       #ffffff;
  --color-surface-alt:   var(--slate-100);
  --color-border:        var(--slate-200);
  --color-text:          var(--slate-900);
  --color-text-muted:    var(--slate-500);
  --color-primary:       var(--indigo-600);
  --color-primary-hover: var(--indigo-700);
  --color-on-primary:    #ffffff;
  --color-accent:        var(--teal-600);
  --color-danger:        var(--red-500);
  --color-warning:       var(--amber-500);
  --color-success:       var(--green-500);
  --color-focus-ring:    var(--indigo-500);
}

[data-theme='dark'] {
  --color-bg:            var(--slate-950);
  --color-surface:       var(--slate-900);
  --color-surface-alt:   var(--slate-800);
  --color-border:        var(--slate-700);
  --color-text:          var(--slate-100);
  --color-text-muted:    var(--slate-400);
  --color-primary:       var(--indigo-400);
  --color-primary-hover: var(--indigo-300);
  --color-on-primary:    var(--slate-950);
  --color-accent:        var(--teal-400);
  --color-danger:        var(--red-500);
  --color-warning:       var(--amber-500);
  --color-success:       var(--green-500);
  --color-focus-ring:    var(--indigo-400);
}
```

---

## Non-color tokens

Define alongside colors in `tokens.css`. Theme-independent.

```css
:root {
  /* Spacing scale (rem) */
  --space-1: 0.25rem;  --space-2: 0.5rem;  --space-3: 0.75rem;
  --space-4: 1rem;     --space-6: 1.5rem;  --space-8: 2rem;
  --space-12: 3rem;    --space-16: 4rem;

  /* Radius */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 16px; --radius-full: 9999px;

  /* Typography */
  --font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', Menlo, monospace;
  --text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.25rem;
  --text-xl: 1.5rem;   --text-2xl: 2rem;  --text-3xl: 3rem;

  /* Elevation — note: shadows read differently per theme, override in [data-theme] if needed */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.16);

  /* Motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms; --duration-base: 250ms; --duration-slow: 400ms;
}
```

---

## Rules for components

- ✅ Use semantic tokens: `background: var(--color-surface); color: var(--color-text);`
- ✅ Use spacing/radius/type tokens instead of magic numbers.
- ❌ No raw hex, no primitives, no SCSS color vars in component styles.
- ✅ Respect `prefers-reduced-motion` — gate non-essential animation behind it.
- ✅ Always pair a visible focus state with `--color-focus-ring` for interactive elements.

```svelte
<style lang="scss">
  .card {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
  }
  @media (prefers-reduced-motion: no-preference) {
    .card { transition: box-shadow var(--duration-base) var(--ease-out); }
  }
</style>
```

---

## Load order

In `src/lib/styles/global.scss` (imported once in the root layout):

```scss
@use 'tokens.css';   /* primitives + semantic + non-color tokens */
@use 'mixins';       /* SCSS mixins, math, helpers */
/* then base/reset styles */
```
