import { fail } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import type { Actions } from './$types';

export const actions: Actions = {
	forgotPassword: async ({ request, fetch }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();

		if (!email) {
			return fail(400, { message: 'Email address is required.' });
		}

		try {
			// Raw fetch — POST /auth/forgot-password response is content?: never (generator bug).
			await fetch(`${PUBLIC_API_URL}/auth/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
		} catch {
			return fail(503, { message: 'Could not reach the server. Please try again.' });
		}

		// Always return sent: true regardless of whether the email exists — avoids account enumeration.
		return { sent: true };
	}
};
