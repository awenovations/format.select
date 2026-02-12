import type { Handle } from '@sveltejs/kit';

export function csrf(allowedPaths: string[], allowedOrigins: string[] = []): Handle {
	return async ({ event, resolve }) => {
		const { method, url, headers } = event.request;

		const isFormSubmission =
			['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
			['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'].includes(
				headers.get('content-type') || ''
			);

		if (isFormSubmission && !allowedPaths.some((path) => url.startsWith(path))) {
			const origin = headers.get('origin');

			if (!origin || !allowedOrigins.includes(origin)) {
				return new Response('CSRF token validation failed', { status: 403 });
			}
		}

		return resolve(event);
	};
}
