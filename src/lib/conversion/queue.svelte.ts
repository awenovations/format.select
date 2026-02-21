import { browser } from '$app/environment';
import type { ConversionItem, ConversionStatus } from './types';
import { saveMetadata, saveBlob, loadItems, removeItems } from './persistence';

class ConversionQueue {
	items: ConversionItem[] = $state([]);
	#onAdd: (() => void) | null = null;

	constructor() {
		if (browser) {
			loadItems().then((persisted) => {
				this.items = [...persisted, ...this.items];
			});
		}
	}

	registerOnAdd(fn: () => void): void {
		this.#onAdd = fn;
	}

	get active(): ConversionItem[] {
		return this.items.filter(
			(i) => i.status === 'pending' || i.status === 'uploading' || i.status === 'converting'
		);
	}

	get activeCount(): number {
		return this.active.length;
	}

	get completed(): ConversionItem[] {
		return this.items.filter((i) => i.status === 'done');
	}

	get failed(): ConversionItem[] {
		return this.items.filter((i) => i.status === 'error');
	}

	get hasItems(): boolean {
		return this.items.length > 0;
	}

	add(item: ConversionItem): void {
		this.items = [item, ...this.items];
		this.#onAdd?.();
	}

	update(id: string, changes: Partial<Pick<ConversionItem, 'status' | 'progress' | 'progressMessage'>>): void {
		this.items = this.items.map((item) =>
			item.id === id ? { ...item, ...changes } : item
		);
	}

	complete(id: string, resultUrl: string, resultFilename: string): void {
		this.items = this.items.map((item) =>
			item.id === id
				? {
						...item,
						status: 'done' as ConversionStatus,
						progress: 100,
						progressMessage: null,
						resultUrl,
						resultFilename,
						completedAt: Date.now()
					}
				: item
		);
		fetch(resultUrl)
			.then((r) => r.blob())
			.then((blob) => {
				saveBlob(id, blob);
				saveMetadata(this.items);
			});
	}

	fail(id: string, errorMessage: string): void {
		this.items = this.items.map((item) =>
			item.id === id
				? {
						...item,
						status: 'error' as ConversionStatus,
						progressMessage: null,
						errorMessage,
						completedAt: Date.now()
					}
				: item
		);
		saveMetadata(this.items);
	}

	remove(id: string): void {
		const item = this.items.find((i) => i.id === id);
		if (item?.resultUrl) {
			URL.revokeObjectURL(item.resultUrl);
		}
		this.items = this.items.filter((i) => i.id !== id);
		removeItems([id]);
	}

	clearFinished(): void {
		const finished = this.items.filter((i) => i.status === 'done' || i.status === 'error');
		const finishedIds = finished.map((i) => i.id);
		for (const item of finished) {
			if (item.resultUrl) {
				URL.revokeObjectURL(item.resultUrl);
			}
		}
		this.items = this.items.filter((i) => i.status !== 'done' && i.status !== 'error');
		removeItems(finishedIds);
	}
}

export const conversionQueue = new ConversionQueue();
