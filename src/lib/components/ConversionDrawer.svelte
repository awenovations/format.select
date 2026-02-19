<script lang="ts">
	import { Drawer, Drawerhead, Button } from 'flowbite-svelte';
	import { conversionQueue } from '$lib/conversion/queue.svelte';
	import ConversionItem from './ConversionItem.svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let hasFinished = $derived(conversionQueue.completed.length > 0 || conversionQueue.failed.length > 0);
</script>

<Drawer placement="right" class="w-96" bind:open>
	<Drawerhead>
		<h5 class="inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400">
			Conversions
			{#if conversionQueue.activeCount > 0}
				<span class="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
					{conversionQueue.activeCount}
				</span>
			{/if}
		</h5>
	</Drawerhead>

	{#if hasFinished}
		<div class="mb-4 px-4">
			<Button size="xs" color="alternative" onclick={() => conversionQueue.clearFinished()}>
				Clear finished
			</Button>
		</div>
	{/if}

	<div class="flex flex-col gap-3 px-4 pb-4">
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
</Drawer>
