<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}
	let { data, form }: Props = $props();

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

<main class="reset-page">
	<div class="card">
		{#if form?.expired}
			<!-- Token is expired or already used — show a terminal error state, not the form. -->
			<div class="status-icon error" aria-hidden="true">✕</div>
			<h1>Link expired</h1>
			<p class="message">{form.message}</p>
			<a href={resolve('/auth/forgot-password')} class="btn-primary">Request a new link</a>
		{:else}
			<h1>Reset your password</h1>
			<p class="message">Choose a strong new password for your account.</p>

			<form
				method="POST"
				action="?/resetPassword"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<!-- Carry the reset token through the form submission — it came from the email link URL. -->
				<input type="hidden" name="token" value={data.token} />

				{#if form?.message}
					<p class="error" role="alert">{form.message}</p>
				{/if}

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
					{loading ? 'Saving…' : 'Set new password'}
				</button>
			</form>

			<p class="footer-link">
				<a href={resolve('/auth/forgot-password')}>Request a different reset link</a>
			</p>
		{/if}
	</div>
</main>

<style>
	.reset-page {
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
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.status-icon {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: var(--space-4);
	}

	.status-icon.error {
		background: color-mix(in srgb, var(--color-danger) 15%, transparent);
		color: var(--color-danger);
	}

	h1 {
		margin: 0 0 var(--space-3);
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--color-text);
	}

	.message {
		margin: 0 0 var(--space-6);
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	/* Used for the expired-state CTA where the action is a link, not a button. */
	.btn-primary {
		display: block;
		width: 100%;
		box-sizing: border-box;
		padding: 0.625rem 1rem;
		background: var(--color-primary);
		color: var(--color-on-primary);
		border-radius: var(--radius-md);
		text-align: center;
		text-decoration: none;
		font-size: var(--text-base);
		font-weight: 500;
		transition: background-color var(--duration-fast) var(--ease-out);
	}

	.btn-primary:hover {
		background: var(--color-primary-hover);
	}

	.btn-primary:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		text-align: left;
	}

	.error {
		margin: 0;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-danger);
		/* Left accent makes the error scannable at a glance. */
		border-left-width: 4px;
		border-radius: var(--radius-sm);
		color: var(--color-danger);
		font-size: var(--text-sm);
		width: 100%;
		box-sizing: border-box;
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

	input[type='password'] {
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

	input[type='password']:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		border-color: var(--color-focus-ring);
	}

	input[type='password']:disabled {
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

	.footer-link {
		margin-top: var(--space-6);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.footer-link a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.footer-link a:hover {
		text-decoration: underline;
	}
</style>
