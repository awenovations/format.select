import mongoDbClient from '$lib/db/mongo';
import { building } from '$app/environment';

export const PLAN_CONFIG = {
	free: { limit: 5, period: 'day', label: 'Free' },
	pro: { limit: 100, period: 'hour', label: 'Pro' },
	admin: { limit: Infinity, period: 'unlimited', label: 'Admin' }
} as const;

export type Plan = keyof typeof PLAN_CONFIG;

let collectionsReady = false;

async function getCollections() {
	const db = (await mongoDbClient).db();
	const users = db.collection('users');
	const conversions = db.collection('conversions');

	if (!collectionsReady && !building) {
		await conversions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
		await conversions.createIndex({ userId: 1, createdAt: 1 });
		await conversions.createIndex({ userId: 1, source: 1, createdAt: 1 });
		collectionsReady = true;
	}

	return { users, conversions };
}

const WEB_SOURCE_FILTER = { $in: ['web', null] };

export async function checkConversionLimit(
	userId: string,
	plan: Plan
): Promise<{ allowed: boolean; reason?: string }> {
	if (plan === 'admin') return { allowed: true };

	const { conversions } = await getCollections();

	if (plan === 'free') {
		const oneDayAgo = new Date(Date.now() - 86_400_000);
		const count = await conversions.countDocuments({
			userId,
			source: WEB_SOURCE_FILTER,
			createdAt: { $gte: oneDayAgo }
		});
		if (count >= PLAN_CONFIG.free.limit) {
			return { allowed: false, reason: 'free_limit_reached' };
		}
		return { allowed: true };
	}

	if (plan === 'pro') {
		const oneHourAgo = new Date(Date.now() - 3_600_000);
		const count = await conversions.countDocuments({
			userId,
			source: WEB_SOURCE_FILTER,
			createdAt: { $gte: oneHourAgo }
		});
		if (count >= PLAN_CONFIG.pro.limit) {
			return { allowed: false, reason: 'rate_limit_exceeded' };
		}
		return { allowed: true };
	}

	return { allowed: true };
}

export async function recordConversion(userId: string, source: 'web' | 'api' = 'web'): Promise<void> {
	const { conversions } = await getCollections();
	await conversions.insertOne({ userId, source, createdAt: new Date() });
}

export async function getUsageInfo(userId: string, plan: Plan) {
	const config = PLAN_CONFIG[plan];

	if (plan === 'admin') {
		return { plan, used: 0, limit: Infinity, period: config.period, label: config.label };
	}

	const { conversions } = await getCollections();

	if (plan === 'free') {
		const oneDayAgo = new Date(Date.now() - 86_400_000);
		const used = await conversions.countDocuments({
			userId,
			source: WEB_SOURCE_FILTER,
			createdAt: { $gte: oneDayAgo }
		});
		return { plan, used, limit: config.limit, period: config.period, label: config.label };
	}

	// pro
	const oneHourAgo = new Date(Date.now() - 3_600_000);
	const used = await conversions.countDocuments({
		userId,
		source: WEB_SOURCE_FILTER,
		createdAt: { $gte: oneHourAgo }
	});
	return { plan, used, limit: config.limit, period: config.period, label: config.label };
}
