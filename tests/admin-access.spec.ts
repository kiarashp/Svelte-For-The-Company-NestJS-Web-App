import { expect, test } from '@playwright/test';
import { authStatePath } from './auth-state';
import type { SeededRole } from './fixtures';

// Encodes the role-gate matrix from src/routes/admin/CLAUDE.md's layout guard: guests redirect
// to /login, plain `user` gets 403, staff (admin/author/editor) get through. Uses the sessions
// cached by tests/global-setup.ts — no real /auth/sign-in calls here, so no throttle concerns.

test('anonymous visitor is redirected to /login', async ({ page }) => {
	await page.goto('/admin');
	await expect(page).toHaveURL('/login');
});

test.describe('user role', () => {
	test.use({ storageState: authStatePath('user') });

	test('gets 403 Staff access only', async ({ page }) => {
		const response = await page.goto('/admin');
		expect(response?.status()).toBe(403);
		await expect(page.getByText('Staff access only')).toBeVisible();
	});
});

const STAFF_ROLES: SeededRole[] = ['admin', 'author', 'editor'];

for (const role of STAFF_ROLES) {
	test.describe(`${role} role`, () => {
		test.use({ storageState: authStatePath(role) });

		test('can reach /admin', async ({ page }) => {
			const response = await page.goto('/admin');
			expect(response?.ok()).toBe(true);
			await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
		});
	});
}
