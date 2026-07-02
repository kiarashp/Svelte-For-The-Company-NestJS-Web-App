import { expect, test } from '@playwright/test';
import { authStatePath } from './auth-state';

test('anonymous visitor is redirected to /login', async ({ page }) => {
	await page.goto('/admin/audit-logs');
	await expect(page).toHaveURL('/login');
});

for (const role of ['author', 'editor'] as const) {
	test.describe(`${role} role`, () => {
		test.use({ storageState: authStatePath(role) });

		test('gets 403 navigating to /admin/audit-logs directly', async ({ page }) => {
			// Staff (author/editor) pass the shared /admin gate but not the admin-only narrowing
			// in src/routes/admin/audit-logs/+page.server.ts — "View audit logs" is admin-only.
			const response = await page.goto('/admin/audit-logs');
			expect(response?.status()).toBe(403);
		});
	});
}

test.describe('admin role', () => {
	test.use({ storageState: authStatePath('admin') });

	test('audit log list loads without a load error', async ({ page }) => {
		await page.goto('/admin/audit-logs');
		await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();
		// A failed fetch surfaces as a role=alert loadError — its absence is the
		// .data-envelope regression guard this suite exists for.
		await expect(page.getByRole('alert')).toHaveCount(0);
	});

	test('clicking a column header sorts ascending, clicking again reverses', async ({ page }) => {
		await page.goto('/admin/audit-logs');
		// The backend default (createdAt desc) is shown as the active sort even with no URL params.
		await expect(page.locator('th[aria-sort="descending"]')).toContainText('Date');

		// First click on a new column → ascending. Assert on the actual ID column values, not
		// specific rows — sorting mechanics hold regardless of what the seeded data contains.
		const idHeader = page.locator('thead').getByRole('link', { name: /^ID/ });
		await idHeader.click();
		await expect(page).toHaveURL(/sortBy=id&order=asc/);
		const asc = (await page.locator('tbody tr td:first-child').allInnerTexts()).map(Number);
		expect(asc).toEqual([...asc].sort((a, b) => a - b));

		// Second click on the now-active column → descending.
		await idHeader.click();
		await expect(page).toHaveURL(/sortBy=id&order=desc/);
		const desc = (await page.locator('tbody tr td:first-child').allInnerTexts()).map(Number);
		expect(desc).toEqual([...desc].sort((a, b) => b - a));
		await expect(page.getByRole('alert')).toHaveCount(0);
	});

	test('applying an action filter updates the URL and still renders cleanly', async ({ page }) => {
		// Seeded log contents aren't guaranteed, so assert on the filter mechanics (GET-form
		// navigation + clean render), not on specific rows being present or absent.
		await page.goto('/admin/audit-logs');
		await page.locator('select[name="action"]').selectOption('CREATE');
		await page.getByRole('button', { name: 'Apply' }).click();

		await expect(page).toHaveURL(/\/admin\/audit-logs\?.*action=CREATE/);
		await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();
		await expect(page.getByRole('alert')).toHaveCount(0);
		// The select stays on the applied value after the round trip (SSR pre-fills it from the URL).
		await expect(page.locator('select[name="action"]')).toHaveValue('CREATE');

		// Clear resets back to the unfiltered list.
		await page.getByRole('link', { name: 'Clear' }).click();
		await expect(page).toHaveURL('/admin/audit-logs');
	});
});
