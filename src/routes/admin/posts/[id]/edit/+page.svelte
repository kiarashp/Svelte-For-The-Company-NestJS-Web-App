<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}
	let { data, form }: Props = $props();

	let submitting = $state(false);

	let postTagIds = $derived(new Set((data.post.tags ?? []).map((tag) => tag.id)));
</script>

<svelte:head>
	<title>Admin — Edit Post</title>
</svelte:head>

<div class="page-header">
	<h1 class="page-title">Edit post</h1>
	<a href={resolve('/admin/posts')} class="btn-secondary">Cancel</a>
</div>

<form
	method="POST"
	action="?/update"
	class="post-form"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update();
		};
	}}
>
	{#if form?.message}
		<p class="error" role="alert">{form.message}</p>
	{/if}

	<label class="field">
		<span class="label-text">Title</span>
		<input type="text" name="title" required disabled={submitting} value={data.post.title} />
	</label>

	<label class="field">
		<span class="label-text">Slug</span>
		<input
			type="text"
			name="slug"
			placeholder="auto-generated from title if left blank"
			disabled={submitting}
			value={data.post.slug}
		/>
	</label>

	<label class="field">
		<span class="label-text">Status</span>
		<select name="status" disabled={submitting}>
			<option value="draft" selected={data.post.status === 'draft'}>Draft</option>
			<option value="review" selected={data.post.status === 'review'}>In Review</option>
			<option value="published" selected={data.post.status === 'published'}>Published</option>
		</select>
	</label>

	<label class="field">
		<span class="label-text">Content</span>
		<textarea name="content" rows="12" disabled={submitting}>{data.post.content ?? ''}</textarea>
		<span class="help-text">Markdown supported.</span>
	</label>

	<fieldset class="field tags-field" disabled={submitting}>
		<legend class="label-text">Tags</legend>
		{#if data.tags.length === 0}
			<p class="help-text">
				No tags yet. <a href={resolve('/admin/tags')}>Manage tags</a>
			</p>
		{:else}
			<div class="tags-list">
				{#each data.tags as tag (tag.id)}
					<label class="tag-checkbox">
						<input type="checkbox" name="tags" value={tag.id} checked={postTagIds.has(tag.id)} />
						{tag.name}
					</label>
				{/each}
			</div>
		{/if}
	</fieldset>

	<button type="submit" class="btn-primary" disabled={submitting}>
		{submitting ? 'Saving…' : 'Save changes'}
	</button>
</form>

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
		border: none;
		background: var(--color-primary);
		color: var(--color-on-primary);
		font: inherit;
		font-size: var(--text-sm);
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		display: inline-block;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-sm);
		text-decoration: none;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.btn-secondary:hover {
		background: var(--color-surface-alt);
	}

	.post-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		max-width: 640px;
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

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		border: none;
		padding: 0;
		margin: 0;
	}

	.label-text {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	input[type='text'],
	select,
	textarea {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-size: var(--text-sm);
	}

	textarea {
		resize: vertical;
		font-family: inherit;
	}

	input:focus-visible,
	select:focus-visible,
	textarea:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	input:disabled,
	select:disabled,
	textarea:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.help-text {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.tag-checkbox {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text);
	}
</style>
