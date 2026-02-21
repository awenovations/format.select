import { browser } from '$app/environment';
import type { ConversionItem } from './types';

const STORAGE_KEY = 'conversion-history';
const DB_NAME = 'image-converter';
const BLOB_STORE = 'blobs';
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function isExpired(item: ConversionItem): boolean {
	return Date.now() - (item.completedAt ?? item.createdAt) > EXPIRY_MS;
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(BLOB_STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export function saveMetadata(items: ConversionItem[]): void {
	if (!browser) return;
	const toSave = items
		.filter((i) => i.status === 'done' || i.status === 'error')
		.map((i) => ({ ...i, resultUrl: null }));
	localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export async function saveBlob(id: string, blob: Blob): Promise<void> {
	if (!browser) return;
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(BLOB_STORE, 'readwrite');
		tx.objectStore(BLOB_STORE).put(blob, id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

async function getBlob(db: IDBDatabase, id: string): Promise<Blob | undefined> {
	return new Promise((resolve) => {
		const req = db.transaction(BLOB_STORE).objectStore(BLOB_STORE).get(id);
		req.onsuccess = () => resolve(req.result as Blob | undefined);
		req.onerror = () => resolve(undefined);
	});
}

export async function loadItems(): Promise<ConversionItem[]> {
	if (!browser) return [];
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return [];

	let metadata: ConversionItem[] = [];
	try {
		metadata = JSON.parse(raw);
	} catch {
		return [];
	}

	const valid = metadata.filter((i) => !isExpired(i));
	if (valid.length !== metadata.length) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
	}

	const db = await openDB();
	return Promise.all(
		valid.map(async (item) => {
			if (item.status === 'done' && item.resultFilename) {
				const blob = await getBlob(db, item.id);
				if (blob) return { ...item, resultUrl: URL.createObjectURL(blob) };
			}
			return item;
		})
	);
}

export async function removeItems(ids: string[]): Promise<void> {
	if (!browser || ids.length === 0) return;
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw) {
		const items: ConversionItem[] = JSON.parse(raw);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items.filter((i) => !ids.includes(i.id))));
	}
	const db = await openDB();
	await Promise.all(
		ids.map(
			(id) =>
				new Promise<void>((resolve) => {
					const tx = db.transaction(BLOB_STORE, 'readwrite');
					tx.objectStore(BLOB_STORE).delete(id);
					tx.oncomplete = () => resolve();
					tx.onerror = () => resolve();
				})
		)
	);
}
