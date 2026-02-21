<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Button } from 'flowbite-svelte';
	import { CloseOutline, DownloadOutline } from 'flowbite-svelte-icons';
	import { conversionQueue } from '$lib/conversion/queue.svelte';
	import ConversionItem from './ConversionItem.svelte';
	import JSZip from 'jszip';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let hasFinished = $derived(conversionQueue.completed.length > 0 || conversionQueue.failed.length > 0);

	let completedWithUrl = $derived(
		conversionQueue.completed.filter(item => item.resultUrl && item.resultFilename)
	);
	let canDownloadZip = $derived(completedWithUrl.length >= 2);

	let panel: HTMLDivElement | undefined = $state();

	function slideFromRight(node: HTMLElement, _opts?: unknown) {
		return fly(node, { x: node.offsetWidth, duration: 300 });
	}

	function onWindowClick(e: PointerEvent) {
		if (open && panel && !panel.contains(e.target as Node)) {
			open = false;
		}
	}

	async function downloadAllAsZip() {
		const zip = new JSZip();

		const seen = new Map<string, number>();
		for (const item of completedWithUrl) {
			const base = item.resultFilename!;
			const count = seen.get(base) ?? 0;
			seen.set(base, count + 1);
			const name = count === 0 ? base : `${base.replace(/(\.[^.]+)$/, '')} (${count})${base.match(/(\.[^.]+)$/)?.[1] ?? ''}`;

			const blob = await fetch(item.resultUrl!).then(r => r.blob());
			zip.file(name, blob);
		}

		const zipBlob = await zip.generateAsync({ type: 'blob' });
		const url = URL.createObjectURL(zipBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'conversions.zip';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:window onpointerdown={onWindowClick} />

{#if open}
	<div class="fixed inset-0 z-30 bg-black/40 md:hidden" aria-hidden="true"></div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={panel}
		transition:slideFromRight
		onpointerdown={(e: PointerEvent) => e.stopPropagation()}
		class="fixed top-[53px] right-0 bottom-0 z-40 flex w-full flex-col border-l border-gray-200 bg-white shadow-xl md:w-96 dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
			<h5 class="inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400">
				Conversions
				{#if conversionQueue.activeCount > 0}
					<span class="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
						{conversionQueue.activeCount}
					</span>
				{/if}
			</h5>
			<button
				onclick={() => open = false}
				class="inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
			>
				<CloseOutline class="h-5 w-5" />
			</button>
		</div>

		{#if hasFinished}
			<div class="flex items-center gap-2 px-4 pt-3">
				{#if canDownloadZip}
					<Button size="xs" color="blue" onclick={downloadAllAsZip}>
						<DownloadOutline class="me-1 h-3 w-3" />
						Download All ({completedWithUrl.length})
					</Button>
				{/if}
				<Button size="xs" color="alternative" onclick={() => conversionQueue.clearFinished()}>
					Clear finished
				</Button>
			</div>
		{/if}

		<div class="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
			{#if conversionQueue.hasItems}
				{#each conversionQueue.items as item (item.id)}
					<ConversionItem {item} onremove={(id) => conversionQueue.remove(id)} />
				{/each}
			{:else}
				<p class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
					No conversions yet. Convert a file to see it here.
				</p>
			{/if}
		</div>
	</div>
{/if}
