export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const COOKIE = 'theme';
const MAX_AGE = 31536000; // 1 year

function readCookie(): ThemePreference {
	// matches "theme=<value>" anywhere in the cookie string
	const m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
	const v = m ? decodeURIComponent(m[1]) : 'system';
	return v === 'light' || v === 'dark' ? v : 'system';
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
	if (pref !== 'system') return pref;
	// fall back to OS preference when the user hasn't made an explicit choice
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Module-level reactive state — SSR guard keeps document access client-only
let preference = $state<ThemePreference>(typeof document !== 'undefined' ? readCookie() : 'system');

export function getPreference(): ThemePreference {
	return preference;
}

export function getResolved(): ResolvedTheme {
	return resolveTheme(preference);
}

export function setPreference(pref: ThemePreference): void {
	preference = pref;
	document.cookie = `${COOKIE}=${pref}; path=/; max-age=${MAX_AGE}; samesite=lax`;
	// write immediately so the color switches without waiting for a server round-trip
	document.documentElement.setAttribute('data-theme', resolveTheme(pref));
}
