import { Collection } from 'mongodb';
import { Lucia, TimeSpan } from 'lucia';
import mongoDbClient from '$lib/db/mongo';
import { building, dev } from '$app/environment';
import { refreshToken } from '$lib/server/keycloak';
import { MongodbAdapter } from '@lucia-auth/adapter-mongodb';
import { signOutUserFromKeycloak, getTokenWithClientCredentials } from '$lib/server/keycloak';

interface UserDoc {
	_id: string;
	email: string;
	name: string;
	authProvider: string;
	createdDate: number;
	lastUpdateDate?: number;
	plan?: string;
	conversionCount?: number;
	stripeCustomerId?: string;
	stripeSubscriptionId?: string;
	subscriptionStatus?: string;
	apiPlan?: 'api_free' | 'api_developer' | 'api_business' | 'api_admin';
	stripeApiSubscriptionId?: string;
	apiSubscriptionStatus?: string;
}

interface SessionDoc {
	_id: string;
	expires_at: Date;
	user_id: string;
}

// Validation helpers
export const validEmail = (email: string) =>
	typeof email === 'string' && /^[\w-\.\+]+@([\w-]+\.)+[\w-]{2,5}$/.test(email);

export const validPassword = (password: string) =>
	typeof password === 'string' && password.length >= 6 && password.length <= 255;

const db = building ? { collection: () => {} } : (await mongoDbClient).db();
const User = db.collection('users') as Collection<UserDoc>;
const Session = db.collection('sessions') as Collection<SessionDoc>;

const adapter = new MongodbAdapter(Session as any, User as any);

adapter.updateSessionExpiration = async function (sessionId: string, expiresAt: Date) {
	const [session] = await this.getSessionAndUser(sessionId);

	let updateToSession: Record<string, any> = {
		expires_at: expiresAt
	};

	if (session?.attributes?.token?.refresh_token) {
		const refreshResponse = await refreshToken(session.attributes.token.refresh_token);

		const token = await refreshResponse.json();

		const { expires_in, refresh_expires_in, ...tokenForUse } = token;

		const expires_at = Date.now() + expires_in * 1000;
		const refresh_expires_at = Date.now() + refresh_expires_in * 1000;

		updateToSession = {
			...updateToSession,
			token: {
				...tokenForUse,
				expires_at,
				refresh_expires_at
			}
		};
	}

	await (this as any).Session.findOneAndUpdate(
		{ _id: sessionId },
		{
			$set: updateToSession
		}
	);
};

export const lucia = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(1, 'd'),
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => ({
		email: attributes.email,
		name: attributes.name
	})
});

export const validateUserAndGetDetails = async (sessionId: string) => {
	let { session } = await lucia.validateSession(sessionId);

	if (!session) {
		return null;
	}

	const user = await User.findOne({ _id: session.userId });

	if (!user) {
		return null;
	}

	return {
		session,
		user
	};
};

export const signOut = async (sessionId: string) => {
	const { session } = await lucia.validateSession(sessionId);

	if (session) {
		await lucia.invalidateSession(session.id);

		const adminTokenResponse = await getTokenWithClientCredentials();

		if (!adminTokenResponse.ok) {
			throw new Error('Cannot generate admin token');
		}

		const { access_token } = await adminTokenResponse.json();

		await signOutUserFromKeycloak(session.userId, access_token);
	}
};

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
		DatabaseSessionAttributes: DatabaseSessionAttributes;
	}
}

interface DatabaseUserAttributes {
	email: string;
	name: string;
}

interface DatabaseSessionAttributes {
	token: {
		access_token: string;
		expires_at: number;
		refresh_expires_at: number;
		refresh_token: string;
		token_type: string;
		id_token: string;
		'not-before-policy': number;
		session_state: string;
		scope: string;
	};
}
