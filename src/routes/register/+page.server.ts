import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect authenticated users away — registration is only for guests.
	if (locals.user) redirect(302, '/');
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();
		const firstName = String(data.get('firstName') ?? '').trim();
		const lastName = String(data.get('lastName') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (!firstName || !email || !password || !confirmPassword) {
			return fail(400, { message: 'First name, email, and password are required.' });
		}

		// Catch mismatches before hitting the API to give a clearer message.
		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match.' });
		}

		let res: Response;
		try {
			// Raw fetch required — POST /users response is typed as content?: never
			// (generator bug). Same pattern as login and hooks.server.ts.
			res = await fetch(`${PUBLIC_API_URL}/users`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				// Send lastName only when the user actually filled it in.
				body: JSON.stringify({
					firstName,
					...(lastName ? { lastName } : {}),
					email,
					password
				})
			});
		} catch {
			return fail(503, { message: 'Could not reach the server. Please try again.' });
		}

		if (res.status === 409) {
			// 409 means the email is already registered.
			return fail(409, { message: 'An account with that email already exists.' });
		}

		if (res.status === 400) {
			// 400 from the backend almost always means password complexity failure.
			return fail(400, {
				message:
					'Check the form — password must have 8+ characters, upper, lower, number, and symbol.'
			});
		}

		if (!res.ok) {
			return fail(503, { message: 'Registration failed. Please try again.' });
		}

		// Registration succeeded — backend fires the verification email automatically.
		// Redirect to login so the user can sign in after verifying.
		redirect(302, '/login');
	}
};
