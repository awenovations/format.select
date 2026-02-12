import { sequence } from '@sveltejs/kit/hooks';
import { lucia } from '$lib/server/auth';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { csrf } from './hooks/csrf';

const allowedPaths: string[] = ['/api/v1/'];

const sessionValidation: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);

	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

const csrfHandle: Handle = async ({ event, resolve }) => {
	// In dev, allow the request's own origin so any port works
	const origins = dev
		? [event.url.origin]
		: ['https://format.select', 'https://www.format.select'];
	return csrf(allowedPaths, origins)({ event, resolve });
};

export const handle: Handle = sequence(csrfHandle, sessionValidation);
