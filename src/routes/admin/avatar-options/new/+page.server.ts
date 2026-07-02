import { fail, redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/api/client';
import type { Actions } from './$types';

// Nest validation errors shape { message: string | string[] } — surface the real reason
// instead of just the status code so a failed request is diagnosable from the UI.
function extractMessage(err: unknown): string | undefined {
	if (err && typeof err === 'object' && 'message' in err) {
		const message = (err as { message?: unknown }).message;
		if (typeof message === 'string') return message;
		if (Array.isArray(message)) return message.join(' ');
	}
	return undefined;
}

export const actions: Actions = {
	create: async ({ request, fetch, locals }) => {
		const client = serverApi(fetch, locals.accessToken);
		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'An image file is required.' });
		}

		const uploadBody = new FormData();
		uploadBody.append('file', file);

		// POST /users/avatar-options has `requestBody?: never` in openapi-types.ts — this
		// endpoint's request contract isn't documented by the generator at all (worse than the
		// mistyped `Record<string, never>` product DTOs). AvatarOption's Cloudinary-shaped
		// url/publicId fields strongly suggest a multipart file upload with field name "file",
		// matching the post/product image endpoints — cast around the missing type the same way
		// the mistyped product write DTOs are cast (see src/CLAUDE.md). If this assumption is
		// wrong, the real error from the backend will surface via `message` below.
		const { error, response } = await client.POST('/users/avatar-options', {
			body: uploadBody as unknown as never
		});

		if (error || !response.ok) {
			const message = extractMessage(error) ?? 'Failed to create avatar option.';
			return fail(response.status || 400, { message });
		}

		redirect(303, '/admin/avatar-options');
	}
};
