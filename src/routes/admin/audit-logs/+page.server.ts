import { error } from '@sveltejs/kit';
import { serverApi } from '$lib/api/client';
import type { PageServerLoad } from './$types';

// The backend's exact-match action filter — anything else in ?action= is ignored, not forwarded.
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE'] as const;
type AuditAction = (typeof ACTIONS)[number];

// Sortable columns accepted by GET /audit-logs — invalid values would 400 on the backend,
// so unknown ?sortBy=/?order= fall back to the backend's default (createdAt desc) instead.
const SORT_COLUMNS = ['id', 'action', 'entity', 'entityId', 'userId', 'createdAt'] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];
const ORDERS = ['asc', 'desc'] as const;
type SortOrder = (typeof ORDERS)[number];

// Nest validation errors shape { message: string | string[] } — surface the real reason
// instead of just the status code so a failed fetch is diagnosable from the UI.
function extractMessage(err: unknown): string | undefined {
	if (err && typeof err === 'object' && 'message' in err) {
		const message = (err as { message?: unknown }).message;
		if (typeof message === 'string') return message;
		if (Array.isArray(message)) return message.join(' ');
	}
	return undefined;
}

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	// The shared /admin layout gate lets author/editor through as staff — audit logs are
	// admin-only per the permission matrix. This section has no sub-routes, so the narrowing
	// guard lives here instead of a +layout.server.ts (unlike /admin/users).
	if (locals.user!.role !== 'admin') throw error(403, 'Admin access only');

	const client = serverApi(fetch, locals.accessToken);

	const page = Number(url.searchParams.get('page') ?? 1);
	const limit = 20;

	// Validate ?action= against the enum so a hand-edited URL can't send an invalid value.
	const rawAction = url.searchParams.get('action') ?? '';
	const actionFilter = (ACTIONS as readonly string[]).includes(rawAction)
		? (rawAction as AuditAction)
		: null;
	// Entity is an exact-match string on the backend (e.g. "Post") — empty means no filter.
	const entityFilter = url.searchParams.get('entity')?.trim() || null;

	// Effective sort — defaults mirror the backend's own (createdAt desc), so the template can
	// always render an active sort indicator even when the URL carries no sort params.
	const rawSortBy = url.searchParams.get('sortBy') ?? '';
	const sortBy = (SORT_COLUMNS as readonly string[]).includes(rawSortBy)
		? (rawSortBy as SortColumn)
		: 'createdAt';
	const rawOrder = url.searchParams.get('order') ?? '';
	const order = (ORDERS as readonly string[]).includes(rawOrder) ? (rawOrder as SortOrder) : 'desc';

	const {
		data,
		error: apiError,
		response
	} = await client.GET('/audit-logs', {
		params: {
			query: {
				page,
				limit,
				sortBy,
				order,
				// Only include the filter keys when set — the backend treats presence as a filter.
				...(actionFilter ? { action: actionFilter } : {}),
				...(entityFilter ? { entity: entityFilter } : {})
			}
		}
	});

	// Check error/response.ok before reading data — a failed fetch must not look like an
	// empty list (this codebase shipped that exact bug once, on the admin post list).
	let loadError: string | null = null;
	if (apiError || !response.ok) {
		const message = extractMessage(apiError);
		loadError = message
			? `Could not load audit logs (${response.status}): ${message}`
			: `Could not load audit logs (${response.status}).`;
	}

	const logs = data?.data?.data ?? [];
	// Declared with concrete (non-optional) number fields and merged via Object.assign so the
	// template can compare meta.totalPages > 1 without fighting the schema's optional properties.
	const meta = { currentPage: page, totalPages: 1, totalItems: 0 };
	if (data?.data?.meta) Object.assign(meta, data.data.meta);

	return {
		logs,
		meta,
		loadError,
		page,
		actionFilter,
		entityFilter,
		sortBy,
		order,
		actions: ACTIONS
	};
};
