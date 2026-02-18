import { initializeImageMagick, ImageMagick, MagickFormat, MagickGeometry } from '@imagemagick/magick-wasm';
import wasmUrl from '@imagemagick/magick-wasm/magick.wasm?url';
import { MAGICK_FORMAT_MAP, FORMAT_OPTIONS, type OutputFormat } from '$lib/formats';

let initPromise: Promise<void> | null = null;

export async function ensureWasmReady(): Promise<void> {
	if (!initPromise) {
		initPromise = initializeImageMagick(new URL(wasmUrl, import.meta.url)).catch((err) => {
			initPromise = null;
			throw err;
		});
	}
	return initPromise;
}

interface ConvertResult {
	blob: Blob;
	mimeType: string;
	filename: string;
}

interface ConvertOptions {
	file: File;
	format: OutputFormat;
	quality?: number;
}

export async function convertImageWasm(opts: ConvertOptions): Promise<ConvertResult> {
	const { file, format, quality } = opts;

	const arrayBuffer = await file.arrayBuffer();
	const inputData = new Uint8Array(arrayBuffer);
	const magickFormat = MagickFormat[MAGICK_FORMAT_MAP[format] as keyof typeof MagickFormat];

	const outputData = ImageMagick.read(inputData, (image) => {
		if (format === 'ico') {
			const geo = new MagickGeometry(256, 256);
			geo.greater = true;
			image.resize(geo);
		}

		if (quality !== undefined) {
			image.quality = quality;
		}

		return image.write(magickFormat, (data) => new Uint8Array(data));
	});

	const formatInfo = FORMAT_OPTIONS.find((f) => f.value === format);
	const mimeType = formatInfo?.mimeType ?? 'application/octet-stream';
	const blob = new Blob([outputData], { type: mimeType });
	const baseName = file.name.replace(/\.[^.]+$/, '');
	const filename = `${baseName}.${format}`;

	return { blob, mimeType, filename };
}
