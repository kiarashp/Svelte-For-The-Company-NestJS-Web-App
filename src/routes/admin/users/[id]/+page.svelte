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
	let verifying = $state(false);
</script>

<svelte:head>
	<title>Admin — Edit User</title>
</svelte:head>

<div class="page-header">
	<h1 class="page-title">Edit user</h1>
	<a href={resolve('/admin/users')} class="btn-secondary">Cancel</a>
</div>

<form
	method="POST"
	action="?/update"
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
		<input
			type="text"
			name="firstName"
			required
			disabled={submitting}
			value={data.targetUser.firstName}
		/>
	</label>

	<label class="field">
		<span class="label-text">Last name</span>
		<input
			type="text"
			name="lastName"
			disabled={submitting}
			value={data.targetUser.lastName ?? ''}
		/>
	</label>

	<label class="field">
		<span class="label-text">Email</span>
		<input type="email" name="email" required disabled={submitting} value={data.targetUser.email} />
	</label>

	<label class="field">
		<span class="label-text">New password</span>
		<input type="password" name="password" disabled={submitting} autocomplete="new-password" />
		<span class="help-text">Leave blank to keep the current password.</span>
	</label>

	<!-- Role is display-only here — changing it is a separate, dedicated confirm-step admin route. -->
	<div class="field">
		<span class="label-text">Role</span>
		<div class="role-row">
			<span class="role-badge">{data.targetUser.role}</span>
			{#if !data.isSelf}
				<a href={resolve('/admin/users/[id]/role', { id: String(data.targetUser.id) })}>
					Change role
				</a>
			{/if}
		</div>
	</div>

	<button type="submit" class="btn-primary" disabled={submitting}>
		{submitting ? 'Saving…' : 'Save changes'}
	</button>
</form>

<div class="verify-section">
	<span class="label-text">Email verification</span>
	<div class="verify-row">
		<span class="verify-status"
			>{data.targetUser.isEmailVerified ? 'Verified' : 'Not verified'}</span
		>
		<!-- Toggle omitted for the signed-in admin's own account — see isSelf guard in +page.server.ts. -->
		{#if !data.isSelf}
			{#if data.targetUser.isEmailVerified}
				<form
					method="POST"
					action="?/unverifyEmail"
					use:enhance={() => {
						verifying = true;
						return async ({ update }) => {
							verifying = false;
							await update();
						};
					}}
				>
					<button type="submit" class="btn-secondary" disabled={verifying}>
						{verifying ? 'Updating…' : 'Mark as unverified'}
					</button>
				</form>
			{:else}
				<form
					method="POST"
					action="?/verifyEmail"
					use:enhance={() => {
						verifying = true;
						return async ({ update }) => {
							verifying = false;
							await update();
						};
					}}
				>
					<button type="submit" class="btn-secondary" disabled={verifying}>
						{verifying ? 'Updating…' : 'Mark as verified'}
					</button>
				</form>
			{/if}
		{/if}
	</div>
</div>

{#if !data.isSelf}
	<p class="delete-link">
		<a href={resolve('/admin/users/[id]/delete', { id: String(data.targetUser.id) })}>
			Delete this user
		</a>
	</p>
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
	input[type='password'] {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-size: var(--text-sm);
	}

	input:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.help-text {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.role-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.role-row a {
		color: var(--color-primary);
		text-decoration: none;
		font-size: var(--text-sm);
	}

	.role-row a:hover {
		text-decoration: underline;
	}

	.role-badge {
		display: inline-block;
		align-self: flex-start;
		padding: 2px var(--space-2);
		border-radius: var(--radius-full);
		background: var(--color-surface-alt);
		color: var(--color-text-muted);
		font-size: 0.75rem;
		text-transform: capitalize;
	}

	.verify-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-top: var(--space-6);
		max-width: 480px;
	}

	.verify-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.verify-status {
		font-size: var(--text-sm);
		color: var(--color-text);
	}

	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.delete-link {
		margin-top: var(--space-6);
		font-size: var(--text-sm);
	}

	.delete-link a {
		color: var(--color-danger);
	}
</style>
