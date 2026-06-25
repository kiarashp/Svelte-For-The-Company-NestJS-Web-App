# Svelte 5 runes lint gate — wiring instructions

The SKILL.md guides the agent. This makes the rules **mechanical** so a slip is
caught by `pnpm lint` instead of slipping into the codebase.

## 1. Install (if not already present)

```
pnpm add -D eslint eslint-plugin-svelte svelte-eslint-parser typescript-eslint
```

## 2. eslint.config.js (flat config — Svelte 5 / ESLint 9 style)

Merge the Svelte block into your existing flat config. The key part is forcing the
legacy rules to `error`:

```js
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    rules: {
      // --- Hard ban on legacy Svelte 4 syntax ---
      'svelte/no-legacy-reactive-declarations': 'error',
      'svelte/no-at-html-tags': 'warn',
      'svelte/valid-compile': 'error',
      'svelte/block-lang': ['error', { script: ['ts', null] }],
      // prefer-const is dangerous for runes — turn it OFF in Svelte files
      'prefer-const': 'off',
    },
  },
  {
    // global: keep prefer-const for plain .ts but never let it touch runes
    files: ['**/*.ts', '**/*.js'],
    rules: { 'prefer-const': 'error' },
  },
  {
    ignores: ['.svelte-kit/', 'build/', 'dist/', 'node_modules/'],
  },
];
```

Notes:
- `svelte/no-legacy-reactive-declarations` is the headline rule: it flags `$:`
  reactive statements. Combined with runes mode, `export let` / `on:` / `<slot>`
  surface as compile errors caught by `svelte/valid-compile`.
- If you adopt a strict runes posture project-wide, you can also set
  `compilerOptions: { runes: true }` in `svelte.config.js` so Svelte itself
  *rejects* legacy syntax at compile time — the strongest possible gate:

```js
// svelte.config.js
const config = {
  compilerOptions: { runes: true }, // forces runes mode everywhere, legacy = error
  // ...rest of your config
};
```

  `runes: true` is the single most effective enforcement — it turns legacy syntax
  into a build failure, not a lint warning. Strongly recommended for this project.

## 3. package.json scripts

```json
{
  "scripts": {
    "lint": "eslint . && prettier --check .",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  }
}
```

## 4. Tell the agent it's a gate

Add one line to your root CLAUDE.md so the agent treats it as definition-of-done:

> Svelte work is not complete until `pnpm lint` and `pnpm check` both pass.
> Never suppress a Svelte lint rule or add `eslint-disable`; fix the runes usage.
