import { createClient } from 'redis';

const { REDIS_URI: url } = process.env;

export const initRedis = async () => {
	const publisher = createClient({ url });
	const subscriber = createClient({ url });

	publisher.on('error', (err) => console.error('Publisher Error:', err));
	subscriber.on('error', (err) => console.error('Subscriber Error:', err));

	await Promise.all([publisher.connect(), subscriber.connect()]);

	return { publisher, subscriber };
};
