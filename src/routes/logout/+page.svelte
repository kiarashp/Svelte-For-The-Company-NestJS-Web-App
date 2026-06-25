<script lang="ts">
	import { enhance } from '$app/forms';

	let loading = $state(false);
</script>

<main class="logout-page">
	<div class="card">
		<h1>Sign out</h1>
		<p class="message">Are you sure you want to sign out?</p>

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
			<button type="submit" disabled={loading}>
				{loading ? 'Signing out…' : 'Sign out'}
			</button>
		</form>
	</div>
</main>

<style>
	.logout-page {
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
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.message {
		margin: 0 0 1.5rem;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	button[type='submit'] {
		width: 100%;
		padding: 0.625rem 1rem;
		background: var(--color-danger);
		color: #fff;
		border: none;
		border-radius: 0.375rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	button[type='submit']:hover:not(:disabled) {
		filter: brightness(0.9);
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
