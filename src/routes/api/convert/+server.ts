import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE, type OutputFormat } from '$lib/formats';
import { checkConversionLimit, recordConversion, type Plan } from '$lib/server/usage';
import { submitConversionJob, waitForJobResult } from '$lib/server/jobs';
import { storeFile, retrieveFile, deleteFile } from '$lib/db/gridfs';
import mongoDbClient from '$lib/db/mongo';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Authentication required');

	const db = (await mongoDbClient).db();
	const userDoc = await db.collection('users').findOne({ _id: user.id as any });
	const plan: Plan = (userDoc?.plan as Plan) ?? 'free';

	const { allowed, reason } = await checkConversionLimit(user.id, plan);
	if (!allowed) {
		if (reason === 'free_limit_reached') {
			error(402, 'Free conversion limit reached. Upgrade to Pro for more conversions.');
		}
		error(429, 'Hourly conversion limit reached. Please try again later.');
	}

	const formData = await request.formData();

	const file = formData.get('file');
	const uploadId = formData.get('uploadId') as string | null;

	let inputBuffer: Buffer;
	let originalName: string;

	if (uploadId) {
		// Chunked upload flow: reassemble from upload_chunks
		const chunksCollection = db.collection('upload_chunks');
		const chunks = await chunksCollection
			.find({ uploadId, userId: user.id as any })
			.sort({ chunkIndex: 1 })
			.toArray();

		if (chunks.length === 0) {
			error(400, 'No chunks found for uploadId');
		}

		const totalChunks = chunks[0].totalChunks;
		if (chunks.length !== totalChunks) {
			error(400, `Incomplete upload: received ${chunks.length} of ${totalChunks} chunks`);
		}

		originalName = chunks[0].filename;
		const buffers = chunks.map((c) => Buffer.from(c.data.buffer));
		inputBuffer = Buffer.concat(buffers);

		// Clean up chunks
		await chunksCollection.deleteMany({ uploadId });
	} else if (file instanceof File && file.size > 0) {
		// Direct file upload flow
		if (file.size > MAX_FILE_SIZE) {
			error(400, `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
		}
		originalName = file.name;
		inputBuffer = Buffer.from(await file.arrayBuffer());
	} else {
		error(400, 'No file or uploadId provided');
	}

	if (inputBuffer.length > MAX_FILE_SIZE) {
		error(400, `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
	}

	const format = formData.get('format') as string;
	if (!format || !SUPPORTED_FORMATS.includes(format as OutputFormat)) {
		error(400, `Invalid format. Supported: ${SUPPORTED_FORMATS.join(', ')}`);
	}

	const qualityStr = formData.get('quality') as string | null;
	const quality = qualityStr ? parseInt(qualityStr, 10) : undefined;
	if (quality !== undefined && (isNaN(quality) || quality < 1 || quality > 100)) {
		error(400, 'Quality must be between 1 and 100');
	}

	const inputExtension = originalName.split('.').pop()?.toLowerCase() || 'png';

	try {

		// Store input file in GridFS
		const inputFileId = await storeFile(inputBuffer, {
			originalName,
			inputExtension,
			userId: user.id
		});

		// Submit job to Redis stream
		const jobId = await submitConversionJob({
			inputFileId,
			inputExtension,
			outputFormat: format,
			quality
		});

		// Wait for worker to finish (long-poll)
		const result = await waitForJobResult(jobId);

		if (!result.success) {
			error(500, `Conversion failed: ${result.error || 'Unknown error'}`);
		}

		// Retrieve output file from GridFS
		const outputBuffer = await retrieveFile(result.outputFileId!);

		// Clean up output file from GridFS
		await deleteFile(result.outputFileId!);

		await recordConversion(user.id, 'web');

		const baseName = originalName.replace(/\.[^.]+$/, '');
		const outputFilename = `${baseName}.${format}`;

		return new Response(new Uint8Array(outputBuffer), {
			headers: {
				'Content-Type': result.mimeType!,
				'Content-Disposition': `attachment; filename="${outputFilename}"`,
				'Content-Length': String(outputBuffer.length)
			}
		});
	} catch (err) {
		console.error('Conversion failed:', err);
		const message = err instanceof Error ? err.message : 'Unknown conversion error';
		error(500, `Conversion failed: ${message}`);
	}
};
