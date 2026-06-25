<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<div class="page">
	<header class="header">
		<span class="site-name">Acme Corp</span>
		<ThemeToggle />
	</header>

	<main class="main">
		<section class="hero">
			<h1>Theme demo</h1>
			<p class="lead">Toggle between Light, Dark, and System above. The background, text, and cards should all switch instantly — and survive a page reload (no flash).</p>
		</section>

		<section class="cards">
			<div class="card">
				<h2>Surface card</h2>
				<p>This card uses <code>--color-surface</code> so it sits one level above the page background in both themes.</p>
			</div>
			<div class="card accent">
				<h2>Primary action</h2>
				<p>Button below uses <code>--color-primary</code> and <code>--color-on-primary</code>.</p>
				<button class="btn">Call to action</button>
			</div>
			<div class="card">
				<h2>Muted text</h2>
				<p>Body copy is <code>--color-text</code>. This paragraph is <span class="muted">--color-text-muted</span>.</p>
			</div>
		</section>
	</main>
</div>

<style>
	.page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-8);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.site-name {
		font-weight: 700;
		font-size: var(--text-lg);
		color: var(--color-primary);
	}

	.main {
		flex: 1;
		padding: var(--space-12) var(--space-8);
		max-width: 960px;
		margin: 0 auto;
		width: 100%;
	}

	.hero {
		margin-bottom: var(--space-12);
	}

	h1 {
		font-size: var(--text-3xl);
		margin: 0 0 var(--space-4);
	}

	.lead {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		margin: 0;
		max-width: 60ch;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: var(--space-6);
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		box-shadow: var(--shadow-sm);
	}

	.card h2 {
		margin: 0 0 var(--space-3);
		font-size: var(--text-lg);
	}

	.card p {
		margin: 0;
		color: var(--color-text-muted);
		line-height: 1.6;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--color-accent);
	}

	.muted {
		color: var(--color-text-muted);
	}

	.btn {
		margin-top: var(--space-4);
		padding: var(--space-2) var(--space-4);
		background: var(--color-primary);
		color: var(--color-on-primary);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-family: var(--font-sans);
		cursor: pointer;
	}

	.btn:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}
</style>
