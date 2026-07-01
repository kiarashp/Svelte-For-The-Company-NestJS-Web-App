import { serverApi } from '$lib/api/client';
import type { PageServerLoad } from './$types';

// Nest validation errors shape { message: string | string[] } — surface the real reason
// instead of just the status code so a failed fetch is diagnosable from the UI.
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
	// locals.user is non-null and role === 'admin' — the users layout guard already enforced this.
	const currentUserId = locals.user!.id;

	// GET /users has no search/filter query param — only page/limit are supported.
	const page = Number(url.searchParams.get('page') ?? 1);
	const limit = 20;

	const { data, error, response } = await client.GET('/users', {
		params: { query: { page, limit } }
	});

	// Check error/response.ok before reading data — a failed fetch must not look like an
	// empty list (this codebase shipped that exact bug once, on the admin post list).
	let loadError: string | null = null;
	if (error || !response.ok) {
		const message = extractMessage(error);
		loadError = message
			? `Could not load users (${response.status}): ${message}`
			: `Could not load users (${response.status}).`;
	}

	const users = data?.data?.data ?? [];
	// Declared with concrete (non-optional) number fields and merged via Object.assign so the
	// template can compare meta.totalPages > 1 without fighting the schema's optional properties.
	const meta = { currentPage: page, totalPages: 1, totalItems: 0 };
	if (data?.data?.meta) Object.assign(meta, data.data.meta);

	// Flag the signed-in admin's own row so the template can omit the delete action for it —
	// there's no backend guard against self-delete, so the UI must not offer the control.
	const usersWithSelfFlag = users.map((user) => ({
		...user,
		isSelf: user.id === currentUserId
	}));

	return {
		users: usersWithSelfFlag,
		meta,
		loadError,
		page
	};
};
