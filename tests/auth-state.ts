import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SeededRole } from './fixtures';

// package.json has "type": "module", so __dirname isn't available — derive it from import.meta.
const dirname = path.dirname(fileURLToPath(import.meta.url));

// Session cookies cached by global-setup.ts — real tokens, must stay out of git (see .gitignore).
export const AUTH_DIR = path.join(dirname, '.auth');

export function authStatePath(role: SeededRole): string {
	return path.join(AUTH_DIR, `${role}.json`);
}
