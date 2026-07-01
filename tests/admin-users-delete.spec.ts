import { expect, test, type Page } from '@playwright/test';
import { authStatePath } from './auth-state';

// Mirrors the search helper in admin-users.spec.ts — GET /users has no search param, so finding a
// specific user means paging through the list.
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

test.describe('admin role', () => {
	test.use({ storageState: authStatePath('admin') });

	test('admin can delete a user that is not their own account', async ({ page, browser }) => {
		// /register redirects an already-authenticated visitor to '/' (see
		// src/routes/register/+page.server.ts), and this test's `page` is pre-authenticated as
		// admin via storageState — so registration needs a separate, logged-out context.
		// `browser.newContext()` inherits the describe block's `storageState` by default, so it
		// must be explicitly cleared here or the new context would be admin-authenticated too.
		const email = `e2e-admin-users-delete-${Date.now()}@example.com`;
		const guestContext = await browser.newContext({ storageState: undefined });
		const guestPage = await guestContext.newPage();
		await guestPage.goto('/register');
		await guestPage.locator('input[name="firstName"]').fill('Throwaway');
		await guestPage.locator('input[name="email"]').fill(email);
		await guestPage.locator('input[name="password"]').fill('TestPass123!');
		await guestPage.locator('input[name="confirmPassword"]').fill('TestPass123!');
		await guestPage.getByRole('button', { name: 'Create account', exact: true }).click();
		await expect(guestPage).toHaveURL('/login');
		await guestContext.close();

		const row = await goToUserRowByEmail(page, email);
		await row.getByRole('link', { name: 'Delete' }).click();

		await expect(page.getByRole('heading', { name: 'Delete user' })).toBeVisible();
		await page.getByRole('button', { name: 'Delete' }).click();

		await expect(page).toHaveURL('/admin/users');
		await expect(page.getByText(email)).toHaveCount(0);
	});

	test('admin cannot delete their own account', async ({ page }) => {
		// The signed-in admin's own row is tagged "(you)" and (per +page.svelte) omits the Delete
		// link entirely — assert the UI omission, then confirm the server guard backs it up too.
		await page.goto('/admin/users');
		const ownRow = page.locator('tr', { has: page.getByText('(you)') });
		await expect(ownRow).toHaveCount(1);
		await expect(ownRow.getByRole('link', { name: 'Delete' })).toHaveCount(0);

		const editHref = await ownRow.getByRole('link', { name: 'Edit' }).getAttribute('href');
		const match = editHref?.match(/\/admin\/users\/(\d+)/);
		if (!match) throw new Error(`Could not parse admin's own id from edit link: ${editHref}`);
		const ownId = match[1];

		// Direct navigation must also be rejected — the list merely hiding the link isn't the gate.
		const response = await page.goto(`/admin/users/${ownId}/delete`);
		expect(response?.status()).toBe(403);
	});
});
