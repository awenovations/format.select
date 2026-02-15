import { v4 as uuidv4 } from 'uuid';
import { initRedis } from '$lib/db/redis';

const STREAM_KEY = 'image-converter';
const GROUP_NAME = 'workers';

let redis: Awaited<ReturnType<typeof initRedis>> | null = null;

async function getRedis() {
	if (!redis) {
		redis = await initRedis();

		// Create consumer group if it doesn't exist
		try {
			await redis.publisher.xGroupCreate(STREAM_KEY, GROUP_NAME, '0', { MKSTREAM: true });
		} catch (err: any) {
			// BUSYGROUP = group already exists, which is fine
			if (!err.message?.includes('BUSYGROUP')) throw err;
		}
	}
	return redis;
}

export interface ConversionJobData {
	inputFileId: string;
	inputExtension: string;
	outputFormat: string;
	quality?: number;
}

export async function submitConversionJob(data: ConversionJobData): Promise<string> {
	const { publisher } = await getRedis();
	const jobId = uuidv4();

	await publisher.xAdd(STREAM_KEY, '*', {
		jobId,
		inputFileId: data.inputFileId,
		inputExtension: data.inputExtension,
		outputFormat: data.outputFormat,
		quality: data.quality !== undefined ? String(data.quality) : ''
	});

	return jobId;
}

export interface JobResult {
	success: boolean;
	outputFileId?: string;
	mimeType?: string;
	error?: string;
}

export async function waitForJobResult(jobId: string, timeoutMs = 1_200_000): Promise<JobResult> {
	const { subscriber } = await getRedis();
	const channel = `job:${jobId}`;

	return new Promise<JobResult>((resolve, reject) => {
		const timeout = setTimeout(() => {
			subscriber.unsubscribe(channel).catch(() => {});
			reject(new Error('Conversion timed out'));
		}, timeoutMs);

		subscriber.subscribe(channel, (message) => {
			clearTimeout(timeout);
			subscriber.unsubscribe(channel).catch(() => {});
			resolve(JSON.parse(message) as JobResult);
		});
	});
}
