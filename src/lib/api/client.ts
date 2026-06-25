import createClient from 'openapi-fetch';
import type { paths } from '$lib/types/openapi-types';
import { PUBLIC_API_URL } from '$env/static/public';

/** Browser client — credentials:include so cookies are forwarded automatically. */
export const api = createClient<paths>({
	baseUrl: PUBLIC_API_URL,
	credentials: 'include'
});

/**
 * Server client for load functions and actions.
 * Pass event.fetch (forwards cookies) and locals.accessToken (adds Bearer header).
 */
export function serverApi(fetchFn: typeof fetch, accessToken?: string | null) {
	return createClient<paths>({
		baseUrl: PUBLIC_API_URL,
		fetch: fetchFn,
		headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
	});
}
