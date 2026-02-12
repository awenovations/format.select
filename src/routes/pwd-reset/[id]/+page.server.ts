import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import mongoDbClient from '$lib/db/mongo';
import type { PageServerLoad } from './$types';
import { changePassword, getTokenWithClientCredentials } from '$lib/server/keycloak';

export const load: PageServerLoad = async ({ params }) => {
	const client = (await mongoDbClient).db();

	const passwordResetsCollection = client.collection('passwordResets');

	const reset = await passwordResetsCollection.findOne({ _id: params.id as any });

	if (!reset) {
		throw redirect(302, '/signin');
	}

	const usersCollection = client.collection('users');

	const user = await usersCollection.findOne({ email: reset.email });

	if (!user) {
		throw redirect(302, '/signin');
	}

	if (user.authProvider !== 'image-converter') {
		await passwordResetsCollection.deleteOne({ _id: params.id as any });
	}

	return {
		authProvider: user.authProvider
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const formData = (await request.formData()) as any;

		const newPassword = formData.get('newPassword');
		const confirmPassword = formData.get('confirmPassword');

		if (!newPassword || !confirmPassword) {
			return new Response(
				JSON.stringify({
					message: 'Bad request'
				}),
				{ status: 400 }
			);
		}

		if (newPassword !== confirmPassword) {
			return new Response(
				JSON.stringify({
					message: 'The new password and confirmation password do not match.'
				}),
				{ status: 422 }
			);
		}

		const client = (await mongoDbClient).db();

		const passwordResetsCollection = client.collection('passwordResets');

		const reset = await passwordResetsCollection.findOne({ _id: params.id as any });

		if (!reset) {
			return new Response(
				JSON.stringify({
					message: 'Bad request'
				}),
				{ status: 400 }
			);
		}

		const usersCollection = client.collection('users');

		const user = await usersCollection.findOne({ email: reset.email });

		if (!user) {
			return new Response(
				JSON.stringify({
					message: 'Forbidden'
				}),
				{ status: 403 }
			);
		}

		const adminTokenResponse = await getTokenWithClientCredentials();

		if (!adminTokenResponse.ok) {
			return new Response(
				JSON.stringify({
					message: 'Forbidden'
				}),
				{ status: 403 }
			);
		}

		const { access_token } = await adminTokenResponse.json();

		const changePasswordResponse = await changePassword(
			user._id as any,
			access_token,
			formData.get('newPassword')
		);

		if (changePasswordResponse.ok) {
			await passwordResetsCollection.deleteOne({ _id: params.id as any });
		}

		if (!changePasswordResponse.ok) {
			return new Response(changePasswordResponse.statusText, {
				status: changePasswordResponse.status
			});
		}
	}
};
