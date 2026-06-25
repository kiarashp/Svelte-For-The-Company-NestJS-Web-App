<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
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

<!-- Temporary dev nav — remove once the real public header is built in Phase 3. -->
<nav class="dev-nav">
	{#if page.data.user}
		<span class="user-label">{page.data.user.email}</span>
		<!-- POST directly to the logout action so no confirmation page is needed. -->
		<form method="POST" action={resolve('/logout')} use:enhance>
			<button type="submit" class="nav-btn">Sign out</button>
		</form>
	{:else}
		<a href={resolve('/login')}>Sign in</a>
		<a href={resolve('/register')}>Register</a>
	{/if}
</nav>

{@render children()}

<style>
	.dev-nav {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 1rem;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		font-size: 0.875rem;
	}

	.user-label {
		color: var(--color-text-muted);
		margin-right: auto;
	}

	.dev-nav a,
	.nav-btn {
		color: var(--color-primary);
		text-decoration: none;
	}

	.dev-nav a:hover,
	.nav-btn:hover {
		text-decoration: underline;
	}

	/* Reset button chrome so it looks like a plain link. */
	.nav-btn {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		cursor: pointer;
	}
</style>
