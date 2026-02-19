import { conversionQueue } from './queue.svelte';
import { notify } from './notifications';
import { ensureWasmReady, convertImageWasm } from '$lib/wasm-convert';
import { CHUNK_SIZE } from '$lib/formats';
import { invalidateAll } from '$app/navigation';
import type { OutputFormat } from '$lib/formats';
import type { ConversionItem } from './types';

interface StartConversionOptions {
	file: File;
	format: OutputFormat;
	quality: number | undefined;
	mode: 'browser' | 'server';
}

export function startConversion(opts: StartConversionOptions): string {
	const { file, format, quality, mode } = opts;

	const item: ConversionItem = {
		id: crypto.randomUUID(),
		filename: file.name,
		format,
		quality,
		mode,
		status: 'pending',
		progress: 0,
		progressMessage: 'Starting...',
		resultUrl: null,
		resultFilename: null,
		errorMessage: null,
		createdAt: Date.now(),
		completedAt: null
	};

	conversionQueue.add(item);

	if (mode === 'browser') {
		runBrowserConversion(item.id, file, format, quality);
	} else {
		runServerConversion(item.id, file, format, quality);
	}

	return item.id;
}

async function runBrowserConversion(
	id: string,
	file: File,
	format: OutputFormat,
	quality: number | undefined
): Promise<void> {
	try {
		conversionQueue.update(id, { status: 'converting', progressMessage: 'Checking limits...' });

		const authRes = await fetch('/api/convert/authorize', { method: 'POST' });
		if (authRes.status === 402) {
			conversionQueue.fail(id, 'Payment required. Please upgrade your plan.');
			notify({ type: 'error', filename: file.name, message: 'Payment required' });
			return;
		}
		if (authRes.status === 429) {
			conversionQueue.fail(id, 'Hourly conversion limit reached. Please try again later.');
			notify({ type: 'error', filename: file.name, message: 'Rate limit reached' });
			return;
		}
		if (!authRes.ok) {
			const errData = await authRes.json().catch(() => null);
			throw new Error(errData?.message ?? `Authorization failed: ${authRes.status}`);
		}
		const authData = await authRes.json();
		const conversionId = authData.conversionId;

		conversionQueue.update(id, { progressMessage: 'Loading converter...', progress: 10 });
		await ensureWasmReady();

		conversionQueue.update(id, { progressMessage: 'Converting...', progress: 30 });
		const result = await convertImageWasm({ file, format, quality });

		const resultUrl = URL.createObjectURL(result.blob);
		conversionQueue.complete(id, resultUrl, result.filename);

		await fetch('/api/convert/confirm', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ conversionId })
		});

		await invalidateAll();

		notify({ type: 'success', filename: file.name, message: 'Conversion complete' });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Conversion failed';
		conversionQueue.fail(id, message);
		notify({ type: 'error', filename: file.name, message });
	}
}

async function uploadChunks(id: string, file: File): Promise<string> {
	const uploadId = crypto.randomUUID();
	const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

	for (let i = 0; i < totalChunks; i++) {
		const start = i * CHUNK_SIZE;
		const end = Math.min(start + CHUNK_SIZE, file.size);
		const chunkBlob = file.slice(start, end);

		const formData = new FormData();
		formData.append('uploadId', uploadId);
		formData.append('chunkIndex', String(i));
		formData.append('totalChunks', String(totalChunks));
		formData.append('filename', file.name);
		formData.append('chunk', chunkBlob);

		const response = await fetch('/api/upload', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const errData = await response.json().catch(() => null);
			throw new Error(errData?.message ?? `Chunk upload failed: ${response.status}`);
		}

		const pct = Math.round(((i + 1) / totalChunks) * 100);
		conversionQueue.update(id, {
			status: 'uploading',
			progress: pct,
			progressMessage: `Uploading... ${pct}%`
		});
	}

	return uploadId;
}

async function runServerConversion(
	id: string,
	file: File,
	format: OutputFormat,
	quality: number | undefined
): Promise<void> {
	try {
		conversionQueue.update(id, { status: 'uploading', progressMessage: 'Uploading... 0%', progress: 0 });

		const uploadId = await uploadChunks(id, file);

		conversionQueue.update(id, { status: 'converting', progressMessage: 'Converting...', progress: 0 });

		const formData = new FormData();
		formData.append('uploadId', uploadId);
		formData.append('format', format);
		if (quality !== undefined) {
			formData.append('quality', String(quality));
		}

		const response = await fetch('/api/convert', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			if (response.status === 402) {
				conversionQueue.fail(id, 'Payment required. Please upgrade your plan.');
				notify({ type: 'error', filename: file.name, message: 'Payment required' });
				return;
			}
			if (response.status === 429) {
				conversionQueue.fail(id, 'Hourly conversion limit reached. Please try again later.');
				notify({ type: 'error', filename: file.name, message: 'Rate limit reached' });
				return;
			}
			const errData = await response.json().catch(() => null);
			throw new Error(errData?.message ?? `Server error: ${response.status}`);
		}

		const blob = await response.blob();
		const resultUrl = URL.createObjectURL(blob);
		const baseName = file.name.replace(/\.[^.]+$/, '');
		const resultFilename = `${baseName}.${format}`;

		conversionQueue.complete(id, resultUrl, resultFilename);

		await invalidateAll();

		notify({ type: 'success', filename: file.name, message: 'Conversion complete' });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Conversion failed';
		conversionQueue.fail(id, message);
		notify({ type: 'error', filename: file.name, message });
	}
}
