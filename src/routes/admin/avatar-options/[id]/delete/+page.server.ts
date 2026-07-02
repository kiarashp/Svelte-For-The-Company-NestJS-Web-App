import { error, fail, redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/api/client';
import type { Actions, PageServerLoad } from './$types';

// Nest validation errors shape { message: string | string[] } — surface the real reason
// instead of just the status code so a failed request is diagnosable from the UI.
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
		error(404, 'Avatar option not found');
	}

	// There's no GET /users/avatar-options/{id} — only the list endpoint — so resolve the
	// target from the full list for the confirmation view.
	const client = serverApi(fetch, locals.accessToken);
	const { data, error: getError, response } = await client.GET('/users/avatar-options');

	if (getError || !response.ok) {
		const message = extractMessage(getError);
		error(response.status || 404, message ?? 'Avatar option not found');
	}

	const target = data?.data?.find((option) => option.id === id);
	if (!target) {
		error(404, 'Avatar option not found');
	}

	return { targetAvatarOption: target };
};

export const actions: Actions = {
	delete: async ({ params, fetch, locals }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) {
			error(404, 'Avatar option not found');
		}

		const client = serverApi(fetch, locals.accessToken);
		const { error: deleteError, response } = await client.DELETE('/users/avatar-options/{id}', {
			params: { path: { id } }
		});

		if (deleteError || !response.ok) {
			const message = extractMessage(deleteError) ?? 'Failed to delete avatar option.';
			return fail(response.status || 400, { message });
		}

		redirect(303, '/admin/avatar-options');
	}
};
