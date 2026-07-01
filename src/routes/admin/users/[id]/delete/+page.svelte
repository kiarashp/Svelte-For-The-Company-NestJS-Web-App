<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}
	let { data, form }: Props = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Admin — Delete User</title>
</svelte:head>

<div class="page-header">
	<h1 class="page-title">Delete user</h1>
	<a href={resolve('/admin/users')} class="btn-secondary">Cancel</a>
</div>

<div class="confirm-card">
	{#if form?.message}
		<p class="error" role="alert">{form.message}</p>
	{/if}

	<p class="confirm-text">
		Delete <strong
			>"{data.targetUser.firstName}{data.targetUser.lastName ? ` ${data.targetUser.lastName}` : ''}"
			({data.targetUser.email})</strong
		>? This cannot be undone.
	</p>

	<form
		method="POST"
		action="?/delete"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
	>
		<div class="confirm-actions">
			<a href={resolve('/admin/users')} class="btn-secondary">Cancel</a>
			<button type="submit" class="btn-danger" disabled={submitting}>
				{submitting ? 'Deleting…' : 'Delete'}
			</button>
		</div>
	</form>
</div>

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

	.btn-secondary {
		display: inline-block;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-size: var(--text-sm);
		text-decoration: none;
		cursor: pointer;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.btn-secondary:hover {
		background: var(--color-surface-alt);
	}

	.btn-danger {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		border: none;
		background: var(--color-danger);
		color: var(--color-on-primary);
		font: inherit;
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.btn-danger:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-danger) 85%, black);
	}

	.btn-danger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.confirm-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		max-width: 480px;
		padding: var(--space-6);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.confirm-text {
		margin: 0;
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.confirm-actions {
		display: flex;
		gap: var(--space-3);
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
