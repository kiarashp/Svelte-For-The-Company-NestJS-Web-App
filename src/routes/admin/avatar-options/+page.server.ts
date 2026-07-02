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

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const client = serverApi(fetch, locals.accessToken);

	// GET /users/avatar-options returns a bare AvatarOption[] at .data — not paginated
	// (same shape as /product-types), so there's no page/limit here.
	const { data, error, response } = await client.GET('/users/avatar-options');

	// Check error/response.ok before reading data — a failed fetch must not look like an
	// empty list (this codebase shipped that exact bug once, on the admin post list).
	let loadError: string | null = null;
	if (error || !response.ok) {
		const message = extractMessage(error);
		loadError = message
			? `Could not load avatar options (${response.status}): ${message}`
			: `Could not load avatar options (${response.status}).`;
	}

	return {
		avatarOptions: data?.data ?? [],
		loadError
	};
};
