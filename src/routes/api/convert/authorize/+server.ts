import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkConversionLimit, type Plan } from '$lib/server/usage';
import mongoDbClient from '$lib/db/mongo';

export const POST: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Authentication required');

	const db = (await mongoDbClient).db();
	const userDoc = await db.collection('users').findOne({ _id: user.id as any });
	const plan: Plan = (userDoc?.plan as Plan) ?? 'free';

	const { allowed, reason } = await checkConversionLimit(user.id, plan);
	if (!allowed) {
		if (reason === 'free_limit_reached') {
			error(402, 'Free conversion limit reached. Upgrade to Pro for more conversions.');
		}
		error(429, 'Hourly conversion limit reached. Please try again later.');
	}

	const conversions = db.collection('conversions');
	const result = await conversions.insertOne({
		userId: user.id,
		source: 'web',
		createdAt: new Date(),
		pendingExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
	});

	return json({ conversionId: result.insertedId.toString() });
};
