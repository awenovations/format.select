import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { lucia, validateUserAndGetDetails } from '$lib/server/auth';
import { getUsageInfo, type Plan } from '$lib/server/usage';
import { getApiUsageInfo, type ApiPlan } from '$lib/server/api-usage';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionId = cookies.get(lucia.sessionCookieName);
	const session = sessionId ? await validateUserAndGetDetails(sessionId) : null;

	if (!session?.user) {
		return {
			usage: null,
			hasBilling: false,
			apiUsage: null
		};
	}

	const plan = (session.user.plan as Plan) ?? 'free';

	if (plan === 'admin') {
		throw redirect(302, '/');
	}

	const usage = await getUsageInfo(session.user._id, plan);
	const apiPlan: ApiPlan = (session.user.apiPlan as ApiPlan) ?? 'api_free';
	const apiUsage = await getApiUsageInfo(session.user._id, apiPlan);

	return {
		usage,
		hasBilling: !!session.user.stripeCustomerId,
		apiUsage
	};
};
