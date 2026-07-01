import { expect, test, type Page } from '@playwright/test';
import { authStatePath } from './auth-state';

// GET /users has no search/filter query param (see src/routes/admin/users/+page.server.ts), so
// finding a specific user means paging through the list until its email shows up. Bounded to a
// generous page count — the seeded + e2e-created user pool is small in the local dev DB.
async function goToUserRowByEmail(page: Page, email: string, maxPages = 25) {
	for (let p = 1; p <= maxPages; p++) {
		await page.goto(`/admin/users?page=${p}`);
		const row = page.locator('tr', { has: page.getByText(email, { exact: true }) });
		if (await row.count()) return row;
		const hasNextPage = await page
			.getByRole('navigation', { name: 'User list pages' })
			.getByRole('link', { name: String(p + 1), exact: true })
			.count();
		if (!hasNextPage) break;
	}
	throw new Error(`Could not find a user row for ${email} within ${maxPages} pages`);
}

test('anonymous visitor is redirected to /login', async ({ page }) => {
	await page.goto('/admin/users');
	await expect(page).toHaveURL('/login');
});

for (const role of ['author', 'editor'] as const) {
	test.describe(`${role} role`, () => {
		test.use({ storageState: authStatePath(role) });

		test('gets 403 navigating to /admin/users directly', async ({ page }) => {
			// Staff (author/editor) pass the shared /admin gate but not the users-only narrowing
			// in src/routes/admin/users/+layout.server.ts — "Manage users" is admin-only.
			const response = await page.goto('/admin/users');
			expect(response?.status()).toBe(403);
		});
	});
}

test.describe('admin role', () => {
	test.use({ storageState: authStatePath('admin') });

	test('user list loads without a load error', async ({ page }) => {
		await page.goto('/admin/users');
		await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
		await expect(page.getByRole('alert')).toHaveCount(0);
	});

	test('editing a user updates their name', async ({ page, browser }) => {
		// /register redirects an already-authenticated visitor to '/' (see
		// src/routes/register/+page.server.ts), and this test's `page` is pre-authenticated as
		// admin via storageState — so registration needs a separate, logged-out context.
		// `browser.newContext()` inherits the describe block's `storageState` by default, so it
		// must be explicitly cleared here or the new context would be admin-authenticated too.
		const email = `e2e-admin-users-${Date.now()}@example.com`;
		const guestContext = await browser.newContext({ storageState: undefined });
		const guestPage = await guestContext.newPage();
		await guestPage.goto('/register');
		await guestPage.locator('input[name="firstName"]').fill('Before');
		await guestPage.locator('input[name="email"]').fill(email);
		await guestPage.locator('input[name="password"]').fill('TestPass123!');
		await guestPage.locator('input[name="confirmPassword"]').fill('TestPass123!');
		await guestPage.getByRole('button', { name: 'Create account', exact: true }).click();
		await expect(guestPage).toHaveURL('/login');
		await guestContext.close();

		const row = await goToUserRowByEmail(page, email);
		await row.getByRole('link', { name: 'Edit' }).click();

		await expect(page.getByRole('heading', { name: 'Edit user' })).toBeVisible();
		// The firstName input is SSR-prefilled via a one-way `value={...}` binding (not
		// `bind:value`). Filling it before client-side hydration finishes gets silently
		// overwritten when hydration re-applies the original SSR value a moment later —
		// waiting for the network to go idle gives hydration time to complete first.
		await page.waitForLoadState('networkidle');
		await page.locator('input[name="firstName"]').fill('After');
		// Wait for the actual PATCH round trip, not just the click event — a plain click+toHaveURL
		// can observe the page before use:enhance's fetch (and the redirect it triggers) resolves,
		// especially under the parallel test load this suite runs with.
		await Promise.all([
			page.waitForResponse((r) => r.url().includes('?/update')),
			page.getByRole('button', { name: 'Save changes' }).click()
		]);

		await expect(page).toHaveURL('/admin/users');
		const updatedRow = await goToUserRowByEmail(page, email);
		await expect(updatedRow.getByText('After')).toBeVisible();
	});
});
