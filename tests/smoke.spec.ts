import { expect, test } from '@playwright/test';

// Wiring check only — confirms the dev server boots under Playwright's webServer and SSR
// responds. Real coverage lands in auth.spec.ts / admin-access.spec.ts / admin-posts.spec.ts.
test('app responds', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.ok()).toBe(true);
});
