import { fail } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		// No token — user arrived directly (e.g. after registration). Show the resend form.
		return { verifyStatus: 'no-token' as const };
	}

	let res: Response;
	try {
		// Raw fetch — GET /auth/verify-email response is typed as content?: never (generator bug).
		res = await fetch(`${PUBLIC_API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
	} catch {
		return { verifyStatus: 'network-error' as const };
	}

	if (res.ok) {
		return { verifyStatus: 'verified' as const };
	}

	// Token is expired or already used — let the user request a new one.
	return { verifyStatus: 'failed' as const };
};

export const actions: Actions = {
	resend: async ({ request, fetch }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();

		if (!email) {
			return fail(400, { message: 'Email address is required.' });
		}

		let res: Response;
		try {
			// Raw fetch — POST /auth/resend-verification response is content?: never.
			res = await fetch(`${PUBLIC_API_URL}/auth/resend-verification`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
		} catch {
			return fail(503, { message: 'Could not reach the server. Please try again.' });
		}

		if (!res.ok) {
			// Generic message regardless of whether the email exists — avoids account enumeration.
			return fail(res.status >= 500 ? 503 : 400, {
				message: 'Could not send verification email. Please try again.'
			});
		}

		return { sent: true };
	}
};
