import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStripe } from '$lib/server/stripe';
import mongoDbClient from '$lib/db/mongo';

export const POST: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;
	if (!user) error(401, 'Authentication required');

	const db = (await mongoDbClient).db();
	const users = db.collection('users');
	const userDoc = await users.findOne({ _id: user.id as any });

	if (!userDoc?.stripeCustomerId) {
		error(400, 'No billing account found');
	}

	const session = await getStripe().billingPortal.sessions.create({
		customer: userDoc.stripeCustomerId,
		return_url: `${url.origin}/paywall`
	});

	return json({ url: session.url });
};
