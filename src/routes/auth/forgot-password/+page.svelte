<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}
	let { form }: Props = $props();

	let loading = $state(false);
</script>

<main class="forgot-page">
	<div class="card">
		{#if form?.sent}
			<div class="status-icon success" aria-hidden="true">✓</div>
			<h1>Check your email</h1>
			<p class="message">
				If that address is registered, you'll receive a reset link shortly. Check your spam folder
				too.
			</p>
			<a href={resolve('/login')} class="btn-primary">Back to sign in</a>
		{:else}
			<h1>Forgot password?</h1>
			<p class="message">Enter your email and we'll send you a reset link.</p>

			<form
				method="POST"
				action="?/forgotPassword"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				{#if form?.message}
					<p class="error" role="alert">{form.message}</p>
				{/if}

				<label class="field">
					<span class="label-text">Email address</span>
					<input type="email" name="email" required autocomplete="email" disabled={loading} />
				</label>

				<button type="submit" disabled={loading}>
					{loading ? 'Sending…' : 'Send reset link'}
				</button>
			</form>

			<p class="footer-link">
				<a href={resolve('/login')}>Back to sign in</a>
			</p>
		{/if}
	</div>
</main>

<style>
	.forgot-page {
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

	/* Tinted background so the icon reads as "done" without a new semantic token. */
	.status-icon.success {
		background: color-mix(in srgb, var(--color-success) 15%, transparent);
		color: var(--color-success);
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

	/* Used for the success CTA where the action is a link, not a button. */
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
