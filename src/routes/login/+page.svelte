<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance, applyAction, deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}
	let { form }: Props = $props();

	let loading = $state(false);

	// Google Identity Services — only active when a client ID is configured.
	const googleClientId = PUBLIC_GOOGLE_CLIENT_ID;
	let googleLoading = $state(false);
	// Local error for the Google path — not piped through the form action round-trip.
	let googleError = $state<string | null>(null);

	// Send the Google ID token directly to the ?/google action via fetch + applyAction.
	// GIS delivers the credential in a JS callback, so we skip the form DOM entirely —
	// bridging it through a hidden input risks the value not being flushed before submit.
	async function sendCredential(credential: string) {
		googleLoading = true;
		googleError = null;

		const body = new FormData();
		body.set('token', credential);

		const res = await fetch('?/google', { method: 'POST', body });
		const result = deserialize(await res.text());

		if (result.type === 'redirect') {
			// Invalidate stale load data so the new session is visible after navigation.
			await invalidateAll();
			await applyAction(result);
		} else if (result.type === 'failure') {
			googleError = (result.data?.googleError as string) ?? 'Sign-in failed.';
			googleLoading = false;
		} else {
			await applyAction(result);
			googleLoading = false;
		}
	}

	// onMount: GIS SDK only exists in the browser — strictly mount-only browser code.
	// Inject the script dynamically so onload fires exactly when the SDK is ready — no polling.
	onMount(() => {
		if (!googleClientId) return;

		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.onload = () => {
			window.google?.accounts.id.initialize({
				client_id: googleClientId,
				callback: ({ credential }) => {
					if (credential) sendCredential(credential);
				}
			});
		};
		document.head.appendChild(script);

		// Remove the script tag when the login page unmounts.
		return () => script.remove();
	});
</script>

<main class="login-page">
	<div class="card">
		<h1>Sign in</h1>

		<form
			method="POST"
			action="?/login"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			{#if form?.message}
				<!-- warning colour when the issue is verification, not wrong credentials -->
				<p class="error" class:warning={form.message?.includes('verify')} role="alert">
					{form.message}
					{#if form.message?.includes('verify')}
						<!-- Inline link so the user can immediately request a new link. -->
						<a href={resolve('/auth/verify-email')} class="verify-link">Resend verification email</a
						>
					{/if}
				</p>
			{/if}

			<label class="field">
				<span class="label-text">Email</span>
				<input type="email" name="email" required autocomplete="email" disabled={loading} />
			</label>

			<label class="field">
				<span class="field-header">
					<span class="label-text">Password</span>
					<a href={resolve('/auth/forgot-password')} class="forgot-link">Forgot password?</a>
				</span>
				<input
					type="password"
					name="password"
					required
					autocomplete="current-password"
					disabled={loading}
				/>
			</label>

			<button type="submit" disabled={loading}>
				{loading ? 'Signing in…' : 'Sign in'}
			</button>
		</form>

		{#if googleClientId}
			<div class="divider" aria-hidden="true"><span>or</span></div>

			{#if googleError}
				<p class="error" role="alert">{googleError}</p>
			{/if}

			<button
				type="button"
				class="google-btn"
				disabled={googleLoading || loading}
				onclick={() => window.google?.accounts.id.prompt()}
			>
				{googleLoading ? 'Signing in…' : 'Sign in with Google'}
			</button>
		{/if}
	</div>
</main>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
		padding: 1rem;
	}

	.card {
		width: 100%;
		max-width: 400px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 2rem;
	}

	h1 {
		margin: 0 0 1.5rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.error {
		margin: 0;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-danger);
		/* Left accent makes the error scannable at a glance without a background color variable. */
		border-left-width: 4px;
		border-radius: 0.375rem;
		color: var(--color-danger);
		font-size: 0.875rem;
	}

	/* Unverified-email case uses amber so it reads as "action needed" not "you failed". */
	.error.warning {
		border-color: var(--color-warning);
		color: var(--color-warning);
	}

	/* Sits inside the warning banner; inherits the amber color. */
	.verify-link {
		display: block;
		margin-top: 0.375rem;
		color: inherit;
		font-weight: 500;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	/* Row that places the label and the forgot-password link on opposite ends. */
	.field-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.label-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.forgot-link {
		font-size: 0.8125rem;
		color: var(--color-primary);
		text-decoration: none;
	}

	.forgot-link:hover {
		text-decoration: underline;
	}

	.forgot-link:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		border-radius: 2px;
	}

	input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		background: var(--color-surface-alt);
		color: var(--color-text);
		font-size: 1rem;
		line-height: 1.5;
		transition: border-color 0.15s;
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
		margin-top: 0.5rem;
		padding: 0.625rem 1rem;
		background: var(--color-primary);
		color: var(--color-on-primary);
		border: none;
		border-radius: 0.375rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s;
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

	.divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1.25rem;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-top: 1px solid var(--color-border);
	}

	.google-btn {
		margin-top: 1rem;
		width: 100%;
		padding: 0.625rem 1rem;
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.google-btn:hover:not(:disabled) {
		background: var(--color-surface-alt);
	}

	.google-btn:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	.google-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
