import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, readFile, unlink, rmdir, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FORMAT_OPTIONS, type OutputFormat } from './formats.js';

const execFileAsync = promisify(execFile);

async function findMagickBinary(): Promise<string> {
	for (const bin of ['magick', 'convert']) {
		try {
			await execFileAsync(bin, ['--version']);
			return bin;
		} catch {
			continue;
		}
	}
	throw new Error('ImageMagick is not installed or not found in PATH');
}

export interface ConvertOptions {
	inputBuffer: Buffer;
	inputExtension: string;
	outputFormat: OutputFormat;
	quality?: number;
}

export interface ConvertResult {
	data: Buffer;
	mimeType: string;
}

export async function convertImage(opts: ConvertOptions): Promise<ConvertResult> {
	const { inputBuffer, inputExtension, outputFormat, quality } = opts;

	const tmpDir = await mkdtemp(join(tmpdir(), 'imgconv-'));
	const inputPath = join(tmpDir, `input.${inputExtension}`);
	const outputPath = join(tmpDir, `output.${outputFormat}`);

	try {
		await writeFile(inputPath, inputBuffer);

		const binary = await findMagickBinary();
		const args: string[] = [];

		if (binary === 'magick') {
			args.push('convert');
		}

		args.push(inputPath);

		if (quality !== undefined && quality >= 1 && quality <= 100) {
			args.push('-quality', String(quality));
		}

		if (outputFormat === 'ico') {
			args.push('-resize', '256x256>');
		}

		args.push(outputPath);

		await execFileAsync(binary, args, { timeout: 30_000 });

		const data = await readFile(outputPath);
		const formatInfo = FORMAT_OPTIONS.find((f) => f.value === outputFormat);
		const mimeType = formatInfo?.mimeType ?? 'application/octet-stream';

		return { data, mimeType };
	} finally {
		await unlink(inputPath).catch(() => {});
		await unlink(outputPath).catch(() => {});
		await rmdir(tmpDir).catch(() => {});
	}
}
