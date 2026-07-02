<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Admin — Avatar options</title>
</svelte:head>

<div class="page-header">
	<h1 class="page-title">Avatar options</h1>
	<a href={resolve('/admin/avatar-options/new')} class="btn-primary">Add avatar</a>
</div>

{#if data.loadError}
	<p class="error" role="alert">{data.loadError}</p>
{:else if data.avatarOptions.length === 0}
	<p class="empty-state">No avatar options found.</p>
{:else}
	<div class="avatar-grid">
		{#each data.avatarOptions as option (option.id)}
			<div class="avatar-card">
				<img src={option.url} alt="Avatar option {option.id}" class="avatar-thumb" />
				<span class="avatar-date">{new Date(option.createdAt).toLocaleDateString('en-GB')}</span>
				<a
					href={resolve('/admin/avatar-options/[id]/delete', { id: String(option.id) })}
					class="action-link action-danger"
				>
					Delete
				</a>
			</div>
		{/each}
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-6);
	}

	.page-title {
		font-size: var(--text-2xl);
		font-weight: 700;
		color: var(--color-text);
	}

	.btn-primary {
		display: inline-block;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary);
		text-decoration: none;
		font-size: var(--text-sm);
		font-weight: 500;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.btn-primary:hover {
		background: var(--color-primary-hover);
	}

	.avatar-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: var(--space-4);
	}

	.avatar-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.avatar-thumb {
		width: 72px;
		height: 72px;
		border-radius: var(--radius-full);
		object-fit: cover;
		background: var(--color-surface-alt);
	}

	.avatar-date {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.action-link {
		color: var(--color-primary);
		text-decoration: none;
		font-size: var(--text-sm);
	}

	.action-link:hover {
		text-decoration: underline;
	}

	.action-danger {
		color: var(--color-danger);
	}

	.empty-state {
		padding: var(--space-8);
		text-align: center;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.error {
		margin: 0;
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-danger);
		border-left-width: 4px;
		border-radius: var(--radius-sm);
		color: var(--color-danger);
		font-size: var(--text-sm);
	}
</style>
