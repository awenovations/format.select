import { initRedis } from './db/redis';
import { processConversion, type ConversionMessage } from './processor';

const { WORKER_NAME } = process.env;

if (!WORKER_NAME) throw new Error('Please define a WORKER_NAME environment variable.');

const STREAM_KEY = 'image-converter';
const GROUP_NAME = 'workers';

let redis: Awaited<ReturnType<typeof initRedis>>;

(async () => {
	redis = await initRedis();

	// Create consumer group if it doesn't exist
	try {
		await redis.publisher.xGroupCreate(STREAM_KEY, GROUP_NAME, '0', { MKSTREAM: true });
		console.log(`Created consumer group '${GROUP_NAME}' on stream '${STREAM_KEY}'`);
	} catch (err: any) {
		if (!err.message?.includes('BUSYGROUP')) throw err;
	}

	console.log(`Worker '${WORKER_NAME}' started, listening on stream '${STREAM_KEY}'...`);

	const main = async () =>
		(async () => {
			const response = await redis.subscriber.xReadGroup(GROUP_NAME, WORKER_NAME, {
				key: STREAM_KEY,
				id: '>'
			});

			if (response) {
				for (const { messages } of response as Array<{
					name: string;
					messages: Array<{ id: string; message: Record<string, string> }>;
				}>) {
					const { id: messageId, message } = messages[0];
					const convMessage = message as unknown as ConversionMessage;

					console.log(`Processing job ${convMessage.jobId}...`);

					try {
						const result = await processConversion(convMessage);

						await redis.publisher.publish(
							`job:${convMessage.jobId}`,
							JSON.stringify({
								success: true,
								outputFileId: result.outputFileId,
								mimeType: result.mimeType
							})
						);

						console.log(`Job ${convMessage.jobId} completed successfully`);
					} catch (err: any) {
						console.error(`Job ${convMessage.jobId} failed:`, err);

						await redis.publisher.publish(
							`job:${convMessage.jobId}`,
							JSON.stringify({
								success: false,
								error: err.message || 'Unknown error'
							})
						);
					}

					await redis.subscriber.xAck(STREAM_KEY, GROUP_NAME, messageId);
				}
			}
		})().then(() => setTimeout(main, 300));

	main();
})();

process.on('SIGINT', async () => {
	console.log('Shutting down...');
	await redis.subscriber.close();
	await redis.publisher.close();
	process.exit(0);
});
