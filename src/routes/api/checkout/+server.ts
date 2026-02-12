import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStripe } from '$lib/server/stripe';
import { env } from '$env/dynamic/private';
import mongoDbClient from '$lib/db/mongo';

const PRICE_MAP: Record<string, () => string> = {
	web_pro: () => env.STRIPE_PRICE_ID!,
	api_developer: () => env.STRIPE_API_DEVELOPER_PRICE_ID!,
	api_business: () => env.STRIPE_API_BUSINESS_PRICE_ID!
};

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const user = locals.user;
	if (!user) error(401, 'Authentication required');

	const db = (await mongoDbClient).db();
	const users = db.collection('users');
	const userDoc = await users.findOne({ _id: user.id as any });

	if (!userDoc) error(404, 'User not found');

	const body = await request.json().catch(() => ({}));
	const planType: string = body.plan ?? 'web_pro';

	if (!PRICE_MAP[planType]) {
		error(400, `Invalid plan: ${planType}`);
	}

	let customerId = userDoc.stripeCustomerId;

	if (!customerId) {
		const customer = await getStripe().customers.create({
			email: userDoc.email,
			metadata: { userId: user.id }
		});
		customerId = customer.id;
		await users.updateOne({ _id: user.id as any }, { $set: { stripeCustomerId: customerId } });
	}

	const isApiPlan = planType.startsWith('api_');
	const successUrl = isApiPlan
		? `${url.origin}/settings?upgraded=true`
		: `${url.origin}/?upgraded=true`;

	const session = await getStripe().checkout.sessions.create({
		mode: 'subscription',
		customer: customerId,
		line_items: [{ price: PRICE_MAP[planType](), quantity: 1 }],
		success_url: successUrl,
		cancel_url: `${url.origin}/paywall`,
		metadata: { userId: user.id, planType }
	});

	return json({ url: session.url });
};
