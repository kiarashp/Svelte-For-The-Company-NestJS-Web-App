import type { Handle } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

// Single source of truth for cookie names — a typo here would silently break auth.
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

// The openapi-types entry for GET /users/me has `content?: never` (generator limitation).
// Define the real shape manually, matching App.Locals['user'].
type MeResponse = NonNullable<App.Locals['user']>;

/**
 * Fetch the authenticated user from the API using a Bearer token.
 *
 * Returns the user object on 200.
 * Returns the sentinel 'expired' on 401 — the caller should attempt a token refresh.
 * Throws on 403 / 5xx so the outer try/catch can degrade gracefully without retrying.
 *
 * Uses the caller's fetch (event.fetch), not global fetch — in hooks.server.ts locals
 * aren't populated yet so we must use raw fetch with a manual Authorization header.
 */
async function fetchMe(fetchFn: typeof fetch, token: string): Promise<MeResponse | 'expired'> {
	const res = await fetchFn(`${PUBLIC_API_URL}/users/me`, {
		// Explicit Bearer header — the HttpOnly cookie is not forwarded server-to-server,
		// so we attach the token from cookies manually. It never touches JS-readable storage.
		headers: { Authorization: `Bearer ${token}` }
	});

	if (res.status === 401) {
		// Token is expired or invalid — signal to retry with a refreshed token, not an error.
		return 'expired';
	}

	if (!res.ok) {
		// 403 (account suspended), 5xx, network error, etc. — surface as an error;
		// the outer catch will log and leave the user unauthenticated.
		throw new Error(`GET /users/me returned ${res.status}`);
	}

	// openapi-types marks the 200 body as `content?: never` — cast the real shape manually.
	return (await res.json()) as MeResponse;
}

/**
 * Exchange a refresh token for a new access + refresh token pair.
 *
 * Returns { accessToken, refreshToken } on success.
 * Returns null on 401/403 — refresh token is revoked or expired; user must sign in again.
 * Throws on 5xx so the outer try/catch can log and degrade gracefully.
 *
 * RefreshTokenDto is typed as Record<string, never> in openapi-types (generator bug).
 * We send the real payload { refreshToken } that the backend expects.
 */
async function doRefresh(
	fetchFn: typeof fetch,
	refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
	const res = await fetchFn(`${PUBLIC_API_URL}/auth/refresh-tokens`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		// Send the actual body the backend requires — the OpenAPI schema for this DTO is wrong.
		body: JSON.stringify({ refreshToken })
	});

	if (res.status === 401 || res.status === 403) {
		// Refresh token is revoked or expired — this is an expected outcome, not an exception.
		// Return null so the caller can clean up cookies without needing a nested try/catch.
		return null;
	}

	if (!res.ok) {
		throw new Error(`POST /auth/refresh-tokens returned ${res.status}`);
	}

	return (await res.json()) as { accessToken: string; refreshToken: string };
}

/**
 * Map the raw `theme` cookie value to a valid App.Locals['theme'].
 * Any missing or unrecognised value defaults to 'system' so the inline matchMedia
 * script in app.html handles OS resolution — we never inject an unknown string into HTML.
 */
function parseTheme(raw: string | undefined): App.Locals['theme'] {
	if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
	return 'system';
}

export const handle: Handle = async ({ event, resolve }) => {
	// ── 1. Auth resolution ─────────────────────────────────────────────────────────
	// Start from a clean unauthenticated baseline so any early return is safe.
	event.locals.user = null;
	event.locals.accessToken = null;

	// Read the access token from its HttpOnly cookie — never readable in client JS.
	const accessToken = event.cookies.get(ACCESS_COOKIE) ?? null;

	if (accessToken) {
		try {
			let user: App.Locals['user'] = null;
			// Track which token ends up valid so user and accessToken locals stay consistent.
			let activeToken = accessToken;

			const result = await fetchMe(event.fetch, accessToken);

			if (result === 'expired') {
				// Access token rejected — attempt a silent refresh before any load runs.
				const refreshToken = event.cookies.get(REFRESH_COOKIE) ?? null;

				if (refreshToken) {
					const newPair = await doRefresh(event.fetch, refreshToken);

					if (newPair) {
						// Persist the new token pair as HttpOnly cookies before the response goes out.
						// access_token TTL: 1 hour (3 600 s) — matches the backend JWT TTL.
						event.cookies.set(ACCESS_COOKIE, newPair.accessToken, {
							httpOnly: true,
							path: '/',
							maxAge: 3600,
							sameSite: 'lax'
						});
						// refresh_token TTL: 24 hours (86 400 s) — matches the backend refresh TTL.
						event.cookies.set(REFRESH_COOKIE, newPair.refreshToken, {
							httpOnly: true,
							path: '/',
							maxAge: 86400,
							sameSite: 'lax'
						});

						activeToken = newPair.accessToken;

						// Retry /users/me with the fresh access token.
						const retryResult = await fetchMe(event.fetch, newPair.accessToken);
						if (retryResult !== 'expired') {
							user = retryResult;
						}
						// retryResult === 'expired' here is pathological (brand-new token rejected immediately).
						// Leave user null and let the session lapse naturally.
					} else {
						// Refresh token is revoked or expired — delete both stale cookies so subsequent
						// requests don't repeat two pointless API calls on every page load.
						event.cookies.delete(ACCESS_COOKIE, { path: '/' });
						event.cookies.delete(REFRESH_COOKIE, { path: '/' });
					}
				}
				// No refresh_token cookie — nothing to exchange, stay unauthenticated.
			} else {
				// Original access token is still valid.
				user = result;
			}

			event.locals.user = user;
			// Only set accessToken when a user was resolved — ensures the two locals are always
			// a consistent pair (never a token without a user or vice versa).
			// accessToken is server-only: it must NEVER be serialised into page.data.
			event.locals.accessToken = user !== null ? activeToken : null;
		} catch (err) {
			// Network failure or unexpected API response — log and degrade gracefully to
			// unauthenticated. The request continues rather than crashing the whole page.
			console.error('[hooks.server] Auth resolution error:', err);
		}
	}

	// ── 2. Theme resolution ────────────────────────────────────────────────────────
	// The theme cookie is not HttpOnly so the inline no-flash script in app.html can
	// also read it without a server round-trip.
	event.locals.theme = parseTheme(event.cookies.get('theme'));

	// ── 3. Resolve + inject data-theme ────────────────────────────────────────────
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const theme = event.locals.theme;

			// Inject data-theme onto <html> for explicit preferences so the server-rendered
			// HTML already carries the correct theme before JS hydrates — zero flash.
			// For 'system' we deliberately skip injection: the server cannot know the OS
			// dark/light preference, so we leave it to the matchMedia script in app.html.
			if (theme === 'light' || theme === 'dark') {
				return html.replace('<html', `<html data-theme="${theme}"`);
			}

			return html;
		}
	});
};
