import { expect, test } from '@playwright/test';
import { credentialsFor, loginAs, submitLoginExpectingFailure } from './fixtures';
import { authStatePath } from './auth-state';

// Serial — POST /auth/sign-in is tightly rate-limited on the real backend, and this file makes
// real sign-in calls back to back (see global-setup.ts for the fuller explanation).
test.describe.configure({ mode: 'serial' });

test.describe('login', () => {
	test('a seeded account can sign in through the real form', async ({ page }) => {
		// global-setup.ts already proves all 4 seeded roles authenticate (it logs in as each one
		// to build their cached sessions) — this is the one explicit, readable assertion that the
		// login form itself (same code path for every role) actually works end to end.
		// Admin is staff, so the login action sends it straight to /admin, not the homepage.
		await loginAs(page, 'admin');
		await expect(page).toHaveURL('/admin');
	});

	test('wrong password shows an error, not a silent failure', async ({ page }) => {
		const { email } = credentialsFor('admin');
		const message = await submitLoginExpectingFailure(page, email, 'definitely-wrong-password');
		expect(message).toContain('Invalid email or password');
	});
});

test('logout clears the session', async ({ browser }) => {
	// Start already authenticated from the cached admin session (global-setup.ts) instead of
	// spending another throttled /auth/sign-in call just to reach the logout page.
	const context = await browser.newContext({ storageState: authStatePath('admin') });
	const page = await context.newPage();

	await page.goto('/logout');
	// Scoped to <main> — the header nav also renders a "Sign out" button while logged in.
	await page.getByRole('main').getByRole('button', { name: 'Sign out' }).click();
	await expect(page).toHaveURL('/login');

	// Cookies are actually gone, not just the UI navigating away — a protected route must
	// bounce back to /login on the next request.
	await page.goto('/admin');
	await expect(page).toHaveURL('/login');

	await context.close();
});

test('register creates an account and redirects to login', async ({ page }) => {
	// Unique email per run — POST /users has no test-mode stub, so this genuinely creates a row
	// in the local dev DB each time the spec runs.
	const email = `e2e-register-${Date.now()}@example.com`;

	await page.goto('/register');
	await page.locator('input[name="firstName"]').fill('E2E');
	await page.locator('input[name="email"]').fill(email);
	await page.locator('input[name="password"]').fill('TestPass123!');
	await page.locator('input[name="confirmPassword"]').fill('TestPass123!');
	await page.getByRole('button', { name: 'Create account', exact: true }).click();

	// Current behavior: success redirects straight to /login with no confirmation message —
	// there's no distinct "check your email" state to assert on (matches +page.server.ts).
	await expect(page).toHaveURL('/login');
});
