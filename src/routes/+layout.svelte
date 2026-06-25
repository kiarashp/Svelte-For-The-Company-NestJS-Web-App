<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import '$lib/styles/global.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initPreference, getPreference } from '$lib/state/theme.svelte';

	let { children } = $props();

	// Pre-initialize module state from the server-resolved preference.
	// Runs during both SSR and initial client render so ThemeToggle shows
	// the correct active button from the start — no 'system' flash on hydration.
	initPreference(page.data.theme);

	// Mount the OS-theme change listener once for the whole app.
	// onMount is correct here — window is not available during SSR.
	onMount(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const apply = () => {
			// Only sync the resolved theme when the user hasn't pinned light/dark explicitly.
			if (getPreference() === 'system') {
				document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
			}
		};
		mq.addEventListener('change', apply);
		return () => mq.removeEventListener('change', apply);
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
