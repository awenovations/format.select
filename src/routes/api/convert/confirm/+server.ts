import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUsageInfo, type Plan } from '$lib/server/usage';
import mongoDbClient from '$lib/db/mongo';
import { ObjectId } from 'mongodb';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Authentication required');

	const body = await request.json();
	const { conversionId } = body;

	if (!conversionId || typeof conversionId !== 'string') {
		error(400, 'Missing conversionId');
	}

	let objectId: ObjectId;
	try {
		objectId = new ObjectId(conversionId);
	} catch {
		error(400, 'Invalid conversionId');
	}

	const db = (await mongoDbClient).db();
	const conversions = db.collection('conversions');

	const result = await conversions.updateOne(
		{ _id: objectId, userId: user.id, pendingExpiresAt: { $exists: true } },
		{ $unset: { pendingExpiresAt: '' } }
	);

	if (result.modifiedCount === 0) {
		error(400, 'Conversion not found, already confirmed, or expired');
	}

	const userDoc = await db.collection('users').findOne({ _id: user.id as any });
	const plan: Plan = (userDoc?.plan as Plan) ?? 'free';
	const usage = await getUsageInfo(user.id, plan);

	return json({ usage });
};
