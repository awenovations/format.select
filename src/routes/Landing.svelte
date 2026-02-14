<script lang="ts">
	import {
		RocketOutline,
		LockOutline,
		GlobeOutline,
		ServerOutline,
		ArrowRightOutline,
		CloudArrowUpOutline,
		FileLinesOutline,
		ImageOutline,
		VideoCameraOutline,
		VolumeUpOutline,
		ArchiveOutline,
		FileOutline
	} from 'flowbite-svelte-icons';

	const features = [
		{
			icon: RocketOutline,
			title: 'Lightning Fast',
			description: 'Convert your files in seconds with our optimized processing engine.'
		},
		{
			icon: LockOutline,
			title: 'Secure & Private',
			description: 'Your files are processed securely and automatically deleted after conversion.'
		},
		{
			icon: GlobeOutline,
			title: 'Works Everywhere',
			description: 'Convert files from any device, any browser. No installation needed.'
		},
		{
			icon: ServerOutline,
			title: 'No Size Limits',
			description: 'Convert files of any size without worrying about restrictions.'
		}
	];

	const formatCategories = [
		{
			icon: FileLinesOutline,
			name: 'Documents',
			formats: ['PDF', 'DOCX', 'TXT', 'XLSX', 'PPTX', 'ODT'],
			comingSoon: true
		},
		{
			icon: ImageOutline,
			name: 'Images',
			formats: ['PNG', 'JPG', 'WebP', 'GIF', 'BMP', 'TIFF', 'AVIF', 'ICO', 'SVG'],
			comingSoon: false
		},
		{
			icon: VideoCameraOutline,
			name: 'Videos',
			formats: ['MP4', 'AVI', 'MOV', 'MKV', 'WEBM', 'FLV'],
			comingSoon: true
		},
		{
			icon: VolumeUpOutline,
			name: 'Audio',
			formats: ['MP3', 'WAV', 'OGG', 'M4A', 'FLAC', 'AAC'],
			comingSoon: true
		},
		{
			icon: ArchiveOutline,
			name: 'Archives',
			formats: ['ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'BZ2'],
			comingSoon: true
		},
		{
			icon: FileOutline,
			name: 'Other',
			formats: ['JSON', 'XML', 'CSV', 'HTML', 'CSS', 'MD'],
			comingSoon: true
		}
	];
</script>

<!-- Hero -->
<section class="bg-white px-6 py-24 sm:py-32 lg:py-40">
	<div class="mx-auto max-w-7xl">
		<div class="mx-auto max-w-3xl text-center">
			<h1 class="mb-6 text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
				format<span class="text-blue-600">.select</span>
			</h1>
			<p class="mb-4 text-xl font-medium text-gray-600 sm:text-2xl">
				Convert any file format, instantly
			</p>
			<p class="mx-auto mb-10 max-w-2xl text-lg text-gray-500">
				Fast, secure, and free file conversion. Create your free account to get started.
				Convert documents, images, videos, audio, and more with just a few clicks.
			</p>
			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<a href="/signup" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-blue-700">
					<CloudArrowUpOutline class="h-5 w-5" />
					Sign Up Free
					<ArrowRightOutline class="h-5 w-5" />
				</a>
				<a href="#formats" class="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 px-8 py-4 text-lg font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50">
					View Supported Formats
				</a>
			</div>
		</div>
	</div>
</section>

<!-- Features -->
<section class="bg-gray-50 px-6 py-24">
	<div class="mx-auto max-w-7xl">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
				Why choose format<span class="text-blue-600">.select</span>?
			</h2>
			<p class="mx-auto max-w-2xl text-lg text-gray-600">
				The most reliable and user-friendly file conversion tool on the web
			</p>
		</div>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
			{#each features as feature}
				<div class="rounded-xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
						<feature.icon class="h-6 w-6 text-blue-600" />
					</div>
					<h3 class="mb-2 text-xl font-medium">{feature.title}</h3>
					<p class="text-gray-600">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Supported Formats -->
<section id="formats" class="bg-white px-6 py-24">
	<div class="mx-auto max-w-7xl">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
				Supported formats
			</h2>
			<p class="mx-auto max-w-2xl text-lg text-gray-600">
				Convert between hundreds of file formats across multiple categories
			</p>
		</div>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each formatCategories as category}
				<div class="rounded-xl border p-6 transition-colors {category.comingSoon ? 'border-gray-100 bg-gray-50' : 'border-gray-200 hover:border-blue-600'}">
					<div class="mb-4 flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg {category.comingSoon ? 'bg-gray-200' : 'bg-blue-50'}">
							<category.icon class="h-5 w-5 {category.comingSoon ? 'text-gray-400' : 'text-blue-600'}" />
						</div>
						<div class="flex-1">
							<h3 class="text-xl font-medium {category.comingSoon ? 'text-gray-500' : ''}">{category.name}</h3>
							{#if category.comingSoon}
								<p class="mt-0.5 text-sm text-gray-400">Coming soon</p>
							{/if}
						</div>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each category.formats as format}
							<span class="rounded-md px-3 py-1 text-sm {category.comingSoon ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-700'}">{format}</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA -->
<section class="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-24 text-white">
	<div class="mx-auto max-w-7xl text-center">
		<h2 class="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
			Ready to convert your files?
		</h2>
		<p class="mx-auto mb-10 max-w-2xl text-xl text-blue-100">
			Join thousands of users who trust format.select for their file conversion needs
		</p>
		<a href="/signup" class="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-medium text-blue-600 transition-colors hover:bg-gray-100">
			Create Free Account
			<ArrowRightOutline class="h-5 w-5" />
		</a>
		<p class="mt-6 text-sm text-blue-100">
			Free forever plan &middot; All image formats &middot; Upgrade anytime
		</p>
	</div>
</section>
