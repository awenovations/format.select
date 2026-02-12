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
				<a href="/" class="text-lg font-semibold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300">Format.Select</a>
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
	{/if}

	<main class="flex-1 pb-16">
		{@render children()}
	</main>

	<footer class="border-t border-gray-200 py-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
		&copy; {new Date().getFullYear()} Format.Select. All rights reserved.
	</footer>
</div>
