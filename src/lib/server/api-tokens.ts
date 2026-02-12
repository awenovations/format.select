import crypto from 'node:crypto';
import mongoDbClient from '$lib/db/mongo';
import { building } from '$app/environment';
import { API_PLAN_CONFIG, type ApiPlan } from './api-usage';

const TOKEN_PREFIX = 'ic_';
const TOKEN_BYTES = 32;

let collectionsReady = false;

async function getCollection() {
	const db = (await mongoDbClient).db();
	const apiTokens = db.collection('api_tokens');

	if (!collectionsReady && !building) {
		await apiTokens.createIndex({ tokenHash: 1 }, { unique: true });
		await apiTokens.createIndex({ userId: 1 });
		collectionsReady = true;
	}

	return apiTokens;
}

export function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateApiToken(): string {
	const bytes = crypto.randomBytes(TOKEN_BYTES);
	return TOKEN_PREFIX + bytes.toString('hex');
}

export async function createApiToken(
	userId: string,
	name: string,
	apiPlan: ApiPlan
): Promise<{ token: string; suffix: string } | { error: string }> {
	const apiTokens = await getCollection();

	const config = API_PLAN_CONFIG[apiPlan];
	const existingCount = await apiTokens.countDocuments({ userId });

	if (existingCount >= config.maxKeys) {
		return { error: `Token limit reached. Your ${config.label} plan allows ${config.maxKeys} API key${config.maxKeys === 1 ? '' : 's'}.` };
	}

	const token = generateApiToken();
	const tokenHash = hashToken(token);
	const tokenSuffix = token.slice(-4);

	await apiTokens.insertOne({
		userId,
		name,
		tokenHash,
		tokenSuffix,
		createdAt: new Date(),
		lastUsedAt: null
	});

	return { token, suffix: tokenSuffix };
}

export async function validateApiToken(
	token: string
): Promise<{ valid: true; userId: string } | { valid: false }> {
	if (!token.startsWith(TOKEN_PREFIX) || token.length !== TOKEN_PREFIX.length + TOKEN_BYTES * 2) {
		return { valid: false };
	}

	const apiTokens = await getCollection();
	const tokenHash = hashToken(token);

	const doc = await apiTokens.findOne({ tokenHash });
	if (!doc) return { valid: false };

	// Fire-and-forget lastUsedAt update
	apiTokens.updateOne({ _id: doc._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {});

	return { valid: true, userId: doc.userId };
}

export async function listApiTokens(userId: string) {
	const apiTokens = await getCollection();
	return apiTokens
		.find({ userId })
		.sort({ createdAt: -1 })
		.project({ _id: 1, name: 1, tokenSuffix: 1, createdAt: 1, lastUsedAt: 1 })
		.toArray();
}

export async function deleteApiToken(userId: string, tokenId: string): Promise<boolean> {
	const apiTokens = await getCollection();
	const { ObjectId } = await import('mongodb');

	let objectId;
	try {
		objectId = new ObjectId(tokenId);
	} catch {
		return false;
	}

	const result = await apiTokens.deleteOne({ _id: objectId, userId });
	return result.deletedCount > 0;
}
