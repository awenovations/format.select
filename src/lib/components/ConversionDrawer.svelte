<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Button } from 'flowbite-svelte';
	import { CloseOutline } from 'flowbite-svelte-icons';
	import { conversionQueue } from '$lib/conversion/queue.svelte';
	import ConversionItem from './ConversionItem.svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let hasFinished = $derived(conversionQueue.completed.length > 0 || conversionQueue.failed.length > 0);

	let panel: HTMLDivElement | undefined = $state();

	function onWindowClick(e: PointerEvent) {
		if (open && panel && !panel.contains(e.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:window onpointerdown={onWindowClick} />

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={panel}
		transition:fly={{ x: 384, duration: 300 }}
		onpointerdown={(e: PointerEvent) => e.stopPropagation()}
		class="fixed top-[53px] right-0 bottom-0 z-40 flex w-96 flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
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
			<div class="px-4 pt-3">
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
