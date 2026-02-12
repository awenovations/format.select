import type { RequestHandler } from './$types';
import { authenticateApiRequest } from '$lib/server/api-auth';
import { API_PLAN_CONFIG, type ApiPlan, checkApiConversionLimit, recordApiConversion, getApiUsageInfo } from '$lib/server/api-usage';
import { convertImage } from '$lib/convert';
import { SUPPORTED_FORMATS, FORMAT_OPTIONS, type OutputFormat } from '$lib/formats';

function jsonError(message: string, status: number, extra?: Record<string, any>) {
	return new Response(JSON.stringify({ error: message, ...extra }), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

export const GET: RequestHandler = async ({ request }) => {
	const auth = await authenticateApiRequest(request);
	if (!auth.authenticated) {
		return jsonError(auth.error, auth.status);
	}

	const apiPlan: ApiPlan = auth.user.apiPlan ?? 'api_free';
	const usage = await getApiUsageInfo(auth.userId, apiPlan);

	return new Response(JSON.stringify({
		plan: usage.plan,
		label: usage.label,
		usage: {
			used: usage.used,
			limit: usage.limit,
			remaining: usage.remaining,
			period: usage.period
		},
		maxFileSize: usage.maxFileSize,
		formats: SUPPORTED_FORMATS
	}), {
		headers: { 'Content-Type': 'application/json' }
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const auth = await authenticateApiRequest(request);
	if (!auth.authenticated) {
		return jsonError(auth.error, auth.status);
	}

	const apiPlan: ApiPlan = auth.user.apiPlan ?? 'api_free';
	const planConfig = API_PLAN_CONFIG[apiPlan];

	const { allowed, remaining, limit, resetAt } = await checkApiConversionLimit(auth.userId, apiPlan);
	if (!allowed) {
		return jsonError('Daily API conversion limit reached', 429, {
			limit,
			resetAt: resetAt.toISOString()
		});
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return jsonError('Invalid request body. Expected multipart/form-data with file, format, and optional quality fields.', 400);
	}

	const file = formData.get('file');
	if (!(file instanceof File) || file.size === 0) {
		return jsonError('Missing or empty file. Send a file field in multipart/form-data.', 400);
	}

	if (file.size > planConfig.maxFileSize) {
		const maxMB = planConfig.maxFileSize / (1024 * 1024);
		return jsonError(`File too large. Your ${planConfig.label} plan allows up to ${maxMB}MB.`, 413, {
			maxFileSize: planConfig.maxFileSize,
			fileSize: file.size
		});
	}

	const format = formData.get('format') as string;
	if (!format || !SUPPORTED_FORMATS.includes(format as OutputFormat)) {
		return jsonError(`Invalid or missing format. Supported: ${SUPPORTED_FORMATS.join(', ')}`, 400);
	}

	const qualityStr = formData.get('quality') as string | null;
	const quality = qualityStr ? parseInt(qualityStr, 10) : undefined;
	if (quality !== undefined && (isNaN(quality) || quality < 1 || quality > 100)) {
		return jsonError('Quality must be between 1 and 100', 400);
	}

	const originalName = file.name || 'input';
	const inputExtension = originalName.split('.').pop()?.toLowerCase() || 'png';

	try {
		const inputBuffer = Buffer.from(await file.arrayBuffer());

		const result = await convertImage({
			inputBuffer,
			inputExtension,
			outputFormat: format as OutputFormat,
			quality
		});

		await recordApiConversion(auth.userId);

		const newRemaining = remaining - 1;
		const baseName = originalName.replace(/\.[^.]+$/, '');
		const outputFilename = `${baseName}.${format}`;

		return new Response(new Uint8Array(result.data), {
			headers: {
				'Content-Type': result.mimeType,
				'Content-Disposition': `attachment; filename="${outputFilename}"`,
				'Content-Length': String(result.data.length),
				'X-RateLimit-Limit': String(limit),
				'X-RateLimit-Remaining': String(Math.max(0, newRemaining)),
				'X-RateLimit-Reset': resetAt.toISOString()
			}
		});
	} catch (err) {
		console.error('API conversion failed:', err);
		const message = err instanceof Error ? err.message : 'Unknown conversion error';
		return jsonError(`Conversion failed: ${message}`, 500);
	}
};
