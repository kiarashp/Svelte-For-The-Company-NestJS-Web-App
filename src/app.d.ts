declare global {
	namespace App {
		interface Locals {
			user: {
				id: number;
				firstName: string;
				lastName: string | null;
				email: string;
				role: 'admin' | 'author' | 'editor' | 'user';
				isEmailVerified: boolean;
				avatarUrl?: string;
				bio?: string | null;
			} | null;
			theme: 'light' | 'dark' | 'system';
			accessToken: string | null; // server-only — never serialised into page.data
		}
		interface PageData {
			user: App.Locals['user'];
			theme: 'light' | 'dark' | 'system';
		}
	}
}

export {};
