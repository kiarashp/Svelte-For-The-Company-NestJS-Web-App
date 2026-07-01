<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}
	let { form }: Props = $props();

	let submitting = $state(false);
	let password = $state('');

	// Re-evaluated whenever `password` changes — drives the rule checklist (same rules as /register).
	let rules = $derived([
		{ label: '8+ characters', ok: password.length >= 8 },
		{ label: 'Uppercase', ok: /[A-Z]/.test(password) },
		{ label: 'Lowercase', ok: /[a-z]/.test(password) },
		{ label: 'Number', ok: /[0-9]/.test(password) },
		{ label: 'Symbol', ok: /[^A-Za-z0-9]/.test(password) }
	]);
</script>

<svelte:head>
	<title>Admin — New User</title>
</svelte:head>

<div class="page-header">
	<h1 class="page-title">New user</h1>
	<a href={resolve('/admin/users')} class="btn-secondary">Cancel</a>
</div>

<form
	method="POST"
	action="?/create"
	class="user-form"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update();
		};
	}}
>
	{#if form?.message}
		<p class="error" role="alert">{form.message}</p>
	{/if}

	<label class="field">
		<span class="label-text">First name</span>
		<input type="text" name="firstName" required disabled={submitting} />
	</label>

	<label class="field">
		<span class="label-text">Last name</span>
		<input type="text" name="lastName" disabled={submitting} />
	</label>

	<label class="field">
		<span class="label-text">Email</span>
		<input type="email" name="email" required disabled={submitting} />
	</label>

	<label class="field">
		<span class="label-text">Password</span>
		<input
			type="password"
			name="password"
			required
			autocomplete="new-password"
			disabled={submitting}
			bind:value={password}
		/>
		<ul class="rules" aria-label="Password requirements">
			{#each rules as rule (rule.label)}
				<li class:ok={rule.ok}>{rule.label}</li>
			{/each}
		</ul>
	</label>

	<label class="field">
		<span class="label-text">Confirm password</span>
		<input
			type="password"
			name="confirmPassword"
			required
			autocomplete="new-password"
			disabled={submitting}
		/>
	</label>

	<label class="field">
		<span class="label-text">Role</span>
		<select name="role" disabled={submitting}>
			<option value="user" selected>User</option>
			<option value="editor">Editor</option>
			<option value="author">Author</option>
			<option value="admin">Admin</option>
		</select>
	</label>

	<label class="checkbox-field">
		<input type="checkbox" name="isEmailVerified" disabled={submitting} />
		Mark email as verified (skips the verification email)
	</label>

	<button type="submit" class="btn-primary" disabled={submitting}>
		{submitting ? 'Creating…' : 'Create user'}
	</button>
</form>

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
		border: none;
		background: var(--color-primary);
		color: var(--color-on-primary);
		font: inherit;
		font-size: var(--text-sm);
		font-weight: 500;
		text-decoration: none;
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

	.btn-secondary {
		display: inline-block;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-sm);
		text-decoration: none;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.btn-secondary:hover {
		background: var(--color-surface-alt);
	}

	.user-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		max-width: 480px;
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

	input[type='text'],
	input[type='email'],
	input[type='password'],
	select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-size: var(--text-sm);
	}

	input:focus-visible,
	select:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	input:disabled,
	select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.checkbox-field {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text);
	}

	.rules {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.rules li.ok {
		color: var(--color-success);
	}
</style>
