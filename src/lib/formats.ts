export const SUPPORTED_FORMATS = ['png', 'jpg', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'ico'] as const;
export type OutputFormat = (typeof SUPPORTED_FORMATS)[number];

export interface FormatOption {
	value: OutputFormat;
	name: string;
	supportsQuality: boolean;
	mimeType: string;
}

export const FORMAT_OPTIONS: FormatOption[] = [
	{ value: 'png', name: 'PNG', supportsQuality: true, mimeType: 'image/png' },
	{ value: 'jpg', name: 'JPG', supportsQuality: true, mimeType: 'image/jpeg' },
	{ value: 'webp', name: 'WebP', supportsQuality: true, mimeType: 'image/webp' },
	{ value: 'gif', name: 'GIF', supportsQuality: false, mimeType: 'image/gif' },
	{ value: 'bmp', name: 'BMP', supportsQuality: false, mimeType: 'image/bmp' },
	{ value: 'tiff', name: 'TIFF', supportsQuality: true, mimeType: 'image/tiff' },
	{ value: 'avif', name: 'AVIF', supportsQuality: true, mimeType: 'image/avif' },
	{ value: 'ico', name: 'ICO', supportsQuality: false, mimeType: 'image/x-icon' }
];

export const ACCEPTED_INPUT_TYPES =
	'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/svg+xml,image/x-icon';

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
