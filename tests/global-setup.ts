import fs from 'node:fs';
import type { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';
import { loginAs, type SeededRole } from './fixtures';
import { AUTH_DIR, authStatePath } from './auth-state';

const ROLES: SeededRole[] = ['admin', 'author', 'editor', 'user'];

// POST /auth/sign-in on the real backend is tightly throttled — logging in fresh for every test
// across every spec file would trip it constantly. Log in once per role here (loginAs waits out
// the throttle before each attempt — see fixtures.ts), cache the resulting session as Playwright
// storageState, and let specs start already authenticated
// (browser.newContext({ storageState: authStatePath(role) })) instead of resubmitting the login
// form. This also doubles as proof each seeded role can actually sign in through the real UI.
export default async function globalSetup(config: FullConfig): Promise<void> {
	fs.mkdirSync(AUTH_DIR, { recursive: true });

	const baseURL = config.projects[0]?.use?.baseURL as string;
	const browser = await chromium.launch();

	try {
		for (const role of ROLES) {
			const context = await browser.newContext({ baseURL });
			const page = await context.newPage();
			await loginAs(page, role);
			await context.storageState({ path: authStatePath(role) });
			await context.close();
		}
	} finally {
		await browser.close();
	}
}
