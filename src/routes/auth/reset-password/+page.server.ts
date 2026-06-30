import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	// No token in URL — send user to forgot-password so they can request a new link.
	if (!token) {
		throw redirect(302, '/auth/forgot-password');
	}

	return { token };
};

export const actions: Actions = {
	resetPassword: async ({ request, fetch }) => {
		const data = await request.formData();
		// Token is passed via a hidden field rendered from data.token in the load.
		const token = String(data.get('token') ?? '').trim();
		const newPassword = String(data.get('newPassword') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (!newPassword) {
			// expired: false keeps the union type consistent so the svelte side can always read expired.
			return fail(400, { expired: false, message: 'New password is required.' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { expired: false, message: 'Passwords do not match.' });
		}

		let res: Response;
		try {
			// Raw fetch — POST /auth/reset-password response is content?: never (generator bug).
			res = await fetch(`${PUBLIC_API_URL}/auth/reset-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, newPassword })
			});
		} catch {
			return fail(503, {
				expired: false,
				message: 'Could not reach the server. Please try again.'
			});
		}

		if (!res.ok) {
			// Token is expired or already used — guide user to request a fresh link.
			return fail(400, {
				expired: true,
				message: 'This reset link has expired or has already been used. Request a new one.'
			});
		}

		throw redirect(302, '/login');
	}
};
