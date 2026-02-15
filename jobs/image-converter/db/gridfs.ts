import { GridFSBucket, ObjectId } from 'mongodb';
import mongoDbClient from './mongo';

const BUCKET_NAME = 'conversion_files';
const TTL_SECONDS = 86400; // 24 hours
let ttlIndexEnsured = false;

async function getBucket(): Promise<GridFSBucket> {
	const client = await mongoDbClient;
	const db = client.db();

	if (!ttlIndexEnsured) {
		ttlIndexEnsured = true;
		const filesCol = db.collection(`${BUCKET_NAME}.files`);
		try {
			await filesCol.createIndex({ uploadDate: 1 }, { expireAfterSeconds: TTL_SECONDS });
		} catch (err: any) {
			if (err.codeName === 'IndexOptionsConflict') {
				await filesCol.dropIndex('uploadDate_1');
				await filesCol.createIndex({ uploadDate: 1 }, { expireAfterSeconds: TTL_SECONDS });
			}
		}
	}

	return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

export async function storeFile(
	buffer: Buffer,
	metadata?: Record<string, unknown>
): Promise<string> {
	const bucket = await getBucket();
	const uploadStream = bucket.openUploadStream('file', { metadata });

	return new Promise((resolve, reject) => {
		uploadStream.on('finish', () => resolve(uploadStream.id.toHexString()));
		uploadStream.on('error', reject);
		uploadStream.end(buffer);
	});
}

export async function retrieveFile(fileId: string): Promise<Buffer> {
	const bucket = await getBucket();
	const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		downloadStream.on('data', (chunk) => chunks.push(chunk));
		downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
		downloadStream.on('error', reject);
	});
}

export async function deleteFile(fileId: string): Promise<void> {
	const bucket = await getBucket();
	await bucket.delete(new ObjectId(fileId));
}
