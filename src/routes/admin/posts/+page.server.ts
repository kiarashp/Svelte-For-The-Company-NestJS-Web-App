import { serverApi } from '$lib/api/client';
import type { PageServerLoad } from './$types';
import type { components } from '$lib/types/openapi-types';

type Post = components['schemas']['Post'];

// Nest validation errors shape { message: string | string[] } — surface the real reason
// instead of just the status code so a 400 (bad query params) is diagnosable from the UI.
function extractMessage(err: unknown): string | undefined {
	if (err && typeof err === 'object' && 'message' in err) {
		const message = (err as { message?: unknown }).message;
		if (typeof message === 'string') return message;
		if (Array.isArray(message)) return message.join(' ');
	}
	return undefined;
}

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	const client = serverApi(fetch, locals.accessToken);
	// locals.user is non-null — the admin layout guard rejected guests before this runs.
	const user = locals.user!;

	const q = url.searchParams.get('q') ?? undefined;
	// `status` exists on GET /posts/admin but is not yet in the typed schema — cast until
	// the backend regenerates the OpenAPI spec and the frontend copies the updated types.
	const status = url.searchParams.get('status') ?? undefined;
	const page = Number(url.searchParams.get('page') ?? 1);
	const limit = 20;

	// Declare without initializing so the linter doesn't flag the dummy initial value
	// as useless (it would be overwritten immediately in every branch below).
	let posts: Post[];
	const meta = { currentPage: page, totalPages: 1, totalItems: 0 };
	// Surfaced to the template instead of silently rendering "No posts found" when the
	// request itself failed (401/403/500) — an empty `data` looks identical to a genuinely
	// empty list otherwise, hiding real auth/server errors from the admin.
	let loadError: string | null = null;

	if (user.role === 'admin' || user.role === 'author') {
		// Admin and author can see ALL posts via the dedicated staff endpoint.
		const { data, error, response } = await client.GET('/posts/admin', {
			params: {
				query: {
					q,
					page,
					limit,
					// Spread status only when it's set — avoids sending ?status=undefined.
					...(status ? { status } : {})
				} as never
			}
		});
		if (error || !response.ok) {
			const message = extractMessage(error);
			loadError = message
				? `Could not load posts (${response.status}): ${message}`
				: `Could not load posts (${response.status}).`;
		}
		posts = data?.data?.data ?? [];
		if (data?.data?.meta) Object.assign(meta, data.data.meta);
	} else {
		// Editor sees only their own posts via the authenticated-user endpoint.
		const { data, error, response } = await client.GET('/posts/my', {
			params: { query: { q, page, limit } }
		});
		if (error || !response.ok) {
			const message = extractMessage(error);
			loadError = message
				? `Could not load posts (${response.status}): ${message}`
				: `Could not load posts (${response.status}).`;
		}
		posts = data?.data?.data ?? [];
		if (data?.data?.meta) Object.assign(meta, data.data.meta);
	}

	// Compute permission booleans server-side — components must not recompute these.
	// API rule (from PATCH/DELETE 403 descriptions): admin + author can act on any post;
	// editor is limited to own posts only.
	const canActOnAny = user.role === 'admin' || user.role === 'author';
	const postsWithAccess = posts.map((post) => ({
		...post,
		canEdit: canActOnAny || post.author.id === user.id,
		canDelete: canActOnAny || post.author.id === user.id
	}));

	return {
		posts: postsWithAccess,
		meta,
		loadError,
		// Pass filter values back so the UI can pre-fill the filter form.
		filters: { q: q ?? '', status: status ?? '', page }
	};
};
