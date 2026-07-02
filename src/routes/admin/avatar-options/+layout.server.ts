import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// /admin/+layout.server.ts already lets author/editor through as staff — avatar option
	// management is admin-only per the permission matrix, so narrow the gate further here.
	if (locals.user!.role !== 'admin') throw error(403, 'Admin access only');
	return {};
};
