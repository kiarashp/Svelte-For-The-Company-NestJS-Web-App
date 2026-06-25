<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/styles/global.css';
	import favicon from '$lib/assets/favicon.svg';
	import { getPreference } from '$lib/state/theme.svelte';

	let { children } = $props();

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
