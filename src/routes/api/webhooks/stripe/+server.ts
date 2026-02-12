import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { getStripe } from '$lib/server/stripe';
import { env } from '$env/dynamic/private';
import mongoDbClient from '$lib/db/mongo';

const API_PLAN_MAP: Record<string, string> = {
	api_developer: 'api_developer',
	api_business: 'api_business'
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		return new Response('Missing signature', { status: 400 });
	}

	let event: Stripe.Event;
	try {
		event = getStripe().webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET!);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		return new Response('Invalid signature', { status: 400 });
	}

	const db = (await mongoDbClient).db();
	const users = db.collection('users');

	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object as Stripe.Checkout.Session;
			const userId = session.metadata?.userId;
			const planType = session.metadata?.planType ?? 'web_pro';
			if (!userId) break;

			const userDoc = await users.findOne({ _id: userId as any });

			if (API_PLAN_MAP[planType]) {
				// API plan upgrade
				if (userDoc?.apiPlan === 'api_admin') break;

				await users.updateOne(
					{ _id: userId as any },
					{
						$set: {
							apiPlan: API_PLAN_MAP[planType],
							stripeCustomerId: session.customer as string,
							stripeApiSubscriptionId: session.subscription as string,
							apiSubscriptionStatus: 'active'
						}
					}
				);
			} else {
				// Web plan upgrade (existing behavior)
				if (userDoc?.plan === 'admin') break;

				await users.updateOne(
					{ _id: userId as any },
					{
						$set: {
							plan: 'pro',
							stripeCustomerId: session.customer as string,
							stripeSubscriptionId: session.subscription as string,
							subscriptionStatus: 'active'
						}
					}
				);
			}
			break;
		}

		case 'customer.subscription.updated': {
			const subscription = event.data.object as Stripe.Subscription;
			const status = subscription.status;

			// Try web subscription first
			let userDoc = await users.findOne({ stripeSubscriptionId: subscription.id });
			if (userDoc) {
				if (userDoc.plan === 'admin') break;

				if (['active', 'trialing', 'past_due'].includes(status)) {
					await users.updateOne(
						{ _id: userDoc._id },
						{ $set: { subscriptionStatus: status } }
					);
				} else if (['canceled', 'unpaid'].includes(status)) {
					await users.updateOne(
						{ _id: userDoc._id },
						{ $set: { plan: 'free', subscriptionStatus: status } }
					);
				}
				break;
			}

			// Try API subscription
			userDoc = await users.findOne({ stripeApiSubscriptionId: subscription.id });
			if (userDoc) {
				if (userDoc.apiPlan === 'api_admin') break;

				if (['active', 'trialing', 'past_due'].includes(status)) {
					await users.updateOne(
						{ _id: userDoc._id },
						{ $set: { apiSubscriptionStatus: status } }
					);
				} else if (['canceled', 'unpaid'].includes(status)) {
					await users.updateOne(
						{ _id: userDoc._id },
						{ $set: { apiPlan: 'api_free', apiSubscriptionStatus: status } }
					);
				}
			}
			break;
		}

		case 'customer.subscription.deleted': {
			const subscription = event.data.object as Stripe.Subscription;

			// Try web subscription first
			let userDoc = await users.findOne({ stripeSubscriptionId: subscription.id });
			if (userDoc) {
				if (userDoc.plan === 'admin') break;

				await users.updateOne(
					{ _id: userDoc._id },
					{
						$set: { plan: 'free', subscriptionStatus: 'canceled' },
						$unset: { stripeSubscriptionId: '' }
					}
				);
				break;
			}

			// Try API subscription
			userDoc = await users.findOne({ stripeApiSubscriptionId: subscription.id });
			if (userDoc) {
				if (userDoc.apiPlan === 'api_admin') break;

				await users.updateOne(
					{ _id: userDoc._id },
					{
						$set: { apiPlan: 'api_free', apiSubscriptionStatus: 'canceled' },
						$unset: { stripeApiSubscriptionId: '' }
					}
				);
			}
			break;
		}

		case 'invoice.payment_failed': {
			const invoice = event.data.object as Stripe.Invoice;
			const inv = invoice as any;
			const subscriptionId: string | null =
				inv.parent?.subscription_details?.subscription ??
				(typeof inv.subscription === 'string' ? inv.subscription : null);

			if (!subscriptionId) break;

			// Try web subscription
			let userDoc = await users.findOne({ stripeSubscriptionId: subscriptionId });
			if (userDoc) {
				if (userDoc.plan === 'admin') break;
				await users.updateOne(
					{ _id: userDoc._id },
					{ $set: { subscriptionStatus: 'past_due' } }
				);
				break;
			}

			// Try API subscription
			userDoc = await users.findOne({ stripeApiSubscriptionId: subscriptionId });
			if (userDoc) {
				if (userDoc.apiPlan === 'api_admin') break;
				await users.updateOne(
					{ _id: userDoc._id },
					{ $set: { apiSubscriptionStatus: 'past_due' } }
				);
			}
			break;
		}
	}

	return new Response('ok', { status: 200 });
};
