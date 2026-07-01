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
	// Writable derived — defaults to the loaded user's current role but stays editable via the
	// select binding, and re-syncs if SvelteKit reuses this component across a nav to another user.
	let selectedRole = $derived(data.targetUser.role);
</script>

<svelte:head>
	<title>Admin — Change Role</title>
</svelte:head>

<div class="page-header">
	<h1 class="page-title">Change role</h1>
	<a href={resolve('/admin/users/[id]', { id: String(data.targetUser.id) })} class="btn-secondary">
		Cancel
	</a>
</div>

<div class="confirm-card">
	{#if form?.message}
		<p class="error" role="alert">{form.message}</p>
	{/if}

	<p class="confirm-text">
		Change the role for <strong
			>"{data.targetUser.firstName}{data.targetUser.lastName ? ` ${data.targetUser.lastName}` : ''}"
			({data.targetUser.email})</strong
		>, currently <strong class="current-role">{data.targetUser.role}</strong>.
	</p>

	<form
		method="POST"
		action="?/changeRole"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
	>
		<label class="field">
			<span class="label-text">New role</span>
			<select name="role" bind:value={selectedRole} disabled={submitting}>
				<option value="user">user</option>
				<option value="editor">editor</option>
				<option value="author">author</option>
				<option value="admin">admin</option>
			</select>
		</label>

		<div class="confirm-actions">
			<a
				href={resolve('/admin/users/[id]', { id: String(data.targetUser.id) })}
				class="btn-secondary"
			>
				Cancel
			</a>
			<button
				type="submit"
				class="btn-primary"
				disabled={submitting || selectedRole === data.targetUser.role}
			>
				{submitting ? 'Saving…' : 'Change role'}
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

	.btn-primary {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		border: none;
		background: var(--color-primary);
		color: var(--color-on-primary);
		font: inherit;
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.btn-primary:disabled {
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

	.current-role {
		text-transform: capitalize;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.label-text {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-size: var(--text-sm);
		text-transform: capitalize;
	}

	select:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.confirm-actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-5);
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
