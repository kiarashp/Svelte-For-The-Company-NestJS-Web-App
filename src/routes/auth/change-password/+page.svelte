<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}
	let { form }: Props = $props();

	let loading = $state(false);
	let newPassword = $state('');

	// Re-evaluated whenever newPassword changes — drives the rule checklist.
	let rules = $derived([
		{ label: '8+ characters', ok: newPassword.length >= 8 },
		{ label: 'Uppercase', ok: /[A-Z]/.test(newPassword) },
		{ label: 'Lowercase', ok: /[a-z]/.test(newPassword) },
		{ label: 'Number', ok: /[0-9]/.test(newPassword) },
		{ label: 'Symbol', ok: /[^A-Za-z0-9]/.test(newPassword) }
	]);
</script>

<main class="change-page">
	<div class="card">
		<h1>Change password</h1>

		{#if form?.changed}
			<p class="success-banner" role="status">Password updated successfully.</p>
		{/if}

		{#if form?.message}
			<p class="error" role="alert">{form.message}</p>
		{/if}

		<form
			method="POST"
			action="?/changePassword"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					// Reset the password fields on success so they're not left populated.
					await update({ reset: true });
				};
			}}
		>
			<label class="field">
				<span class="label-text">Current password</span>
				<input
					type="password"
					name="currentPassword"
					required
					autocomplete="current-password"
					disabled={loading}
				/>
			</label>

			<label class="field">
				<span class="label-text">New password</span>
				<input
					type="password"
					name="newPassword"
					required
					autocomplete="new-password"
					disabled={loading}
					bind:value={newPassword}
				/>
				<ul class="rules" aria-label="Password requirements">
					{#each rules as rule (rule.label)}
						<li class:ok={rule.ok}>{rule.label}</li>
					{/each}
				</ul>
			</label>

			<label class="field">
				<span class="label-text">Confirm new password</span>
				<input
					type="password"
					name="confirmPassword"
					required
					autocomplete="new-password"
					disabled={loading}
				/>
			</label>

			<button type="submit" disabled={loading}>
				{loading ? 'Saving…' : 'Update password'}
			</button>
		</form>
	</div>
</main>

<style>
	.change-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
		padding: var(--space-4);
	}

	.card {
		width: 100%;
		max-width: 420px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: var(--space-8);
	}

	h1 {
		margin: 0 0 var(--space-6);
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--color-text);
	}

	.success-banner {
		margin: 0 0 var(--space-4);
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-success);
		/* Left accent makes the banner scannable at a glance. */
		border-left-width: 4px;
		border-radius: var(--radius-sm);
		color: var(--color-success);
		font-size: var(--text-sm);
	}

	.error {
		margin: 0 0 var(--space-4);
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-danger);
		/* Left accent makes the error scannable at a glance. */
		border-left-width: 4px;
		border-radius: var(--radius-sm);
		color: var(--color-danger);
		font-size: var(--text-sm);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.label-text {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.rules {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem 0.75rem;
	}

	.rules li {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		transition: color var(--duration-fast) var(--ease-out);
	}

	/* Checkmark prefix — visible even before the user types. */
	.rules li::before {
		content: '✓ ';
	}

	.rules li.ok {
		color: var(--color-success);
	}

	input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-alt);
		color: var(--color-text);
		font-size: var(--text-base);
		line-height: 1.5;
		transition: border-color var(--duration-fast) var(--ease-out);
	}

	input:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		border-color: var(--color-focus-ring);
	}

	input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	button[type='submit'] {
		margin-top: var(--space-2);
		padding: 0.625rem 1rem;
		background: var(--color-primary);
		color: var(--color-on-primary);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--text-base);
		font-weight: 500;
		cursor: pointer;
		transition: background-color var(--duration-fast) var(--ease-out);
	}

	button[type='submit']:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	button[type='submit']:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	button[type='submit']:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
