// Loads .env.test (committed, non-secret) then .env.test.local (gitignored, real seeded
// credentials) before config evaluation — this is Node context, so $env/static/public doesn't
// apply here. The .local file loads second so its values override.
import { config } from 'dotenv';
import { defineConfig } from '@playwright/test';

config({ path: '.env.test' });
config({ path: '.env.test.local', override: true });

export default defineConfig({
	testDir: 'tests',
	globalSetup: './tests/global-setup.ts',
	// Longer than Playwright's 30s default — a sign-in test can retry through the real backend's
	// throttle window (see tests/fixtures.ts), which alone can take 20-30s.
	timeout: 90_000,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'pnpm dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI
	},
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' }
		}
	]
});
