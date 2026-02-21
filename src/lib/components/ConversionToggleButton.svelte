<script lang="ts">
	import { Indicator } from 'flowbite-svelte';
	import { ClipboardListOutline } from 'flowbite-svelte-icons';
	import { conversionQueue } from '$lib/conversion/queue.svelte';

	let { onclick }: { onclick: () => void } = $props();
</script>

<button
	{onclick}
	onpointerdown={(e: PointerEvent) => e.stopPropagation()}
	class="relative text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
	title="Conversions"
>
	<ClipboardListOutline class="h-6 w-6" />
	{#if conversionQueue.items.length > 0}
		<Indicator color="blue" border size="xl" placement="top-right">
			<span class="text-xs font-bold text-white">{conversionQueue.items.length}</span>
		</Indicator>
	{/if}
</button>
