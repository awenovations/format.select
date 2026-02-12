import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { lucia, validateUserAndGetDetails } from '$lib/server/auth';
import { getApiUsageInfo, API_PLAN_CONFIG, type ApiPlan } from '$lib/server/api-usage';
import { createApiToken, listApiTokens, deleteApiToken } from '$lib/server/api-tokens';
import { getUsageInfo, type Plan } from '$lib/server/usage';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionId = cookies.get(lucia.sessionCookieName);
	const session = sessionId ? await validateUserAndGetDetails(sessionId) : null;

	if (!session?.user) {
		throw redirect(302, '/signin');
	}

	const plan: Plan = (session.user.plan as Plan) ?? 'free';
	const webUsage = await getUsageInfo(session.user._id, plan);

	const apiPlan: ApiPlan = (session.user.apiPlan as ApiPlan) ?? 'api_free';
	const apiUsage = await getApiUsageInfo(session.user._id, apiPlan);
	const tokens = await listApiTokens(session.user._id);
	const planConfig = API_PLAN_CONFIG[apiPlan];

	return {
		webUsage,
		hasBilling: !!session.user.stripeCustomerId,
		apiUsage,
		tokens: tokens.map((t) => ({
			id: t._id.toString(),
			name: t.name,
			tokenSuffix: t.tokenSuffix,
			createdAt: t.createdAt.toISOString(),
			lastUsedAt: t.lastUsedAt?.toISOString() ?? null
		})),
		maxKeys: planConfig.maxKeys
	};
};

export const actions: Actions = {
	createToken: async ({ request, cookies }) => {
		const sessionId = cookies.get(lucia.sessionCookieName);
		const session = sessionId ? await validateUserAndGetDetails(sessionId) : null;

		if (!session?.user) {
			throw redirect(302, '/signin');
		}

		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();

		if (!name || name.length < 1 || name.length > 100) {
			return fail(400, { error: 'Token name is required (max 100 characters).' });
		}

		const apiPlan: ApiPlan = (session.user.apiPlan as ApiPlan) ?? 'api_free';
		const result = await createApiToken(session.user._id, name, apiPlan);

		if ('error' in result) {
			return fail(400, { error: result.error });
		}

		return { newToken: result.token, tokenName: name };
	},

	deleteToken: async ({ request, cookies }) => {
		const sessionId = cookies.get(lucia.sessionCookieName);
		const session = sessionId ? await validateUserAndGetDetails(sessionId) : null;

		if (!session?.user) {
			throw redirect(302, '/signin');
		}

		const formData = await request.formData();
		const tokenId = formData.get('tokenId') as string;

		if (!tokenId) {
			return fail(400, { error: 'Token ID is required.' });
		}

		const deleted = await deleteApiToken(session.user._id, tokenId);
		if (!deleted) {
			return fail(400, { error: 'Token not found or already deleted.' });
		}

		return { deleted: true };
	}
};
