import { error, fail, redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/api/client';
import type { Actions, PageServerLoad } from './$types';

const ROLES = new Set(['user', 'editor', 'author', 'admin']);
type Role = 'user' | 'editor' | 'author' | 'admin';

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
		error(404, 'User not found');
	}

	// There's no backend guard against an admin changing their own role — enforce it here so
	// direct navigation to this URL can't let an admin lock themselves out of admin access.
	if (id === locals.user!.id) {
		error(403, 'You cannot change your own role.');
	}

	const client = serverApi(fetch, locals.accessToken);
	const {
		data,
		error: getError,
		response
	} = await client.GET('/users/{id}', {
		params: { path: { id } }
	});

	if (getError || !response.ok || !data?.data) {
		const message = extractMessage(getError);
		error(response.status || 404, message ?? 'User not found');
	}

	// Only what the confirmation view needs to show.
	const { id: userId, firstName, lastName, email, role } = data.data;
	return { targetUser: { id: userId, firstName, lastName, email, role } };
};

export const actions: Actions = {
	changeRole: async ({ params, request, fetch, locals }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) {
			error(404, 'User not found');
		}

		// Repeated here (not just in `load`) as defense in depth against a stale confirm page.
		if (id === locals.user!.id) {
			error(403, 'You cannot change your own role.');
		}

		const data = await request.formData();
		const role = String(data.get('role') ?? '');
		if (!ROLES.has(role)) {
			return fail(400, { message: 'Choose a valid role.' });
		}

		const client = serverApi(fetch, locals.accessToken);
		const { error: patchError, response } = await client.PATCH('/users/{id}/role', {
			params: { path: { id } },
			body: { role: role as Role }
		});

		if (patchError || !response.ok) {
			const message = extractMessage(patchError) ?? 'Failed to change role.';
			return fail(response.status || 400, { message });
		}

		redirect(303, `/admin/users/${id}`);
	}
};
