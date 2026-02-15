import { retrieveFile, storeFile, deleteFile } from './db/gridfs';
import { convertImage } from './convert';
import type { OutputFormat } from './formats';

export interface ConversionMessage {
	jobId: string;
	inputFileId: string;
	inputExtension: string;
	outputFormat: string;
	quality: string;
}

export interface ConversionResult {
	outputFileId: string;
	mimeType: string;
}

export async function processConversion(message: ConversionMessage): Promise<ConversionResult> {
	const inputBuffer = await retrieveFile(message.inputFileId);

	const quality = message.quality ? parseInt(message.quality, 10) : undefined;

	const result = await convertImage({
		inputBuffer,
		inputExtension: message.inputExtension,
		outputFormat: message.outputFormat as OutputFormat,
		quality: quality && !isNaN(quality) ? quality : undefined
	});

	// Clean up input file from GridFS
	await deleteFile(message.inputFileId);

	// Store output file in GridFS
	const outputFileId = await storeFile(result.data, {
		mimeType: result.mimeType,
		jobId: message.jobId
	});

	return {
		outputFileId,
		mimeType: result.mimeType
	};
}
