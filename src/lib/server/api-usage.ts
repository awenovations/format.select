import mongoDbClient from '$lib/db/mongo';
import { building } from '$app/environment';

export const API_PLAN_CONFIG = {
	api_free: { limit: 50, period: 'day', maxFileSize: 10 * 1024 * 1024, maxKeys: 1, label: 'Free', price: 0 },
	api_developer: { limit: 500, period: 'day', maxFileSize: 25 * 1024 * 1024, maxKeys: 3, label: 'Developer', price: 9 },
	api_business: { limit: 5000, period: 'day', maxFileSize: 50 * 1024 * 1024, maxKeys: 10, label: 'Business', price: 29 },
	api_admin: { limit: Infinity, period: 'unlimited', maxFileSize: 50 * 1024 * 1024, maxKeys: Infinity, label: 'Admin', price: 0 }
} as const;

export type ApiPlan = keyof typeof API_PLAN_CONFIG;

let collectionsReady = false;

async function getConversions() {
	const db = (await mongoDbClient).db();
	const conversions = db.collection('conversions');

	if (!collectionsReady && !building) {
		await conversions.createIndex({ userId: 1, source: 1, createdAt: 1 });
		collectionsReady = true;
	}

	return conversions;
}

export async function checkApiConversionLimit(
	userId: string,
	apiPlan: ApiPlan
): Promise<{ allowed: boolean; remaining: number; limit: number; resetAt: Date }> {
	const config = API_PLAN_CONFIG[apiPlan];

	if (apiPlan === 'api_admin') {
		return { allowed: true, remaining: Infinity, limit: Infinity, resetAt: new Date() };
	}

	const conversions = await getConversions();
	const oneDayAgo = new Date(Date.now() - 86_400_000);

	const count = await conversions.countDocuments({
		userId,
		source: 'api',
		createdAt: { $gte: oneDayAgo }
	});

	const remaining = Math.max(0, config.limit - count);
	const resetAt = new Date(Date.now() + 86_400_000);

	if (count >= config.limit) {
		return { allowed: false, remaining: 0, limit: config.limit, resetAt };
	}

	return { allowed: true, remaining, limit: config.limit, resetAt };
}

export async function recordApiConversion(userId: string): Promise<void> {
	const conversions = await getConversions();
	await conversions.insertOne({ userId, source: 'api', createdAt: new Date() });
}

export async function getApiUsageInfo(userId: string, apiPlan: ApiPlan) {
	const config = API_PLAN_CONFIG[apiPlan];

	if (apiPlan === 'api_admin') {
		return {
			plan: apiPlan,
			used: 0,
			limit: Infinity,
			remaining: Infinity,
			period: config.period,
			label: config.label,
			maxFileSize: config.maxFileSize,
			maxKeys: config.maxKeys
		};
	}

	const conversions = await getConversions();
	const oneDayAgo = new Date(Date.now() - 86_400_000);

	const used = await conversions.countDocuments({
		userId,
		source: 'api',
		createdAt: { $gte: oneDayAgo }
	});

	return {
		plan: apiPlan,
		used,
		limit: config.limit,
		remaining: Math.max(0, config.limit - used),
		period: config.period,
		label: config.label,
		maxFileSize: config.maxFileSize,
		maxKeys: config.maxKeys
	};
}
