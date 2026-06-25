<script lang="ts">
	import { onMount } from 'svelte';
	import { getPreference, setPreference, type ThemePreference } from '$lib/state/theme';

	const OPTIONS: ThemePreference[] = ['light', 'dark', 'system'];

	let preference = $state<ThemePreference>('system');

	// onMount — cookie reads are client-only; can't run during SSR
	onMount(() => {
		preference = getPreference();
	});

	function choose(pref: ThemePreference) {
		preference = pref;
		setPreference(pref);
	}
</script>

<div class="theme-toggle" role="group" aria-label="Color theme">
	{#each OPTIONS as pref (pref)}
		<button
			class="option"
			class:active={preference === pref}
			onclick={() => choose(pref)}
			aria-pressed={preference === pref}
		>
			{pref[0].toUpperCase() + pref.slice(1)}
		</button>
	{/each}
</div>

<style>
	.theme-toggle {
		display: inline-flex;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.option {
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface);
		color: var(--color-text-muted);
		border: none;
		border-right: 1px solid var(--color-border);
		cursor: pointer;
		font-size: var(--text-sm);
		font-family: var(--font-sans);

		@media (prefers-reduced-motion: no-preference) {
			transition:
				background var(--duration-fast) var(--ease-out),
				color var(--duration-fast) var(--ease-out);
		}
	}

	.option:last-child {
		border-right: none;
	}

	.option.active {
		background: var(--color-primary);
		color: var(--color-on-primary);
	}

	.option:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: -2px;
		/* keep focus ring visible inside the overflow:hidden parent */
		position: relative;
		z-index: 1;
	}
</style>
