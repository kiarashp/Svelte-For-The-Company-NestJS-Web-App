import { error, fail, redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/api/client';
import type { Actions, PageServerLoad } from './$types';
import type { components } from '$lib/types/openapi-types';

const STATUSES = ['draft', 'review', 'published'] as const;
type Status = (typeof STATUSES)[number];

// Nest validation errors shape { message: string | string[] } even on response codes this
// endpoint's typed schema doesn't declare (400/409) — openapi-fetch still parses the body into
// `error` whenever response.ok is false, so we can read it despite the loose `unknown` type.
function extractMessage(err: unknown): string | undefined {
	if (err && typeof err === 'object' && 'message' in err) {
		const message = (err as { message?: unknown }).message;
		if (typeof message === 'string') return message;
		if (Array.isArray(message)) return message.join(' ');
	}
	return undefined;
}

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) {
		error(404, 'Post not found');
	}

	const client = serverApi(fetch, locals.accessToken);

	const [postResult, tagsResult] = await Promise.all([
		// Staff-only, any-status fetch (unlike GET /posts/{id}, which is scoped to published
		// posts) — enforces the same ownership rule as PATCH /posts/{id} server-side (editor
		// limited to own posts; author/admin unrestricted), so its 401/403/404 is authoritative
		// and no separate ownership check is needed here.
		client.GET('/posts/{id}/admin', { params: { path: { id } } }),
		client.GET('/tags')
	]);

	const { data, error: postError, response } = postResult;
	if (postError || !response.ok || !data?.data) {
		const message = extractMessage(postError);
		error(response.status || 404, message ?? 'Post not found');
	}

	return {
		post: data.data,
		tags: tagsResult.data?.data ?? []
	};
};

export const actions: Actions = {
	update: async ({ params, request, fetch, locals }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) {
			error(404, 'Post not found');
		}

		const client = serverApi(fetch, locals.accessToken);
		const data = await request.formData();

		const title = String(data.get('title') ?? '').trim();
		if (!title) {
			return fail(400, { message: 'Title is required.' });
		}

		const slug = String(data.get('slug') ?? '').trim();
		const content = String(data.get('content') ?? '').trim();

		const rawStatus = String(data.get('status') ?? 'draft');
		const status: Status = STATUSES.includes(rawStatus as Status) ? (rawStatus as Status) : 'draft';

		// Real tag IDs are numbers (Tag.id: number) — PatchPostDto.tags is typed string[], the
		// same generator mistyping artifact as CreatePostDto. Cast at the call.
		const tagIds = data
			.getAll('tags')
			.map((v) => Number(v))
			.filter((n) => !Number.isNaN(n));

		// Unlike create's POST (an omitted field lets the backend apply a default), this is a
		// PATCH — an omitted field means "leave unchanged." The form always fully renders
		// content/tags, so they're sent unconditionally or a cleared textarea / unchecked tag
		// list would silently fail to save. `slug` stays conditional: omitting it on PATCH keeps
		// the existing slug, matching create's "let the server decide" behavior for a blank slug.
		const payload = {
			title,
			...(slug ? { slug } : {}),
			status,
			content,
			tags: tagIds
		};

		const { error: patchError, response } = await client.PATCH('/posts/{id}', {
			params: { path: { id } },
			body: payload as unknown as components['schemas']['PatchPostDto']
		});

		if (patchError || !response.ok) {
			const message = extractMessage(patchError) ?? 'Failed to update post.';
			return fail(response.status || 400, { message });
		}

		redirect(303, '/admin/posts');
	}
};
