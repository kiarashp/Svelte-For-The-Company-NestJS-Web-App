import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

// Cookie names and TTLs must match hooks.server.ts exactly — a mismatch would silently break auth.
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect authenticated users away — login page is only for guests.
	if (locals.user) redirect(302, '/');
};

export const actions: Actions = {
	default: async ({ request, fetch, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required.' });
		}

		let res: Response;
		try {
			// Raw fetch required — POST /auth/sign-in response is typed as content?: never
			// (generator bug). Same pattern as hooks.server.ts for all auth endpoints.
			res = await fetch(`${PUBLIC_API_URL}/auth/sign-in`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
		} catch {
			return fail(503, { message: 'Could not reach the server. Please try again.' });
		}

		if (res.status === 401) {
			// Parse the body to distinguish "unverified email" from "bad credentials" —
			// both are 401 but the backend puts a different message on each.
			let body: { message?: string } = {};
			try {
				body = await res.json();
			} catch {
				// Ignore parse failures — fall through to the generic message.
			}

			if (typeof body.message === 'string' && body.message.toLowerCase().includes('verify')) {
				return fail(401, { message: 'Please verify your email address before signing in.' });
			}

			return fail(400, { message: 'Invalid email or password.' });
		}

		if (!res.ok) {
			return fail(res.status >= 500 ? 503 : 400, { message: 'Sign-in failed. Please try again.' });
		}

		let tokens: { accessToken: string; refreshToken: string };
		try {
			tokens = await res.json();
		} catch {
			return fail(502, { message: 'Unexpected response from server.' });
		}

		// Store both tokens as HttpOnly cookies — hooks.server.ts reads these on every
		// subsequent request to resolve the authenticated user without client-side JS.
		cookies.set(ACCESS_COOKIE, tokens.accessToken, {
			httpOnly: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 3600 // 1 hour — matches backend JWT TTL
		});
		cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
			httpOnly: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 86400 // 24 hours — matches backend refresh TTL
		});

		redirect(302, '/');
	}
};
