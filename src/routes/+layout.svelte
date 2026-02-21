<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { Button, Badge, A } from 'flowbite-svelte';
	import { CogOutline } from 'flowbite-svelte-icons';
	import { Toaster, toast } from 'svelte-sonner';
	import ConversionDrawer from '$lib/components/ConversionDrawer.svelte';
	import ConversionToggleButton from '$lib/components/ConversionToggleButton.svelte';
	import { registerToastHandler, requestNotificationPermission } from '$lib/conversion/notifications';
	import { conversionQueue } from '$lib/conversion/queue.svelte';

	let { children, data } = $props();

	let drawerOpen = $state(false);
	let mobileMenuOpen = $state(false);
	afterNavigate(() => { mobileMenuOpen = false; });

	$effect(() => {
		registerToastHandler((payload) => {
			if (payload.type === 'success') toast.success(payload.message, { description: payload.filename });
			else toast.error(payload.message, { description: payload.filename });
		});
		conversionQueue.registerOnAdd(() => { drawerOpen = true; });
		requestNotificationPermission();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Toaster position="bottom-right" richColors />

<div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
	{#snippet authNavItems()}
		<span class="text-sm text-gray-600 dark:text-gray-300">{data.session?.user.name}</span>
		{#if data.usage?.plan === 'admin'}
			<Badge color="purple">Admin</Badge>
		{:else if data.usage?.plan === 'pro'}
			<Badge color="blue">Pro</Badge>
		{:else if data.usage && data.usage.used < data.usage.limit}
			<a href="/paywall" class="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">Upgrade</a>
		{/if}
		<a href="/docs" class="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">Docs</a>
		<ConversionToggleButton onclick={() => drawerOpen = !drawerOpen} />
		<a href="/settings" class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" title="Settings"><CogOutline class="h-5 w-5" /></a>
		<form method="post" action="/signout" use:enhance>
			<Button type="submit" size="sm" color="alternative">Sign Out</Button>
		</form>
	{/snippet}

	{#snippet publicNavItems()}
		<a href="/docs" class="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Docs</a>
		<a href="/paywall" class="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Pricing</a>
		<a href="/signin" class="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Log In</a>
		<a href="/signup" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">Sign Up</a>
	{/snippet}

	{#if data.session?.user}
		<nav class="z-50 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
			<div class="mx-auto flex max-w-5xl items-center justify-between">
				<a href="/app" class="text-lg font-semibold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300">format<span class="text-blue-600">.select</span></a>
				<div class="flex items-center gap-3">
					<div class="md:hidden">
						<ConversionToggleButton onclick={() => drawerOpen = !drawerOpen} />
					</div>

					<div class="hidden items-center gap-4 md:flex">
						{@render authNavItems()}
					</div>

					<button
						class="rounded-md p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 md:hidden"
						onclick={() => mobileMenuOpen = !mobileMenuOpen}
						aria-label="Toggle menu"
					>
						{#if mobileMenuOpen}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						{/if}
					</button>
				</div>
			</div>

			{#if mobileMenuOpen}
				<div class="border-t border-gray-200 dark:border-gray-700 md:hidden">

					<!-- User info row -->
					<div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
						<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{data.session?.user.name}</span>
						{#if data.usage?.plan === 'admin'}
							<Badge color="purple">Admin</Badge>
						{:else if data.usage?.plan === 'pro'}
							<Badge color="blue">Pro</Badge>
						{:else if data.usage && data.usage.used < data.usage.limit}
							<a href="/paywall" class="text-sm font-medium text-blue-600 hover:text-blue-700">Upgrade</a>
						{/if}
					</div>

					<!-- Nav links -->
					<nav class="py-1">
						<a href="/docs" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">Docs</a>
						<a href="/settings" class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
							<CogOutline class="h-4 w-4" />Settings
						</a>
					</nav>

					<!-- Sign out -->
					<div class="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
						<form method="post" action="/signout" use:enhance>
							<Button type="submit" size="sm" color="alternative" class="w-full justify-center">Sign Out</Button>
						</form>
					</div>

				</div>
			{/if}
		</nav>
	{:else}
		<header class="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
			<div class="mx-auto max-w-7xl px-6 py-4">
				<div class="flex items-center justify-between">
					<a href="/" class="text-2xl font-medium text-gray-900 dark:text-white">
						format<span class="text-blue-600">.select</span>
					</a>

					<nav class="hidden items-center gap-8 md:flex">
						{@render publicNavItems()}
					</nav>

					<button
						class="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 md:hidden"
						onclick={() => mobileMenuOpen = !mobileMenuOpen}
						aria-label="Toggle menu"
					>
						{#if mobileMenuOpen}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						{/if}
					</button>
				</div>

				{#if mobileMenuOpen}
					<div class="border-t border-gray-200 dark:border-gray-700 md:hidden">
						<nav class="py-1">
							<a href="/docs"    class="block px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">Docs</a>
							<a href="/paywall" class="block px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">Pricing</a>
							<a href="/signin"  class="block px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">Log In</a>
						</nav>
						<div class="border-t border-gray-100 px-6 py-3 dark:border-gray-700">
							<a href="/signup" class="block w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-700">Sign Up</a>
						</div>
					</div>
				{/if}
			</div>
		</header>
	{/if}

	<main class="flex-1" class:pb-16={data.session?.user}>
		{@render children()}
	</main>

	<footer class="border-t border-gray-200 py-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
		&copy; {new Date().getFullYear()} format<span class="text-blue-600">.select</span>. All rights reserved.
	</footer>
</div>

{#if data.session?.user}
	<ConversionDrawer bind:open={drawerOpen} />
{/if}
