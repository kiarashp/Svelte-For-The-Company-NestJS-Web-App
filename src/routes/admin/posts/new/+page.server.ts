import { fail, redirect } from '@sveltejs/kit';
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

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const client = serverApi(fetch, locals.accessToken);
	// GET /tags is a bare array at .data (same envelope shape as /product-types) — no vocabulary
	// yet is a valid state, the form just shows an empty-state note instead of checkboxes.
	const { data } = await client.GET('/tags');
	return { tags: data?.data ?? [] };
};

export const actions: Actions = {
	create: async ({ request, fetch, locals }) => {
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

		// Real tag IDs are numbers (Tag.id: number) — CreatePostDto.tags is typed string[], a
		// generator mistyping artifact (same pattern as the product write DTOs). Cast at the call.
		const tagIds = data
			.getAll('tags')
			.map((v) => Number(v))
			.filter((n) => !Number.isNaN(n));

		const payload = {
			title,
			...(slug ? { slug } : {}),
			status,
			...(content ? { content } : {}),
			...(tagIds.length ? { tags: tagIds } : {})
		};

		const { error, response } = await client.POST('/posts', {
			body: payload as unknown as components['schemas']['CreatePostDto']
		});

		if (error || !response.ok) {
			const message = extractMessage(error) ?? 'Failed to create post.';
			return fail(response.status || 400, { message });
		}

		// Post edit isn't built yet, so the list is the only sensible landing page.
		redirect(303, '/admin/posts');
	}
};
