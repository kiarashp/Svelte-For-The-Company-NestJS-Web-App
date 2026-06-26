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
	google: async ({ request, fetch, cookies }) => {
		const data = await request.formData();
		// 'token' matches GoogleTokenDto.token — the Google ID token from the GIS callback.
		const token = String(data.get('token') ?? '').trim();

		if (!token) {
			return fail(400, { googleError: 'No Google credential received.' });
		}

		console.log('[google action] token sent to backend:', token);

		let res: Response;
		try {
			// Raw fetch — GoogleAuthenticationController response is typed as content?: never
			// (same generator limitation as sign-in). Parse tokens from the body manually.
			res = await fetch(`${PUBLIC_API_URL}/google-authentication`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});
		} catch {
			return fail(503, { googleError: 'Could not reach the server. Please try again.' });
		}

		if (!res.ok) {
			// Parse the body to give a specific message when the email is already a local account.
			let errorMessage = 'Google sign-in failed. Please try again.';
			try {
				const errBody = await res.json();
				const msg: string = errBody?.message ?? '';
				// 409 = email already registered as a local account (backend's ConflictException).
			if (res.status === 409 || msg.toLowerCase().includes('already registered')) {
					errorMessage =
						'This email is already registered with a password. Please sign in with your email and password instead.';
				}
			} catch {
				// Ignore parse failures — fall through to the generic message.
			}
			return fail(res.status >= 500 ? 503 : 400, { googleError: errorMessage });
		}

		// Same DataResponseInterceptor envelope as /auth/sign-in: { data: { accessToken, refreshToken } }
		let tokens: { accessToken: string; refreshToken: string };
		try {
			const body = await res.json();
			tokens = body.data;
		} catch {
			return fail(502, { googleError: 'Unexpected response from server.' });
		}

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
	},

	// SvelteKit rule: when any named action exists, the 'default' action is forbidden.
	// All actions in this file must have explicit names.
	login: async ({ request, fetch, cookies }) => {
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

		// Backend wraps every success response in { apiVersion, data } via DataResponseInterceptor.
		let tokens: { accessToken: string; refreshToken: string };
		try {
			const body = await res.json();
			tokens = body.data;
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
