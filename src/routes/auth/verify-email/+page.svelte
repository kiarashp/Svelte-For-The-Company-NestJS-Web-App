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
</script>

<main class="verify-page">
	<div class="card">
		{#if data.verifyStatus === 'verified'}
			<div class="status-icon success" aria-hidden="true">✓</div>
			<h1>Email verified</h1>
			<p class="message">Your email address has been confirmed. You can now sign in.</p>
			<a href={resolve('/login')} class="btn-primary">Sign in</a>
		{:else if data.verifyStatus === 'network-error'}
			<div class="status-icon error" aria-hidden="true">✕</div>
			<h1>Connection error</h1>
			<p class="message">Could not reach the server. Check your connection and try again.</p>
			<a href={resolve('/login')} class="back-link">Back to sign in</a>
		{:else}
			{#if data.verifyStatus === 'failed'}
				<div class="status-icon error" aria-hidden="true">✕</div>
				<h1>Link expired or invalid</h1>
				<p class="message">
					This verification link has expired or has already been used. Enter your email below to
					receive a new one.
				</p>
			{:else}
				<!-- verifyStatus === 'no-token': direct arrival with no token in the URL -->
				<h1>Verify your email</h1>
				<p class="message">
					Enter the email address you registered with and we'll send you a verification link.
				</p>
			{/if}

			{#if form?.sent}
				<p class="success-banner" role="status">
					Verification email sent — check your inbox (and spam folder).
				</p>
			{:else}
				{#if form?.message}
					<p class="error" role="alert">{form.message}</p>
				{/if}

				<form
					method="POST"
					action="?/resend"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							await update();
						};
					}}
				>
					<label class="field">
						<span class="label-text">Email address</span>
						<input type="email" name="email" required autocomplete="email" disabled={loading} />
					</label>

					<button type="submit" disabled={loading}>
						{loading ? 'Sending…' : 'Resend verification email'}
					</button>
				</form>
			{/if}

			<p class="footer-link">
				<a href={resolve('/login')}>Back to sign in</a>
			</p>
		{/if}
	</div>
</main>

<style>
	.verify-page {
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

	.status-icon.success {
		/* Tinted background so the icon reads as "done" without a new semantic token. */
		background: color-mix(in srgb, var(--color-success) 15%, transparent);
		color: var(--color-success);
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

	/* Used for the "verified" success state where the CTA is a link, not a button. */
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

	.error {
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-danger);
		border-left-width: 4px;
		border-radius: var(--radius-sm);
		color: var(--color-danger);
		font-size: var(--text-sm);
		text-align: left;
		width: 100%;
		box-sizing: border-box;
	}

	.success-banner {
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-success);
		border-left-width: 4px;
		border-radius: var(--radius-sm);
		color: var(--color-success);
		font-size: var(--text-sm);
		text-align: left;
		width: 100%;
		box-sizing: border-box;
	}

	.footer-link {
		margin-top: var(--space-6);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.footer-link a,
	.back-link {
		color: var(--color-primary);
		text-decoration: none;
	}

	.footer-link a:hover,
	.back-link:hover {
		text-decoration: underline;
	}

	.back-link {
		margin-top: var(--space-4);
		font-size: var(--text-sm);
	}
</style>
