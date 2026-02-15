<script lang="ts">
	import {
		RocketOutline,
		LockOutline,
		GlobeOutline,
		ImageOutline,
		ArrowRightOutline,
		CloudArrowUpOutline
	} from 'flowbite-svelte-icons';

	interface Props {
		session?: { user: { name: string; email: string } } | null;
	}

	let { session = null }: Props = $props();

	const features = [
		{
			icon: RocketOutline,
			title: 'Lightning Fast',
			description: 'Convert your images in seconds with our optimized processing engine.'
		},
		{
			icon: LockOutline,
			title: 'Secure & Private',
			description: 'Your files are processed securely and automatically deleted after conversion.'
		},
		{
			icon: GlobeOutline,
			title: 'Works Everywhere',
			description: 'Convert images from any device, any browser. No installation needed.'
		},
		{
			icon: ImageOutline,
			title: 'Multiple Formats',
			description: '8 output formats supported including PNG, WebP, AVIF, and more.'
		}
	];

	const supportedFormats = {
		icon: ImageOutline,
		name: 'Images',
		formats: ['PNG', 'JPG', 'WebP', 'GIF', 'BMP', 'TIFF', 'AVIF', 'ICO']
	};
</script>

<!-- Hero -->
<section class="bg-white px-6 py-24 dark:bg-gray-900 sm:py-32 lg:py-40">
	<div class="mx-auto max-w-7xl">
		<div class="mx-auto max-w-3xl text-center">
			<h1 class="mb-6 text-5xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
				format<span class="text-blue-600">.select</span>
			</h1>
			<p class="mb-4 text-xl font-medium text-gray-600 dark:text-gray-300 sm:text-2xl">
				Image conversion, made simple
			</p>
			<p class="mx-auto mb-10 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
				Fast, secure, and free image format conversion. Convert between PNG, JPG, WebP, AVIF, and more with just a few clicks.
			</p>
			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				{#if session}
					<a href="/app" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-blue-700">
						<CloudArrowUpOutline class="h-5 w-5" />
						Go to App
						<ArrowRightOutline class="h-5 w-5" />
					</a>
				{:else}
					<a href="/signup" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-blue-700">
						<CloudArrowUpOutline class="h-5 w-5" />
						Sign Up Free
						<ArrowRightOutline class="h-5 w-5" />
					</a>
				{/if}
				<a href="#formats" class="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 px-8 py-4 text-lg font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800">
					View Supported Formats
				</a>
			</div>
		</div>
	</div>
</section>

<!-- Features -->
<section class="bg-gray-50 px-6 py-24 dark:bg-gray-800">
	<div class="mx-auto max-w-7xl">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
				Why choose format<span class="text-blue-600">.select</span>?
			</h2>
			<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
				Simple, fast image conversion right in your browser
			</p>
		</div>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
			{#each features as feature}
				<div class="rounded-xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-700">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
						<feature.icon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 class="mb-2 text-xl font-medium text-gray-900 dark:text-white">{feature.title}</h3>
					<p class="text-gray-600 dark:text-gray-400">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Supported Formats -->
<section id="formats" class="bg-white px-6 py-24 dark:bg-gray-900">
	<div class="mx-auto max-w-7xl">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
				Supported formats
			</h2>
			<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
				Convert between all major image formats
			</p>
		</div>
		<div class="mx-auto max-w-lg">
			<div class="rounded-xl border border-gray-200 p-6 hover:border-blue-600 dark:border-gray-700 dark:hover:border-blue-500">
				<div class="mb-4 flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900">
						<supportedFormats.icon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 class="text-xl font-medium text-gray-900 dark:text-white">{supportedFormats.name}</h3>
				</div>
				<div class="flex flex-wrap gap-2">
					{#each supportedFormats.formats as format}
						<span class="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300">{format}</span>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<!-- CTA -->
<section class="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-24 text-white">
	<div class="mx-auto max-w-7xl text-center">
		<h2 class="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
			Ready to convert your images?
		</h2>
		<p class="mx-auto mb-10 max-w-2xl text-xl text-blue-100">
			Create a free account and start converting in seconds
		</p>
		{#if session}
			<a href="/app" class="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-medium text-blue-600 transition-colors hover:bg-gray-100 dark:bg-gray-100 dark:hover:bg-white">
				Go to App
				<ArrowRightOutline class="h-5 w-5" />
			</a>
		{:else}
			<a href="/signup" class="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-medium text-blue-600 transition-colors hover:bg-gray-100 dark:bg-gray-100 dark:hover:bg-white">
				Create Free Account
				<ArrowRightOutline class="h-5 w-5" />
			</a>
		{/if}
		<p class="mt-6 text-sm text-blue-100">
			Free forever plan &middot; All image formats &middot; Upgrade anytime
		</p>
	</div>
</section>
