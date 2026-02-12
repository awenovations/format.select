import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { convertImage } from '$lib/convert';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE, type OutputFormat } from '$lib/formats';
import { checkConversionLimit, recordConversion, type Plan } from '$lib/server/usage';
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
	if (!(file instanceof File) || file.size === 0) {
		error(400, 'No file uploaded');
	}

	if (file.size > MAX_FILE_SIZE) {
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

	const originalName = file.name;
	const inputExtension = originalName.split('.').pop()?.toLowerCase() || 'png';

	try {
		const inputBuffer = Buffer.from(await file.arrayBuffer());

		const result = await convertImage({
			inputBuffer,
			inputExtension,
			outputFormat: format as OutputFormat,
			quality
		});

		await recordConversion(user.id, 'web');

		const baseName = originalName.replace(/\.[^.]+$/, '');
		const outputFilename = `${baseName}.${format}`;

		return new Response(new Uint8Array(result.data), {
			headers: {
				'Content-Type': result.mimeType,
				'Content-Disposition': `attachment; filename="${outputFilename}"`,
				'Content-Length': String(result.data.length)
			}
		});
	} catch (err) {
		console.error('Conversion failed:', err);
		const message = err instanceof Error ? err.message : 'Unknown conversion error';
		error(500, `Conversion failed: ${message}`);
	}
};
