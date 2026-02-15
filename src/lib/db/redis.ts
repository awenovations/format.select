import { createClient } from 'redis';
import { env } from '$env/dynamic/private';

export const initRedis = async () => {
	const publisher = createClient({ url: env.REDIS_URI });
	const subscriber = createClient({ url: env.REDIS_URI });

	publisher.on('error', (err) => console.error('Redis Publisher Error:', err));
	subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

	await Promise.all([publisher.connect(), subscriber.connect()]);

	const quit = async () => {
		await Promise.all([publisher.quit(), subscriber.quit()]);
	};

	return { publisher, subscriber, quit };
};
