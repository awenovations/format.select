import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { lucia, validEmail, validPassword } from '$lib/server/auth';
import { authenticateWithKeycloak, validateAndReturnUser } from '$lib/server/keycloak';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

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

		const response = await authenticateWithKeycloak(email, password);

		if (!response.ok) {
			console.error('Keycloak auth failed:', response.status, await response.text());
			return fail(400, {
				message: 'Incorrect username or password'
			});
		}

		const tokenFromResponse = await response.json();

		const existingUserResponse = await validateAndReturnUser(tokenFromResponse.access_token);

		if (!existingUserResponse.ok) {
			console.error('Keycloak user validation failed:', existingUserResponse.status, await existingUserResponse.text());
			return fail(500, {
				message: 'Something unexpected occurred, try again later.'
			});
		}

		const existingUser = await existingUserResponse.json();

		if (!existingUser.sub) {
			console.error('Keycloak user missing sub:', existingUser);
			return fail(500, {
				message: 'Something unexpected occurred, try again later.'
			});
		}

		const { expires_in, refresh_expires_in, ...tokenForUse } = tokenFromResponse;

		const expires_at = Date.now() + expires_in * 1000;
		const refresh_expires_at = Date.now() + refresh_expires_in * 1000;

		const token = {
			...tokenForUse,
			expires_at,
			refresh_expires_at
		};

		const session = await lucia.createSession(existingUser.sub, { token });
		const sessionCookie = lucia.createSessionCookie(session.id);

		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		redirect(302, '/');
	}
};
