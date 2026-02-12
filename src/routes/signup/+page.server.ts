import mongoDbClient from '$lib/db/mongo';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';
import {
	authenticateWithKeycloak,
	createUser,
	findUser,
	getTokenWithClientCredentials,
	updateUser,
	validateAndReturnUser
} from '$lib/server/keycloak';
import { lucia, validEmail, validPassword } from '$lib/server/auth';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const firstName = formData.get('name');
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (typeof firstName !== 'string') {
			return fail(400, {
				message: 'Invalid name'
			});
		}

		if (!validEmail(email)) {
			return fail(400, {
				message: 'Invalid email'
			});
		}

		if (!validPassword(password)) {
			return fail(400, {
				message: 'Invalid password'
			});
		}

		const existingUser = await (await mongoDbClient).db().collection('users').findOne({ email });

		if (existingUser) {
			return fail(400, {
				message: 'User already exists.'
			});
		}

		const tokenRequest = await getTokenWithClientCredentials();

		if (!tokenRequest.ok) {
			console.error('Failed to get admin token:', tokenRequest.status, tokenRequest.statusText);
			return fail(500, {
				message: 'Something unexpected occurred, try again later.'
			});
		}

		const token = await tokenRequest.json();

		const createUserResponse = await createUser(token.access_token, firstName, email, password);

		if (!createUserResponse.ok) {
			console.error('Failed to create user in Keycloak:', createUserResponse.status, await createUserResponse.text());
			return fail(500, {
				message: 'Something unexpected occurred, try again later.'
			});
		}

		const user = await findUser(token.access_token, email);

		const userObject = (await user.json())?.[0];

		// Clear any realm-level default required actions (e.g. Verify Email)
		await updateUser(userObject.id, token.access_token, {
			emailVerified: true,
			requiredActions: []
		});

		await (await mongoDbClient).db().collection('users').insertOne({
			_id: userObject.id,
			email,
			name: firstName,
			authProvider: 'image-converter',
			createdDate: Date.now(),
			lastUpdateDate: Date.now(),
			plan: 'free',
			conversionCount: 0
		});

		const authResponse = await authenticateWithKeycloak(email, password);

		if (!authResponse.ok) {
			return redirect(302, '/signin');
		}

		const tokenFromResponse = await authResponse.json();
		const keycloakUserResponse = await validateAndReturnUser(tokenFromResponse.access_token);
		const keycloakUser = await keycloakUserResponse.json();

		const { expires_in, refresh_expires_in, ...tokenForUse } = tokenFromResponse;

		const expires_at = Date.now() + expires_in * 1000;
		const refresh_expires_at = Date.now() + refresh_expires_in * 1000;

		const sessionToken = {
			...tokenForUse,
			expires_at,
			refresh_expires_at
		};

		const session = await lucia.createSession(keycloakUser.sub, { token: sessionToken });
		const sessionCookie = lucia.createSessionCookie(session.id);

		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		redirect(302, '/');
	}
};
