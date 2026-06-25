import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			'no-undef': 'off',

			// Ban svelte/store primitives project-wide.
			// The Svelte 5 way is $state/$derived in .svelte.ts modules, not stores.
			// onMount, getContext, setContext, tick are still fine — only state primitives banned.
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'svelte/store',
							importNames: ['writable', 'readable', 'derived', 'get'],
							message: 'Use $state / $derived in a .svelte.ts module instead of Svelte stores.'
						}
					]
				}
			]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		},
		rules: {
			// Runs the real Svelte compiler — in runes mode (enforced by vite.config.ts) the
			// compiler itself rejects $:, export let, <slot>, on:event. This rule surfaces
			// those compile errors as ESLint errors before the build even runs.
			'svelte/valid-compile': 'error',

			// Enforce lang="ts" on every <script> block.
			'svelte/block-lang': ['error', { script: ['ts'] }],

			// Prefer $state/$derived/$effect over older reactive patterns where the plugin
			// can detect the equivalent rune form exists.
			'svelte/prefer-svelte-reactivity': 'warn',

			// {@html} injects raw HTML — must always be reviewed for sanitization.
			'svelte/no-at-html-tags': 'warn',

			// Rune declarations use `let`, not `const`.
			// `let count = $state(0)` — the compiler rewrites this; const would break it.
			'prefer-const': 'off'
		}
	},
	{
		files: ['**/*.ts', '**/*.js'],
		rules: {
			'prefer-const': 'error'
		}
	}
);
