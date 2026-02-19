import type { OutputFormat } from '$lib/formats';

export type ConversionStatus = 'pending' | 'uploading' | 'converting' | 'done' | 'error';

export interface ConversionItem {
	id: string;
	filename: string;
	format: OutputFormat;
	quality: number | undefined;
	mode: 'browser' | 'server';
	status: ConversionStatus;
	progress: number;
	progressMessage: string | null;
	resultUrl: string | null;
	resultFilename: string | null;
	errorMessage: string | null;
	createdAt: number;
	completedAt: number | null;
}

export type ConversionNotificationPayload = {
	type: 'success' | 'error';
	filename: string;
	message: string;
};
