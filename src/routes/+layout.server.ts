import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { lucia, validateUserAndGetDetails } from '$lib/server/auth';
import { getUsageInfo, type Plan } from '$lib/server/usage';

const EXEMPT_PATHS = ['/paywall', '/signout', '/signin', '/signup', '/pwd-reset', '/api/', '/settings', '/docs'];

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const sessionId = cookies.get(lucia.sessionCookieName);

	const session = sessionId ? await validateUserAndGetDetails(sessionId) : null;

	if (
		!session?.user &&
		url.pathname !== '/signin' &&
		!url.pathname.startsWith('/signup') &&
		!url.pathname.startsWith('/pwd-reset')
	) {
		throw redirect(302, '/signin');
	} else if (
		session?.user &&
		(url.pathname.startsWith('/signin') || url.pathname.startsWith('/signup'))
	) {
		throw redirect(302, '/');
	}

	let usage = null;

	if (session?.user) {
		const plan: Plan = (session.user.plan as Plan) ?? 'free';
		usage = await getUsageInfo(session.user._id, plan);

		if (
			plan === 'free' &&
			usage.used >= usage.limit &&
			!EXEMPT_PATHS.some((p) => url.pathname.startsWith(p))
		) {
			throw redirect(302, '/paywall');
		}
	}

	return {
		session: session
			? {
					user: {
						name: session.user.name,
						email: session.user.email
					}
				}
			: null,
		usage
	};
};
