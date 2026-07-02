<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();

	let hasActiveFilter = $derived(data.actionFilter !== null || data.entityFilter !== null);

	// One header per sortable backend column, in table order.
	const COLUMNS = [
		{ key: 'id', label: 'ID' },
		{ key: 'action', label: 'Action' },
		{ key: 'entity', label: 'Entity' },
		{ key: 'entityId', label: 'Entity ID' },
		{ key: 'userId', label: 'User' },
		{ key: 'createdAt', label: 'Date' }
	] as const;
	type SortKey = (typeof COLUMNS)[number]['key'];

	// Shared query-string builder so pagination and header links stay consistent — every link
	// must carry the active filters and sort along or clicking one would silently reset the rest.
	function buildQuery(page: number, sortBy: SortKey, order: 'asc' | 'desc'): string {
		const parts = [`page=${page}`, `sortBy=${sortBy}`, `order=${order}`];
		// action/sort values are validated enums, safe as-is; entity is free text and needs encoding.
		if (data.actionFilter) parts.push(`action=${data.actionFilter}`);
		if (data.entityFilter) parts.push(`entity=${encodeURIComponent(data.entityFilter)}`);
		return parts.join('&');
	}

	// Clicking the active column toggles its direction; a new column starts ascending.
	// Sorting changes the row order globally, so the link always jumps back to page 1.
	function sortQuery(key: SortKey): string {
		const order = key === data.sortBy ? (data.order === 'asc' ? 'desc' : 'asc') : 'asc';
		return buildQuery(1, key, order);
	}

	// Log rows embed a user snapshot (may reference a since-deleted user) — prefer the name,
	// fall back to email, then the bare id, since snapshot fields are nullable.
	function userLabel(user: {
		id: number;
		firstName?: string | null;
		lastName?: string | null;
		email?: string | null;
	}): string {
		const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
		return name || user.email || `#${user.id}`;
	}
</script>

<svelte:head>
	<title>Admin — Audit Logs</title>
</svelte:head>

<div class="page-header">
	<h1 class="page-title">Audit Logs</h1>
</div>

<!-- Read-only filters submitted as a GET form: the filter state lives in the URL query, so
     results are shareable and the back button works — no form action needed for a read. -->
<form method="GET" class="filter-bar">
	<label class="filter-field">
		<span class="filter-label">Action</span>
		<select name="action" class="filter-input">
			<option value="" selected={data.actionFilter === null}>All actions</option>
			{#each data.actions as action (action)}
				<option value={action} selected={data.actionFilter === action}>{action}</option>
			{/each}
		</select>
	</label>
	<label class="filter-field">
		<span class="filter-label">Entity</span>
		<!-- Exact match on the backend (e.g. "Post") — not a substring search. -->
		<input
			type="text"
			name="entity"
			class="filter-input"
			placeholder="e.g. Post"
			value={data.entityFilter ?? ''}
		/>
	</label>
	<button type="submit" class="btn-primary">Apply</button>
	{#if hasActiveFilter}
		<a href={resolve('/admin/audit-logs')} class="clear-link">Clear</a>
	{/if}
</form>

{#if data.loadError}
	<p class="error" role="alert">{data.loadError}</p>
{:else if data.logs.length === 0}
	<p class="empty-state">No audit log entries found.</p>
{:else}
	<div class="table-wrapper">
		<table class="logs-table">
			<thead>
				<tr>
					{#each COLUMNS as column (column.key)}
						<th
							aria-sort={data.sortBy === column.key
								? data.order === 'asc'
									? 'ascending'
									: 'descending'
								: undefined}
						>
							<a href="{resolve('/admin/audit-logs')}?{sortQuery(column.key)}" class="sort-link">
								{column.label}
								{#if data.sortBy === column.key}
									<span class="sort-arrow" aria-hidden="true">
										{data.order === 'asc' ? '▲' : '▼'}
									</span>
								{/if}
							</a>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each data.logs as log (log.id)}
					<tr>
						<td>{log.id}</td>
						<td><span class="action-badge">{log.action}</span></td>
						<td>{log.entity}</td>
						<td>{log.entityId}</td>
						<td>
							{#if log.user}
								{#if log.user.deleted}
									<!-- The referenced user was hard-deleted since this entry was written —
									     linking would 404, so render an unlinked marker instead. -->
									<span class="deleted-user">{userLabel(log.user)} (deleted)</span>
								{:else}
									<a
										href={resolve('/admin/users/[id]', { id: String(log.user.id) })}
										class="user-link"
									>
										{userLabel(log.user)}
									</a>
								{/if}
							{:else}
								—
							{/if}
						</td>
						<!-- en-GB pins d/m/y ordering + 24h time regardless of the viewer's OS locale. -->
						<td class="date-cell">{new Date(log.createdAt).toLocaleString('en-GB')}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination — drives via ?page= while preserving active filters and sort. -->
	{#if data.meta.totalPages > 1}
		<nav class="pagination" aria-label="Audit log pages">
			{#each Array.from({ length: data.meta.totalPages }, (_, i) => i + 1) as p (p)}
				<a
					href="{resolve('/admin/audit-logs')}?{buildQuery(p, data.sortBy, data.order)}"
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

	.filter-bar {
		display: flex;
		align-items: flex-end;
		gap: var(--space-3);
		margin-bottom: var(--space-6);
		flex-wrap: wrap;
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.filter-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.filter-input {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.filter-input:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 1px;
	}

	.btn-primary {
		padding: var(--space-2) var(--space-4);
		border: none;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.btn-primary:hover {
		background: var(--color-primary-hover);
	}

	.clear-link {
		padding: var(--space-2) 0;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--text-sm);
	}

	.clear-link:hover {
		text-decoration: underline;
	}

	.table-wrapper {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.logs-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}

	.logs-table th {
		padding: var(--space-3) var(--space-4);
		text-align: left;
		font-weight: 500;
		color: var(--color-text-muted);
		background: var(--color-surface-alt);
		border-bottom: 1px solid var(--color-border);
	}

	/* Headers are sort links — keep the muted header look, signal interactivity on hover. */
	.sort-link {
		color: inherit;
		text-decoration: none;
		white-space: nowrap;
	}

	.sort-link:hover {
		color: var(--color-text);
		text-decoration: underline;
	}

	.sort-arrow {
		font-size: 0.6rem;
		vertical-align: middle;
	}

	.logs-table td {
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
		vertical-align: middle;
	}

	.logs-table tr:last-child td {
		border-bottom: none;
	}

	.logs-table tr:hover td {
		background: var(--color-surface-alt);
	}

	.action-badge {
		display: inline-block;
		padding: 2px var(--space-2);
		border-radius: var(--radius-full);
		background: var(--color-surface-alt);
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}

	.user-link {
		color: var(--color-primary);
		text-decoration: none;
	}

	.user-link:hover {
		text-decoration: underline;
	}

	.deleted-user {
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* keep timestamps on one line so the table doesn't reflow per-row */
	.date-cell {
		white-space: nowrap;
	}

	.empty-state {
		padding: var(--space-8);
		text-align: center;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.error {
		margin: 0;
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-danger);
		border-left-width: 4px;
		border-radius: var(--radius-sm);
		color: var(--color-danger);
		font-size: var(--text-sm);
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
