import { expect, test } from '@playwright/test';
import { authStatePath } from './auth-state';

// Serial: the second test needs a post id created by the first, and both share one module-level
// variable — running them out of order or in parallel would break that dependency.
test.describe.serial('post delete', () => {
	test.describe('admin role', () => {
		test.use({ storageState: authStatePath('admin') });

		test('admin can delete their own newly-created post', async ({ page }) => {
			const title = `E2E delete test post ${Date.now()}`;

			await page.goto('/admin/posts/new');
			await page.locator('input[name="title"]').fill(title);
			await page.getByRole('button', { name: 'Create post' }).click();
			await expect(page).toHaveURL('/admin/posts');

			const row = page.locator('tr', { has: page.getByText(title) });
			await row.getByRole('link', { name: 'Delete' }).click();

			await expect(page.getByRole('heading', { name: 'Delete post' })).toBeVisible();
			await page.getByRole('button', { name: 'Delete' }).click();

			await expect(page).toHaveURL('/admin/posts');
			await expect(page.getByText(title)).toHaveCount(0);
		});
	});

	// Ownership rule from src/routes/admin/CLAUDE.md: editor is limited to their own posts, so an
	// editor hitting another author's delete route directly must be turned away by the backend's
	// 403 (same rule DELETE /posts/{id} enforces server-side) rather than the frontend guessing.
	let otherRolePostId: number;

	test.describe('admin role — setup for ownership check', () => {
		test.use({ storageState: authStatePath('admin') });

		test('admin creates a post for the ownership check', async ({ page }) => {
			const title = `E2E delete ownership post ${Date.now()}`;

			await page.goto('/admin/posts/new');
			await page.locator('input[name="title"]').fill(title);
			await page.getByRole('button', { name: 'Create post' }).click();
			await expect(page).toHaveURL('/admin/posts');

			const row = page.locator('tr', { has: page.getByText(title) });
			const editHref = await row.getByRole('link', { name: 'Edit' }).getAttribute('href');
			const match = editHref?.match(/\/admin\/posts\/(\d+)\/edit/);
			if (!match) throw new Error(`Could not parse post id from edit link: ${editHref}`);
			otherRolePostId = Number(match[1]);
		});
	});

	test.describe('editor role', () => {
		test.use({ storageState: authStatePath('editor') });

		test('editor is forbidden from deleting a post they do not own', async ({ page }) => {
			const response = await page.goto(`/admin/posts/${otherRolePostId}/delete`);
			expect(response?.status()).toBe(403);
		});
	});
});
