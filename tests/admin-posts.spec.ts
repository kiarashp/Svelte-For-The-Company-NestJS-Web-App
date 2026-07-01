import { expect, test } from '@playwright/test';
import { authStatePath } from './auth-state';

// Admin sees every post (canActOnAny), avoiding any ownership-visibility nuance from the
// editor-sees-own-posts-only rule (see src/routes/admin/posts/+page.server.ts).
test.use({ storageState: authStatePath('admin') });

test('post list loads without a load error', async ({ page }) => {
	await page.goto('/admin/posts');
	await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();
	// A failed fetch renders a role="alert" banner instead of the table/empty-state (the
	// .data-envelope loadError bug documented in STATE.md) — assert that never appears.
	await expect(page.getByRole('alert')).toHaveCount(0);
});

test('creating a post redirects to the list and the new post appears', async ({ page }) => {
	// Unique title per run — POST /posts has no test-mode stub, so this genuinely creates a row
	// in the local dev DB each time the spec runs.
	const title = `E2E test post ${Date.now()}`;

	await page.goto('/admin/posts/new');
	await page.locator('input[name="title"]').fill(title);
	await page.getByRole('button', { name: 'Create post' }).click();

	await expect(page).toHaveURL('/admin/posts');
	await expect(page.getByText(title)).toBeVisible();
});
