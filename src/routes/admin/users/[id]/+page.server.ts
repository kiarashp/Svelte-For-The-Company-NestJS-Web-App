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
		error(404, 'User not found');
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

	return {
		targetUser: data.data,
		// Drives hiding the delete link in the template — an admin cannot delete their own
		// account from this screen (there's no backend guard against it, so the UI must).
		isSelf: data.data.id === locals.user!.id
	};
};

export const actions: Actions = {
	update: async ({ params, request, fetch, locals }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) {
			error(404, 'User not found');
		}

		const client = serverApi(fetch, locals.accessToken);
		const data = await request.formData();

		const firstName = String(data.get('firstName') ?? '').trim();
		if (!firstName) {
			return fail(400, { message: 'First name is required.' });
		}

		const email = String(data.get('email') ?? '').trim();
		if (!email) {
			return fail(400, { message: 'Email is required.' });
		}

		const lastName = String(data.get('lastName') ?? '').trim();
		const password = String(data.get('password') ?? '');

		// Omit password from the payload entirely when left blank — sending an empty string
		// would attempt to reset the user's password rather than leave it unchanged.
		const payload = {
			firstName,
			email,
			...(lastName ? { lastName } : {}),
			...(password ? { password } : {})
		};

		const { error: patchError, response } = await client.PATCH('/users/{id}', {
			params: { path: { id } },
			body: payload
		});

		if (patchError || !response.ok) {
			const message = extractMessage(patchError) ?? 'Failed to update user.';
			return fail(response.status || 400, { message });
		}

		redirect(303, '/admin/users');
	}
};
