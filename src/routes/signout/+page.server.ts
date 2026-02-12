import { lucia } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { signOut } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions = {
	default: async ({ cookies }) => {
		const sessionId = cookies.get(lucia.sessionCookieName);
		if (sessionId) {
			try {
				await signOut(sessionId);
			} catch (error) {
				console.error(error);
			}
		}
		redirect(303, '/signin');
	}
} satisfies Actions;
