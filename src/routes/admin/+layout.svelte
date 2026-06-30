<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { resolve, base } from '$app/paths';
	import { enhance } from '$app/forms';
	import { SITE_CONFIG } from '$lib/config/site';

	interface Props {
		children: Snippet;
	}
	let { children }: Props = $props();

	// Non-null because +layout.server.ts guard rejects guests before this renders.
	let user = $derived(page.data.user!);
	let role = $derived(user.role);

	// Returns true if the current pathname is inside the given admin section.
	// Uses base + path instead of resolve() because resolve() is typed against the route
	// manifest and rejects paths that don't have a +page.svelte yet.
	function isActive(path: string): boolean {
		return page.url.pathname.startsWith(base + path);
	}
</script>

<div class="admin-shell">
	<aside class="sidebar">
		<header class="sidebar-brand">
			<a href={resolve('/admin')} class="brand-link">
				<img src={SITE_CONFIG.logoUrl} alt={SITE_CONFIG.name} class="brand-logo" />
				<span class="brand-name">{SITE_CONFIG.name}</span>
			</a>
		</header>

		<nav class="sidebar-nav" aria-label="Admin navigation">
			<a href={resolve('/admin/posts')} class="nav-link" class:active={isActive('/admin/posts')}>
				Posts
			</a>

			<!-- Tags vocabulary CRUD: author and admin only. Editors are excluded per API 403 rules. -->
			{#if role === 'admin' || role === 'author'}
				<a href={resolve('/admin/tags')} class="nav-link" class:active={isActive('/admin/tags')}>
					Tags
				</a>
			{/if}

			<!-- Users, audit logs, products: admin only. -->
			{#if role === 'admin'}
				<a href={resolve('/admin/users')} class="nav-link" class:active={isActive('/admin/users')}>
					Users
				</a>
				<a
					href={resolve('/admin/audit-logs')}
					class="nav-link"
					class:active={isActive('/admin/audit-logs')}
				>
					Audit Logs
				</a>
				<a
					href={resolve('/admin/products')}
					class="nav-link"
					class:active={isActive('/admin/products')}
				>
					Products
				</a>
				<a
					href={resolve('/admin/product-types')}
					class="nav-link"
					class:active={isActive('/admin/product-types')}
				>
					Product Types
				</a>
			{/if}
		</nav>

		<footer class="sidebar-foot">
			<div class="user-info">
				<span class="user-name">
					{user.firstName}{user.lastName ? ` ${user.lastName}` : ''}
				</span>
				<span class="role-badge">{role}</span>
			</div>
			<!-- POST to /logout so the session is cleared server-side without a confirmation page. -->
			<form method="POST" action={resolve('/logout')} use:enhance>
				<button type="submit" class="sign-out-btn">Sign out</button>
			</form>
		</footer>
	</aside>

	<main class="admin-main">
		{@render children()}
	</main>
</div>

<style>
	.admin-shell {
		display: grid;
		grid-template-columns: 240px 1fr;
		min-height: 100vh;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		/* Sidebar fills the viewport and scrolls independently from the main content area. */
		position: sticky;
		top: 0;
		height: 100svh;
		overflow-y: auto;
	}

	.sidebar-brand {
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.brand-link {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		text-decoration: none;
		color: var(--color-text);
	}

	.brand-logo {
		width: 28px;
		height: 28px;
		object-fit: contain;
		flex-shrink: 0;
	}

	.brand-name {
		font-weight: 600;
		font-size: var(--text-base);
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		flex: 1;
		padding: var(--space-4) var(--space-3);
		gap: var(--space-1);
	}

	.nav-link {
		display: block;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--text-sm);
		transition:
			background var(--duration-fast) var(--ease-out),
			color var(--duration-fast) var(--ease-out);
	}

	.nav-link:hover {
		background: var(--color-surface-alt);
		color: var(--color-text);
	}

	/* keep focus ring visible inside the sidebar overflow container */
	.nav-link:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	.nav-link.active {
		background: var(--color-surface-alt);
		color: var(--color-primary);
		font-weight: 500;
	}

	.sidebar-foot {
		padding: var(--space-4) var(--space-6);
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.user-name {
		font-size: var(--text-sm);
		color: var(--color-text);
		font-weight: 500;
	}

	.role-badge {
		font-size: 0.75rem;
		padding: 2px var(--space-2);
		border-radius: var(--radius-full);
		background: var(--color-surface-alt);
		color: var(--color-text-muted);
		text-transform: capitalize;
	}

	.sign-out-btn {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		cursor: pointer;
		text-align: left;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.sign-out-btn:hover {
		color: var(--color-danger);
	}

	.admin-main {
		background: var(--color-bg);
		padding: var(--space-8);
	}
</style>
