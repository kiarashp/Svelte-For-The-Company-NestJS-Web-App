<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();

	// Show the Author column only when the user can see other people's posts.
	let showAuthorColumn = $derived(
		page.data.user?.role === 'admin' || page.data.user?.role === 'author'
	);

	// Status badge label and semantic color token per post status.
	function statusStyle(status: string): { label: string; color: string; bg: string } {
		switch (status) {
			case 'published':
				return {
					label: 'Published',
					color: 'var(--color-success)',
					bg: 'color-mix(in srgb, var(--color-success) 15%, transparent)'
				};
			case 'draft':
				return { label: 'Draft', color: 'var(--color-text-muted)', bg: 'var(--color-surface-alt)' };
			case 'review':
				return {
					label: 'In Review',
					color: 'var(--color-warning)',
					bg: 'color-mix(in srgb, var(--color-warning) 15%, transparent)'
				};
			case 'scheduled':
				return {
					label: 'Scheduled',
					color: 'var(--color-accent)',
					bg: 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
				};
			default:
				return { label: status, color: 'var(--color-text-muted)', bg: 'var(--color-surface-alt)' };
		}
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Admin — Posts</title>
</svelte:head>

<div class="page-header">
	<h1 class="page-title">Posts</h1>
	<a href={resolve('/admin/posts/new')} class="btn-primary">New post</a>
</div>

<!-- Filter bar — submits as GET so the URL reflects the current filters. -->
<form method="GET" class="filter-bar">
	<input
		type="search"
		name="q"
		value={data.filters.q}
		placeholder="Search posts…"
		class="filter-input"
	/>
	<select name="status" class="filter-select">
		<option value="" selected={data.filters.status === ''}>All statuses</option>
		<option value="draft" selected={data.filters.status === 'draft'}>Draft</option>
		<option value="review" selected={data.filters.status === 'review'}>In Review</option>
		<option value="scheduled" selected={data.filters.status === 'scheduled'}>Scheduled</option>
		<option value="published" selected={data.filters.status === 'published'}>Published</option>
	</select>
	<!-- Reset page to 1 when filters change. -->
	<input type="hidden" name="page" value="1" />
	<button type="submit" class="btn-secondary">Filter</button>
</form>

{#if data.posts.length === 0}
	<p class="empty-state">No posts found.</p>
{:else}
	<div class="table-wrapper">
		<table class="posts-table">
			<thead>
				<tr>
					<th>Title</th>
					{#if showAuthorColumn}<th>Author</th>{/if}
					<th>Status</th>
					<th>Created</th>
					<th class="actions-col">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.posts as post (post.id)}
					{@const style = statusStyle(post.status)}
					<tr>
						<td class="title-cell">
							<span class="post-title">{post.title}</span>
							{#if post.slug}
								<span class="post-slug">/{post.slug}</span>
							{/if}
						</td>
						{#if showAuthorColumn}
							<td
								>{post.author.firstName}{post.author.lastName ? ` ${post.author.lastName}` : ''}</td
							>
						{/if}
						<td>
							<span class="status-badge" style:color={style.color} style:background={style.bg}>
								{style.label}
							</span>
						</td>
						<td class="date-cell">{formatDate(post.createdAt)}</td>
						<td class="actions-cell">
							{#if post.canEdit}
								<a
									href={resolve('/admin/posts/[id]/edit', { id: String(post.id) })}
									class="action-link"
								>
									Edit
								</a>
							{/if}
							{#if post.canDelete}
								<!-- Delete handled by a dedicated route with confirmation — not inline. -->
								<a
									href={resolve('/admin/posts/[id]/delete', { id: String(post.id) })}
									class="action-link action-danger"
								>
									Delete
								</a>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination — drives via ?page= search param. -->
	{#if data.meta.totalPages > 1}
		<nav class="pagination" aria-label="Post list pages">
			{#each Array.from({ length: data.meta.totalPages }, (_, i) => i + 1) as p (p)}
				<a
					href="{resolve('/admin/posts')}?q={data.filters.q}&status={data.filters.status}&page={p}"
					class="page-link"
					class:current={p === data.meta.currentPage}
					aria-current={p === data.meta.currentPage ? 'page' : undefined}
				>
					{p}
				</a>
			{/each}
		</nav>
	{/if}
{/if}

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-6);
	}

	.page-title {
		font-size: var(--text-2xl);
		font-weight: 700;
		color: var(--color-text);
	}

	.btn-primary {
		display: inline-block;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary);
		text-decoration: none;
		font-size: var(--text-sm);
		font-weight: 500;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.btn-primary:hover {
		background: var(--color-primary-hover);
	}

	.btn-secondary {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-size: var(--text-sm);
		cursor: pointer;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.btn-secondary:hover {
		background: var(--color-surface-alt);
	}

	.filter-bar {
		display: flex;
		gap: var(--space-3);
		margin-bottom: var(--space-6);
		flex-wrap: wrap;
	}

	.filter-input,
	.filter-select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-size: var(--text-sm);
	}

	.filter-input {
		flex: 1;
		min-width: 200px;
	}

	.filter-input:focus,
	.filter-select:focus {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	.table-wrapper {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.posts-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}

	.posts-table th {
		padding: var(--space-3) var(--space-4);
		text-align: left;
		font-weight: 500;
		color: var(--color-text-muted);
		background: var(--color-surface-alt);
		border-bottom: 1px solid var(--color-border);
	}

	.posts-table td {
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
		vertical-align: middle;
	}

	.posts-table tr:last-child td {
		border-bottom: none;
	}

	.posts-table tr:hover td {
		background: var(--color-surface-alt);
	}

	.title-cell {
		max-width: 320px;
	}

	.post-title {
		display: block;
		font-weight: 500;
		color: var(--color-text);
	}

	.post-slug {
		display: block;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 2px;
	}

	.status-badge {
		display: inline-block;
		padding: 2px var(--space-2);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.date-cell {
		white-space: nowrap;
		color: var(--color-text-muted);
	}

	.actions-col {
		width: 120px;
	}

	.actions-cell {
		display: flex;
		gap: var(--space-3);
		align-items: center;
	}

	.action-link {
		color: var(--color-primary);
		text-decoration: none;
		font-size: var(--text-sm);
	}

	.action-link:hover {
		text-decoration: underline;
	}

	.action-danger {
		color: var(--color-danger);
	}

	.empty-state {
		padding: var(--space-8);
		text-align: center;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.pagination {
		display: flex;
		gap: var(--space-2);
		justify-content: center;
		margin-top: var(--space-6);
	}

	.page-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		text-decoration: none;
		font-size: var(--text-sm);
		transition: background var(--duration-fast) var(--ease-out);
	}

	.page-link:hover {
		background: var(--color-surface-alt);
	}

	.page-link.current {
		background: var(--color-primary);
		color: var(--color-on-primary);
		border-color: var(--color-primary);
	}
</style>
