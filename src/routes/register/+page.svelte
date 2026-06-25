<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}
	let { form }: Props = $props();

	let loading = $state(false);
	let password = $state('');

	// Re-evaluated whenever `password` changes — drives the rule checklist.
	let rules = $derived([
		{ label: '8+ characters', ok: password.length >= 8 },
		{ label: 'Uppercase', ok: /[A-Z]/.test(password) },
		{ label: 'Lowercase', ok: /[a-z]/.test(password) },
		{ label: 'Number', ok: /[0-9]/.test(password) },
		{ label: 'Symbol', ok: /[^A-Za-z0-9]/.test(password) }
	]);
</script>

<main class="register-page">
	<div class="card">
		<h1>Create an account</h1>

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

			<div class="row">
				<label class="field">
					<span class="label-text">First name</span>
					<input
						type="text"
						name="firstName"
						required
						autocomplete="given-name"
						disabled={loading}
					/>
				</label>

				<label class="field">
					<span class="label-text">Last name <span class="optional">(optional)</span></span>
					<input type="text" name="lastName" autocomplete="family-name" disabled={loading} />
				</label>
			</div>

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
					autocomplete="new-password"
					disabled={loading}
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
					disabled={loading}
				/>
			</label>

			<button type="submit" disabled={loading}>
				{loading ? 'Creating account…' : 'Create account'}
			</button>
		</form>

		<p class="signin-link">
			Already have an account? <a href={resolve('/login')}>Sign in</a>
		</p>
	</div>
</main>

<style>
	.register-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
		padding: 1rem;
	}

	.card {
		width: 100%;
		max-width: 480px;
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

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	/* min-width: 0 lets grid items shrink below their content's intrinsic min-width
	   (inputs have a browser-default size that would otherwise push past 1fr). */
	.row .field {
		min-width: 0;
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

	.optional {
		font-weight: 400;
		color: var(--color-text-muted);
		opacity: 0.7;
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

	.signin-link {
		margin: 1.25rem 0 0;
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.signin-link a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.signin-link a:hover {
		text-decoration: underline;
	}
</style>
