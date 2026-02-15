<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { enhance } from '$app/forms';
	import { Button, Badge, A } from 'flowbite-svelte';
	import { CogOutline } from 'flowbite-svelte-icons';

	let { children, data } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
	{#if data.session?.user}
		<nav class="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
			<div class="mx-auto flex max-w-5xl items-center justify-between">
				<a href="/app" class="text-lg font-semibold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300">format<span class="text-blue-600">.select</span></a>
				<div class="flex items-center gap-4">
					<span class="text-sm text-gray-600 dark:text-gray-300">{data.session.user.name}</span>
					{#if data.usage?.plan === 'admin'}
						<Badge color="purple">Admin</Badge>
					{:else if data.usage?.plan === 'pro'}
						<Badge color="blue">Pro</Badge>
					{:else if data.usage && data.usage.used < data.usage.limit}
						<a href="/paywall" class="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">Upgrade</a>
					{/if}
					<a href="/docs" class="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">Docs</a>
					<a href="/settings" class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" title="Settings"><CogOutline class="h-5 w-5" /></a>
					<form method="post" action="/signout" use:enhance>
						<Button type="submit" size="sm" color="alternative">Sign Out</Button>
					</form>
				</div>
			</div>
		</nav>
	{:else}
		<header class="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
			<div class="mx-auto max-w-7xl px-6 py-4">
				<div class="flex items-center justify-between">
					<a href="/" class="text-2xl font-medium text-gray-900 dark:text-white">
						format<span class="text-blue-600">.select</span>
					</a>
					<nav class="flex items-center gap-8">
            <a href="/docs" class="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Docs</a>
						<a href="/paywall" class="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Pricing</a>
						<a href="/signin" class="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Log In</a>
						<a href="/signup" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">Sign Up</a>
					</nav>
				</div>
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
