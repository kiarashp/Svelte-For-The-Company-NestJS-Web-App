<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Admin — Dashboard</title>
</svelte:head>

<div class="dashboard">
	<h1 class="dashboard-heading">
		Welcome, {page.data.user?.firstName}
	</h1>
	<p class="dashboard-lead">
		Use the sidebar to manage content. Start with your
		<a href={resolve('/admin/posts')}>posts</a>.
	</p>
</div>

<style>
	.dashboard {
		max-width: 600px;
	}

	.dashboard-heading {
		font-size: var(--text-2xl);
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--space-4);
	}

	.dashboard-lead {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
		line-height: 1.6;
	}

	.dashboard-lead a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.dashboard-lead a:hover {
		text-decoration: underline;
	}
</style>
