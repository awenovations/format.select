import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

let _stripe: Stripe;
export function getStripe() {
	if (!_stripe) {
		_stripe = new Stripe(env.STRIPE_SECRET_KEY!);
	}
	return _stripe;
}
