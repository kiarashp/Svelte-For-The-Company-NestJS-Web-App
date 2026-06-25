import type { LayoutServerLoad } from './$types';

// Expose user and resolved theme to page.data for the whole app.
// accessToken is server-only — never included here.
export const load: LayoutServerLoad = async ({ locals }) => ({
	user: locals.user,
	theme: locals.theme
});
