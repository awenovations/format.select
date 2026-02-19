<script lang="ts">
	import { Badge, Button, Progressbar, Spinner } from 'flowbite-svelte';
	import { CheckCircleOutline, ExclamationCircleOutline, CloseOutline, DownloadOutline } from 'flowbite-svelte-icons';
	import type { ConversionItem } from '$lib/conversion/types';

	let { item, onremove }: { item: ConversionItem; onremove: (id: string) => void } = $props();

	let isActive = $derived(
		item.status === 'pending' || item.status === 'uploading' || item.status === 'converting'
	);
</script>

<div class="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
	<div class="mt-0.5 shrink-0">
		{#if isActive}
			<Spinner size="5" color="blue" />
		{:else if item.status === 'done'}
			<CheckCircleOutline class="h-5 w-5 text-green-500" />
		{:else}
			<ExclamationCircleOutline class="h-5 w-5 text-red-500" />
		{/if}
	</div>

	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<span class="truncate text-sm font-medium text-gray-900 dark:text-white" title={item.filename}>
				{item.filename}
			</span>
			<Badge color="blue" class="shrink-0">{item.format.toUpperCase()}</Badge>
		</div>

		{#if isActive && item.progress > 0}
			<div class="mt-2">
				<Progressbar progress={String(item.progress)} size="h-1.5" color="blue" />
			</div>
		{/if}

		{#if item.progressMessage}
			<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.progressMessage}</p>
		{/if}

		{#if item.errorMessage}
			<p class="mt-1 text-xs text-red-600 dark:text-red-400">{item.errorMessage}</p>
		{/if}

		{#if item.status === 'done' && item.resultUrl}
			<div class="mt-2">
				<Button
					href={item.resultUrl}
					download={item.resultFilename}
					size="xs"
					color="green"
				>
					<DownloadOutline class="me-1 h-3.5 w-3.5" />
					Download
				</Button>
			</div>
		{/if}
	</div>

	<button
		onclick={() => onremove(item.id)}
		class="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
		title="Dismiss"
	>
		<CloseOutline class="h-4 w-4" />
	</button>
</div>
