import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Only staff can reach any /admin route — plain users and guests are rejected here.
const STAFF = new Set(['admin', 'author', 'editor']);

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (!STAFF.has(locals.user.role)) throw error(403, 'Staff access only');
	return { user: locals.user };
};
