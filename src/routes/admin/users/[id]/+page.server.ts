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
	},

	// Separate from `update` — PATCH /users/{id}/verify-email is its own endpoint/DTO (and clears
	// any outstanding verification token when set true), so it gets its own fixed-payload action
	// rather than being folded into the profile-fields form.
	verifyEmail: async ({ params, fetch, locals }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) {
			error(404, 'User not found');
		}

		// There's no backend guard against an admin changing their own verified status — enforce it
		// here (the template already omits the toggle for this row) so a direct action call can't
		// let an admin accidentally lock themselves out of signing in (unverified email fails
		// /auth/sign-in) with no other admin around to fix it.
		if (id === locals.user!.id) {
			error(403, 'You cannot change your own verification status.');
		}

		const client = serverApi(fetch, locals.accessToken);
		const { error: patchError, response } = await client.PATCH('/users/{id}/verify-email', {
			params: { path: { id } },
			body: { isEmailVerified: true }
		});

		if (patchError || !response.ok) {
			const message = extractMessage(patchError) ?? 'Failed to update verification status.';
			return fail(response.status || 400, { message });
		}

		redirect(303, `/admin/users/${id}`);
	},

	unverifyEmail: async ({ params, fetch, locals }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) {
			error(404, 'User not found');
		}

		// Same self-protection as verifyEmail above.
		if (id === locals.user!.id) {
			error(403, 'You cannot change your own verification status.');
		}

		const client = serverApi(fetch, locals.accessToken);
		const { error: patchError, response } = await client.PATCH('/users/{id}/verify-email', {
			params: { path: { id } },
			body: { isEmailVerified: false }
		});

		if (patchError || !response.ok) {
			const message = extractMessage(patchError) ?? 'Failed to update verification status.';
			return fail(response.status || 400, { message });
		}

		redirect(303, `/admin/users/${id}`);
	}
};
