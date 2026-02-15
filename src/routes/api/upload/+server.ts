import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CHUNK_SIZE } from '$lib/formats';
import mongoDbClient from '$lib/db/mongo';
import { Binary } from 'mongodb';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Authentication required');

	const formData = await request.formData();

	const uploadId = formData.get('uploadId') as string;
	const chunkIndexStr = formData.get('chunkIndex') as string;
	const totalChunksStr = formData.get('totalChunks') as string;
	const filename = formData.get('filename') as string;
	const chunk = formData.get('chunk');

	if (!uploadId || chunkIndexStr == null || !totalChunksStr || !filename) {
		error(400, 'Missing required fields: uploadId, chunkIndex, totalChunks, filename');
	}

	const chunkIndex = parseInt(chunkIndexStr, 10);
	const totalChunks = parseInt(totalChunksStr, 10);

	if (isNaN(chunkIndex) || isNaN(totalChunks) || chunkIndex < 0 || chunkIndex >= totalChunks) {
		error(400, 'Invalid chunkIndex or totalChunks');
	}

	if (!(chunk instanceof File) || chunk.size === 0) {
		error(400, 'Missing or empty chunk data');
	}

	if (chunk.size > CHUNK_SIZE + 1024) {
		error(400, 'Chunk exceeds maximum chunk size');
	}

	const db = (await mongoDbClient).db();
	const collection = db.collection('upload_chunks');

	// Ensure TTL index exists
	try {
		await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
	} catch (err: any) {
		if (err.codeName === 'IndexOptionsConflict') {
			await collection.dropIndex('createdAt_1');
			await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
		}
	}

	const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

	await collection.updateOne(
		{ uploadId, chunkIndex },
		{
			$set: {
				uploadId,
				chunkIndex,
				totalChunks,
				filename,
				userId: user.id,
				data: new Binary(chunkBuffer),
				createdAt: new Date()
			}
		},
		{ upsert: true }
	);

	const chunksReceived = await collection.countDocuments({ uploadId });

	return json({ success: true, chunksReceived });
};
