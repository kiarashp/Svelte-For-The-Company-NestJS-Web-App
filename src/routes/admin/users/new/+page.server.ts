import { fail, redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/api/client';
import type { Actions } from './$types';
import type { components } from '$lib/types/openapi-types';

const ROLES = ['user', 'editor', 'author', 'admin'] as const;
type Role = (typeof ROLES)[number];

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

export const actions: Actions = {
	create: async ({ request, fetch, locals }) => {
		const client = serverApi(fetch, locals.accessToken);
		const data = await request.formData();

		const firstName = String(data.get('firstName') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (!firstName || !email || !password || !confirmPassword) {
			return fail(400, { message: 'First name, email, and password are required.' });
		}

		// Catch mismatches before hitting the API to give a clearer message (same as /register).
		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match.' });
		}

		const lastName = String(data.get('lastName') ?? '').trim();
		const rawRole = String(data.get('role') ?? 'user');
		const role: Role = ROLES.includes(rawRole as Role) ? (rawRole as Role) : 'user';
		// Checkbox is absent from FormData entirely when unchecked, so `.has()` doubles as the
		// unchecked check without needing to inspect the (always-"on") value.
		const isEmailVerified = data.has('isEmailVerified');

		const payload: components['schemas']['AdminCreateUserDto'] = {
			firstName,
			email,
			password,
			role,
			isEmailVerified,
			...(lastName ? { lastName } : {})
		};

		const { error, response } = await client.POST('/users/admin', { body: payload });

		if (error || !response.ok) {
			const message = extractMessage(error) ?? 'Failed to create user.';
			return fail(response.status || 400, { message });
		}

		redirect(303, '/admin/users');
	}
};
