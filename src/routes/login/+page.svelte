<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}
	let { form }: Props = $props();

	let loading = $state(false);
</script>

<main class="login-page">
	<div class="card">
		<h1>Sign in</h1>

		<form
			method="POST"
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
				<span class="label-text">Email</span>
				<input type="email" name="email" required autocomplete="email" disabled={loading} />
			</label>

			<label class="field">
				<span class="label-text">Password</span>
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

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.label-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
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
</style>
