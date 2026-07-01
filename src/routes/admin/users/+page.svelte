<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Admin — Users</title>
</svelte:head>

<div class="page-header">
	<h1 class="page-title">Users</h1>
	<a href={resolve('/admin/users/new')} class="btn-primary">New user</a>
</div>

{#if data.loadError}
	<p class="error" role="alert">{data.loadError}</p>
{:else if data.users.length === 0}
	<p class="empty-state">No users found.</p>
{:else}
	<div class="table-wrapper">
		<table class="users-table">
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>Role</th>
					<th>Verified</th>
					<th class="actions-col">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user (user.id)}
					<tr>
						<td class="name-cell">
							{user.firstName}{user.lastName ? ` ${user.lastName}` : ''}
							{#if user.isSelf}<span class="you-tag">(you)</span>{/if}
						</td>
						<td>{user.email}</td>
						<td><span class="role-badge">{user.role}</span></td>
						<td>{user.isEmailVerified ? 'Yes' : 'No'}</td>
						<td class="actions-cell">
							<div class="actions-inner">
								<a href={resolve('/admin/users/[id]', { id: String(user.id) })} class="action-link">
									Edit
								</a>
								{#if !user.isSelf}
									<!-- Delete handled by a dedicated route with confirmation — not inline. -->
									<a
										href={resolve('/admin/users/[id]/delete', { id: String(user.id) })}
										class="action-link action-danger"
									>
										Delete
									</a>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination — drives via ?page= search param. -->
	{#if data.meta.totalPages > 1}
		<nav class="pagination" aria-label="User list pages">
			{#each Array.from({ length: data.meta.totalPages }, (_, i) => i + 1) as p (p)}
				<a
					href="{resolve('/admin/users')}?page={p}"
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

	.table-wrapper {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.users-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}

	.users-table th {
		padding: var(--space-3) var(--space-4);
		text-align: left;
		font-weight: 500;
		color: var(--color-text-muted);
		background: var(--color-surface-alt);
		border-bottom: 1px solid var(--color-border);
	}

	.users-table td {
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
		vertical-align: middle;
	}

	.users-table tr:last-child td {
		border-bottom: none;
	}

	.users-table tr:hover td {
		background: var(--color-surface-alt);
	}

	.name-cell {
		font-weight: 500;
	}

	.you-tag {
		font-weight: 400;
		color: var(--color-text-muted);
		margin-left: var(--space-2);
	}

	.role-badge {
		display: inline-block;
		padding: 2px var(--space-2);
		border-radius: var(--radius-full);
		background: var(--color-surface-alt);
		color: var(--color-text-muted);
		font-size: 0.75rem;
		text-transform: capitalize;
	}

	.actions-col {
		width: 120px;
	}

	/* keep <td> as table-cell — a flex display here breaks table row layout in browsers */
	.actions-inner {
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
