<script lang="ts">
	import { Button, Card, Select, Label, Fileupload, Alert, Range, A, Radio } from 'flowbite-svelte';
	import { CloudArrowUpOutline, LockOutline, ShieldCheckOutline } from 'flowbite-svelte-icons';
	import { FORMAT_OPTIONS, ACCEPTED_INPUT_TYPES, type OutputFormat } from '$lib/formats';
	import { startConversion } from '$lib/conversion/runner';

	let { data } = $props();

	let files: FileList | null = $state(null);
	let selectedFormat: OutputFormat = $state('webp');
	let quality: number = $state(85);
	let errorMessage: string | null = $state(null);
	let dragging: number = $state(0);
	let conversionMode: 'browser' | 'server' = $state('browser');

	let selectedFiles: File[] = $derived(files ? Array.from(files) : []);
	let selectedFormatInfo = $derived(FORMAT_OPTIONS.find((f) => f.value === selectedFormat));
	let showQuality = $derived(selectedFormatInfo?.supportsQuality ?? false);
	let usage = $derived(data.usage);
	let isLimitReached = $derived(
		usage && usage.plan !== 'admin' && usage.used >= usage.limit
	);
	let canConvert = $derived(selectedFiles.length > 0 && !isLimitReached);

	const ACCEPTED_MIMES = ACCEPTED_INPUT_TYPES.split(',');

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		dragging++;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragging--;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = 0;

		const droppedFiles = e.dataTransfer?.files;
		if (!droppedFiles?.length) return;

		const valid = Array.from(droppedFiles).filter(f => ACCEPTED_MIMES.includes(f.type));
		if (!valid.length) {
			errorMessage = 'No supported image files found. Please drop image files.';
			return;
		}

		const dt = new DataTransfer();
		valid.forEach(f => dt.items.add(f));
		files = dt.files;
		errorMessage = null;
	}

	function handleConvert() {
		if (!selectedFiles.length) return;
		for (const file of selectedFiles) {
			startConversion({
				file,
				format: selectedFormat,
				quality: showQuality ? quality : undefined,
				mode: conversionMode
			});
		}
		files = null;
		errorMessage = null;
	}
</script>

<svelte:document
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondragover={handleDragOver}
	ondrop={handleDrop}
/>

{#if dragging > 0}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm">
		<div class="rounded-2xl border-4 border-dashed border-blue-500 bg-white/90 px-16 py-12 dark:bg-gray-800/90">
			<CloudArrowUpOutline class="mx-auto mb-4 h-16 w-16 text-blue-500" />
			<p class="text-xl font-semibold text-gray-900 dark:text-white">Drop image here</p>
		</div>
	</div>
{/if}

<div class="flex flex-1 items-start justify-center px-4 pt-16">
	<div class="w-full max-w-xl">
		<h1 class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
			format<span class="text-blue-600">.select</span>
		</h1>

		<Card size="xl" class="p-6">
			{#if usage && usage.plan !== 'admin'}
				{#if isLimitReached}
					<Alert color="red" class="mb-4">
						{#if usage.plan === 'free'}
							You've used all {usage.limit} free conversions today.
							<A href="/paywall" class="font-semibold text-red-800 underline hover:text-red-900 dark:text-red-200 dark:hover:text-red-100">Upgrade to continue</A>
						{:else}
							Hourly limit of {usage.limit} conversions reached. Please try again later.
						{/if}
					</Alert>
				{:else}
					<Alert color={usage.plan === 'pro' ? 'blue' : 'gray'} class="mb-4">
						{#if usage.plan === 'free'}
							Free Plan: {usage.used}/{usage.limit} conversions today
						{:else}
							Pro: {usage.used}/{usage.limit} this hour
						{/if}
					</Alert>
				{/if}
			{/if}

			<div class="mb-6">
				<Label for="file-upload" class="mb-2">Choose an image file</Label>
				<Fileupload id="file-upload" bind:files accept={ACCEPTED_INPUT_TYPES} multiple />
				{#if selectedFiles.length === 1}
					<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
						Selected: {selectedFiles[0].name} ({(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB)
					</p>
				{:else if selectedFiles.length > 1}
					<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
						{selectedFiles.length} files selected
						({(selectedFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(2)} MB total)
					</p>
				{/if}
			</div>

			{#if selectedFiles.some(f => f.size >= 5 * 1024 * 1024)}
				<Alert color="yellow" class="mb-4">
					Large files may take a while to convert.
				</Alert>
			{/if}

			<div class="mb-6">
				<Label for="format-select" class="mb-2">Output format</Label>
				<Select id="format-select" bind:value={selectedFormat} items={FORMAT_OPTIONS} />
			</div>

			{#if showQuality}
				<div class="mb-6">
					<Label for="quality-range" class="mb-2">Quality: {quality}</Label>
					<Range id="quality-range" bind:value={quality} min={1} max={100} />
				</div>
			{/if}

			<div class="mb-6">
				<Label class="mb-2">Conversion mode</Label>
				<div class="flex flex-col gap-2">
					<Radio name="conversionMode" value="browser" bind:group={conversionMode}>
						<span class="flex items-center gap-1.5">
							<LockOutline class="h-4 w-4 text-green-600 dark:text-green-400" />
							Private (in browser)
						</span>
						<span class="ms-6 block text-xs text-gray-500 dark:text-gray-400">
							Files never leave your device
						</span>
					</Radio>
					<Radio name="conversionMode" value="server" bind:group={conversionMode}>
						<span class="flex items-center gap-1.5">
							<CloudArrowUpOutline class="h-4 w-4 text-blue-600 dark:text-blue-400" />
							Cloud (server)
						</span>
						<span class="ms-6 block text-xs text-gray-500 dark:text-gray-400">
							Uploaded to server for processing
						</span>
					</Radio>
				</div>
			</div>

			<Button
				color="blue"
				class="w-full"
				disabled={!canConvert}
				onclick={handleConvert}
			>
				{#if conversionMode === 'browser'}
					<ShieldCheckOutline class="me-2 h-5 w-5" />
					Convert Privately
				{:else}
					<CloudArrowUpOutline class="me-2 h-5 w-5" />
					Convert via Cloud
				{/if}
			</Button>

			{#if errorMessage}
				<Alert color="red" class="mt-4" dismissable>
					{errorMessage}
				</Alert>
			{/if}
		</Card>
	</div>
</div>
