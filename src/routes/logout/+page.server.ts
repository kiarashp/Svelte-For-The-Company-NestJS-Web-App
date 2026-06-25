import { redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/api/client';
import type { Actions, PageServerLoad } from './$types';

// Cookie names must match hooks.server.ts and the login route exactly.
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

export const load: PageServerLoad = async ({ locals }) => {
	// Already signed out — nothing to do here.
	if (!locals.user) redirect(302, '/');
};

export const actions: Actions = {
	default: async ({ fetch, locals, cookies }) => {
		// Ask the backend to invalidate the token server-side before clearing cookies locally.
		if (locals.accessToken) {
			try {
				await serverApi(fetch, locals.accessToken).POST('/auth/sign-out', {});
			} catch {
				// Best-effort — cookies are cleared regardless so the user is signed out locally
				// even if the backend call fails (e.g. token already expired).
			}
		}

		// Remove both auth cookies so hooks.server.ts treats the next request as unauthenticated.
		cookies.delete(ACCESS_COOKIE, { path: '/' });
		cookies.delete(REFRESH_COOKIE, { path: '/' });

		redirect(302, '/login');
	}
};
