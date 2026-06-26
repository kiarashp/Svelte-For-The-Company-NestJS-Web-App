import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Auth guard — changing password requires a signed-in user.
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	return {};
};

export const actions: Actions = {
	changePassword: async ({ request, fetch, locals }) => {
		const data = await request.formData();
		const currentPassword = String(data.get('currentPassword') ?? '');
		const newPassword = String(data.get('newPassword') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { message: 'All fields are required.' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { message: 'New passwords do not match.' });
		}

		let res: Response;
		try {
			// Raw fetch — POST /auth/change-password response is content?: never (generator bug).
			// Bearer header added manually since this endpoint requires authentication.
			res = await fetch(`${PUBLIC_API_URL}/auth/change-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${locals.accessToken}`
				},
				body: JSON.stringify({ currentPassword, newPassword })
			});
		} catch {
			return fail(503, { message: 'Could not reach the server. Please try again.' });
		}

		if (res.status === 403) {
			return fail(403, { message: 'Current password is incorrect.' });
		}

		if (!res.ok) {
			return fail(res.status >= 500 ? 503 : 400, {
				message: 'Could not change password. Please try again.'
			});
		}

		// Return success inline — keeps the user on the page without a disorienting redirect.
		return { changed: true };
	}
};
