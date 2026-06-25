export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const COOKIE = 'theme';
const MAX_AGE = 31536000; // 1 year

export function getPreference(): ThemePreference {
	// SSR guard — document is undefined on the server
	if (typeof document === 'undefined') return 'system';
	// matches "theme=<value>" anywhere in the cookie string
	const m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
	const v = m ? decodeURIComponent(m[1]) : 'system';
	return v === 'light' || v === 'dark' ? v : 'system';
}

export function getResolved(): ResolvedTheme {
	const pref = getPreference();
	if (pref !== 'system') return pref;
	// fall back to OS preference when the user hasn't made an explicit choice
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setPreference(pref: ThemePreference): void {
	document.cookie = `${COOKIE}=${pref}; path=/; max-age=${MAX_AGE}; samesite=lax`;
	const resolved: ResolvedTheme =
		pref !== 'system'
			? pref
			: window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
	// write immediately so the color switches without waiting for a server round-trip
	document.documentElement.setAttribute('data-theme', resolved);
}
