import { sequence } from '@sveltejs/kit/hooks';
import { lucia } from '$lib/server/auth';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { csrf } from './hooks/csrf';

const allowedPaths: string[] = ['/api/v1/'];

const posthogProxy: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith('/relay-oDVs')) {
		const hostname = pathname.startsWith('/relay-oDVs/static/')
			? 'us-assets.i.posthog.com'
			: 'us.i.posthog.com';

		const url = new URL(event.request.url);
		url.protocol = 'https:';
		url.hostname = hostname;
		url.port = '443';
		url.pathname = pathname.replace('/relay-oDVs/', '');

		const headers = new Headers(event.request.headers);
		headers.set('Accept-Encoding', '');
		headers.set('host', hostname);

		const response = await fetch(url.toString(), {
			method: event.request.method,
			headers,
			body: event.request.body,
			// @ts-ignore
			duplex: 'half'
		});

		return response;
	}

	return resolve(event);
};

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

export const handle: Handle = sequence(posthogProxy, csrfHandle, sessionValidation);
