import {
	PUBLIC_SITE_NAME,
	PUBLIC_SITE_TAGLINE,
	PUBLIC_SITE_LOGO_URL,
	PUBLIC_SUPPORT_EMAIL,
	PUBLIC_TWITTER_URL,
	PUBLIC_LINKEDIN_URL,
	PUBLIC_GITHUB_URL
} from '$env/static/public';

export const SITE_CONFIG = {
	name: PUBLIC_SITE_NAME || 'Acme Corp',
	tagline: PUBLIC_SITE_TAGLINE || 'Building things that matter',
	logoUrl: PUBLIC_SITE_LOGO_URL || '/logo.svg',
	supportEmail: PUBLIC_SUPPORT_EMAIL || 'hello@acme.com',
	socialLinks: {
		twitter: PUBLIC_TWITTER_URL || '',
		linkedin: PUBLIC_LINKEDIN_URL || '',
		github: PUBLIC_GITHUB_URL || ''
	}
} as const;

export type SiteConfig = typeof SITE_CONFIG;
