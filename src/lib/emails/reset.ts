import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { v4 as uuidv4 } from 'uuid';
import mongoDbClient from '$lib/db/mongo';
import { env } from '$env/dynamic/private';
import { resetEmailTemplate } from './reset-email-template';

const MAILGUN_API_KEY = env.MAILGUN_API_KEY!;
const MAILGUN_DOMAIN = env.MAILGUN_DOMAIN!;

export const sendReset = async (to: string, host: string) => {
	const db = (await mongoDbClient).db();

	const passwordResetCollection = db.collection('passwordResets');

	passwordResetCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

	const usersCollection = db.collection('users');

	const user = await usersCollection.findOne({ email: to });

	if (!user) return;

	const _id = uuidv4() as any;

	const expiresAt = new Date();
	expiresAt.setSeconds(expiresAt.getSeconds() + 14400);

	await passwordResetCollection.insertOne({
		_id,
		email: to,
		expiresAt
	});

	const url = `${host}/pwd-reset/${_id}`;

	const subject = 'Did you just ask for a password reset?';
	const text = `Go here to reset your password: ${host}/pwd-reset/${_id}`;
	const html = resetEmailTemplate.replace(/{{name}}/, user.name).replace(/{{reset_url}}/, url);

	const mailgun = new Mailgun(FormData);

	const mg = mailgun.client({
		username: 'api',
		key: MAILGUN_API_KEY
	});

	try {
		await mg.messages.create(MAILGUN_DOMAIN, {
			from: `Format.Select <reset@${MAILGUN_DOMAIN}>`,
			to: [to],
			subject,
			text,
			html
		});
	} catch (error) {
		console.log(error);
	}
};
