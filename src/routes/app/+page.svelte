<script lang="ts">
	import { Button, Card, Select, Label, Fileupload, Alert, Range, A } from 'flowbite-svelte';
	import { CloudArrowUpOutline, DownloadOutline } from 'flowbite-svelte-icons';
	import { FORMAT_OPTIONS, ACCEPTED_INPUT_TYPES, CHUNK_SIZE, type OutputFormat } from '$lib/formats';
	import { invalidateAll } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { io, type Socket } from 'socket.io-client';

	let { data } = $props();

	let files: FileList | null = $state(null);
	let selectedFormat: OutputFormat = $state('webp');
	let quality: number = $state(85);
	let converting: boolean = $state(false);
	let errorMessage: string | null = $state(null);
	let downloadUrl: string | null = $state(null);
	let downloadFilename: string = $state('');
	let dragging: number = $state(0);
	let progressMessage: string | null = $state(null);

	let socket: Socket | null = null;

	let selectedFile: File | null = $derived(files?.[0] ?? null);
	let selectedFormatInfo = $derived(FORMAT_OPTIONS.find((f) => f.value === selectedFormat));
	let showQuality = $derived(selectedFormatInfo?.supportsQuality ?? false);
	let canConvert = $derived(selectedFile !== null && !converting);
	let usage = $derived(data.usage);
	let isLimitReached = $derived(
		usage && usage.plan !== 'admin' && usage.used >= usage.limit
	);

	const ACCEPTED_MIMES = ACCEPTED_INPUT_TYPES.split(',');

	onMount(() => {
		if (data.session) {
			socket = io({ path: '/events/' });
			socket.emit('register', data.session.user.email);

			socket.on('conversion-progress', (event: { status: string; message?: string }) => {
				progressMessage = event.message || event.status;
			});
		}
	});

	onDestroy(() => {
		if (socket) {
			socket.disconnect();
			socket = null;
		}
	});

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

		const file = droppedFiles[0];
		if (!ACCEPTED_MIMES.includes(file.type)) {
			errorMessage = 'Unsupported file type. Please drop an image file.';
			return;
		}

		const dt = new DataTransfer();
		dt.items.add(file);
		files = dt.files;
		errorMessage = null;
	}

	async function uploadChunks(file: File): Promise<string> {
		const uploadId = crypto.randomUUID();
		const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

		for (let i = 0; i < totalChunks; i++) {
			const start = i * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunkBlob = file.slice(start, end);

			const formData = new FormData();
			formData.append('uploadId', uploadId);
			formData.append('chunkIndex', String(i));
			formData.append('totalChunks', String(totalChunks));
			formData.append('filename', file.name);
			formData.append('chunk', chunkBlob);

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errData = await response.json().catch(() => null);
				throw new Error(errData?.message ?? `Chunk upload failed: ${response.status}`);
			}

			const pct = Math.round(((i + 1) / totalChunks) * 100);
			progressMessage = `Uploading... ${pct}%`;
		}

		return uploadId;
	}

	async function handleConvert() {
		if (!selectedFile) return;

		if (downloadUrl) {
			URL.revokeObjectURL(downloadUrl);
			downloadUrl = null;
		}

		converting = true;
		errorMessage = null;
		progressMessage = 'Uploading... 0%';

		try {
			const uploadId = await uploadChunks(selectedFile);

			progressMessage = 'Converting...';

			const formData = new FormData();
			formData.append('uploadId', uploadId);
			formData.append('format', selectedFormat);
			if (showQuality) {
				formData.append('quality', String(quality));
			}

			const response = await fetch('/api/convert', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				if (response.status === 402) {
					window.location.href = '/paywall';
					return;
				}
				if (response.status === 429) {
					errorMessage = 'Hourly conversion limit reached. Please try again later.';
					return;
				}
				const errData = await response.json().catch(() => null);
				throw new Error(errData?.message ?? `Server error: ${response.status}`);
			}

			const blob = await response.blob();
			downloadUrl = URL.createObjectURL(blob);

			const baseName = selectedFile.name.replace(/\.[^.]+$/, '');
			downloadFilename = `${baseName}.${selectedFormat}`;

			await invalidateAll();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Conversion failed';
		} finally {
			converting = false;
			progressMessage = null;
		}
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
				<Fileupload id="file-upload" bind:files accept={ACCEPTED_INPUT_TYPES} />
				{#if files?.[0]}
					<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
						Selected: {files[0].name} ({(files[0].size / 1024 / 1024).toFixed(2)} MB)
					</p>
				{/if}
			</div>

			{#if files?.[0] && files[0].size >= 5 * 1024 * 1024}
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

			<Button
				color="blue"
				class="mb-4 w-full"
				disabled={!canConvert}
				loading={converting}
				onclick={handleConvert}
			>
				{#if !converting}
					<CloudArrowUpOutline class="me-2 h-5 w-5" />
				{/if}
				{converting ? (progressMessage?.startsWith('Uploading') ? 'Uploading...' : 'Converting...') : 'Convert'}
			</Button>

			{#if progressMessage && converting}
				<Alert color="blue" class="mb-4">
					{progressMessage}
				</Alert>
			{/if}

			{#if errorMessage}
				<Alert color="red" class="mb-4" dismissable>
					{errorMessage}
				</Alert>
			{/if}

			{#if downloadUrl}
				<Button href={downloadUrl} download={downloadFilename} color="green" class="w-full">
					<DownloadOutline class="me-2 h-5 w-5" />
					Download {downloadFilename}
				</Button>
			{/if}
		</Card>
	</div>
</div>
