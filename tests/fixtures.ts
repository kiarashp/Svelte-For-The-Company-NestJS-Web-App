import type { Page } from '@playwright/test';

export type SeededRole = 'admin' | 'author' | 'editor' | 'user';

// Looked up lazily (not at module load) so specs that only use one or two roles don't require
// every SEED_*_EMAIL/PASSWORD var to be set in .env.test.local.
export function credentialsFor(role: SeededRole): { email: string; password: string } {
	const prefix = `SEED_${role.toUpperCase()}`;
	const email = process.env[`${prefix}_EMAIL`];
	const password = process.env[`${prefix}_PASSWORD`];
	if (!email || !password) {
		throw new Error(
			`Missing ${prefix}_EMAIL/${prefix}_PASSWORD — set them in .env.test.local (see .env.test).`
		);
	}
	return { email, password };
}

// The frontend maps a 429 from POST /auth/sign-in onto the same generic message as any other
// non-401 failure — this is the one distinguishing string, used below to tell "throttled, retry"
// apart from a genuine credential/validation error, which should fail immediately instead.
const GENERIC_FAILURE_MESSAGE = 'Sign-in failed';

// Reads Retry-After straight from the real backend (PUBLIC_API_URL — the frontend origin has no
// /auth/sign-in route) and waits it out. Only called after a real attempt was actually throttled,
// so it never burns a quota slot speculatively.
async function waitOutSignInThrottle(): Promise<void> {
	const apiUrl = process.env.PUBLIC_API_URL;
	if (!apiUrl) throw new Error('PUBLIC_API_URL is not set — check .env.test.');

	const res = await fetch(`${apiUrl}/auth/sign-in`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: 'throttle-probe@example.com', password: 'x' })
	});
	const parsedRetryAfter = Number(res.headers.get('retry-after'));
	const retryAfterSeconds =
		res.status === 429 ? (Number.isNaN(parsedRetryAfter) ? 10 : parsedRetryAfter) : 0;
	if (retryAfterSeconds > 0) {
		await new Promise((resolve) => setTimeout(resolve, (retryAfterSeconds + 2) * 1000));
	}
}

// One fill-and-submit of the real /login form. Returns the error banner text on failure, or null
// on a successful redirect (staff roles land on '/admin', plain 'user' lands on '/' — the login
// action picks the target by role, so success here is just "no longer on /login").
async function submitLoginForm(
	page: Page,
	email: string,
	password: string
): Promise<string | null> {
	await page.goto('/login');
	await page.locator('input[name="email"]').fill(email);
	await page.locator('input[name="password"]').fill(password);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();

	const alert = page.getByRole('alert');
	const outcome = await Promise.race([
		page.waitForURL((url) => !url.pathname.startsWith('/login')).then(() => 'ok' as const),
		alert.waitFor({ state: 'visible' }).then(() => 'error' as const)
	]);
	if (outcome === 'ok') return null;
	return ((await alert.textContent()) ?? '').trim();
}

// Drives the real /login form (action="?/login") as a seeded role account, so every spec that
// needs an authenticated session shares one path instead of re-implementing form-filling.
// POST /auth/sign-in is tightly throttled on the real backend, so a throttled attempt is retried
// after waiting out Retry-After; any other failure message throws immediately.
export async function loginAs(page: Page, role: SeededRole): Promise<void> {
	const { email, password } = credentialsFor(role);
	const maxAttempts = 4;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const errorMessage = await submitLoginForm(page, email, password);
		if (errorMessage === null) return;

		const isThrottled = errorMessage.startsWith(GENERIC_FAILURE_MESSAGE);
		if (!isThrottled || attempt === maxAttempts) {
			throw new Error(`loginAs(${role}) failed: ${errorMessage}`);
		}
		await waitOutSignInThrottle();
	}
}

// Same retry-on-throttle behavior as loginAs, for specs that deliberately submit bad credentials
// and need the real error message (not a throttled one) back.
export async function submitLoginExpectingFailure(
	page: Page,
	email: string,
	password: string
): Promise<string> {
	const maxAttempts = 4;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const errorMessage = await submitLoginForm(page, email, password);
		if (errorMessage === null) {
			throw new Error('submitLoginExpectingFailure: login unexpectedly succeeded');
		}

		const isThrottled = errorMessage.startsWith(GENERIC_FAILURE_MESSAGE);
		if (!isThrottled || attempt === maxAttempts) return errorMessage;
		await waitOutSignInThrottle();
	}

	// Unreachable — the loop always returns or throws — but keeps TypeScript's control-flow
	// analysis happy about a guaranteed return value.
	throw new Error('submitLoginExpectingFailure: exhausted retries without a result');
}
