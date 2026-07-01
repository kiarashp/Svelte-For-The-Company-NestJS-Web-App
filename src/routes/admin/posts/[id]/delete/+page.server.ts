import { error, fail, redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/api/client';
import type { Actions, PageServerLoad } from './$types';

// Nest validation errors shape { message: string | string[] } even on response codes this
// endpoint's typed schema doesn't declare — openapi-fetch still parses the body into `error`
// whenever response.ok is false, so we can read it despite the loose `unknown` type.
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

	// Staff-only, any-status fetch (same one used by the edit page) — enforces the same
	// ownership rule as DELETE /posts/{id} server-side (editor limited to own posts;
	// author/admin unrestricted), so its 401/403/404 is authoritative here too.
	const {
		data,
		error: postError,
		response
	} = await client.GET('/posts/{id}/admin', {
		params: { path: { id } }
	});

	if (postError || !response.ok || !data?.data) {
		const message = extractMessage(postError);
		error(response.status || 404, message ?? 'Post not found');
	}

	// Only what the confirmation view needs to show — no need for content/tags here.
	const { id: postId, title, slug, status } = data.data;
	return { post: { id: postId, title, slug, status } };
};

export const actions: Actions = {
	delete: async ({ params, fetch, locals }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) {
			error(404, 'Post not found');
		}

		const client = serverApi(fetch, locals.accessToken);
		const { error: deleteError, response } = await client.DELETE('/posts/{id}', {
			params: { path: { id } }
		});

		if (deleteError || !response.ok) {
			const message = extractMessage(deleteError) ?? 'Failed to delete post.';
			return fail(response.status || 400, { message });
		}

		redirect(303, '/admin/posts');
	}
};
