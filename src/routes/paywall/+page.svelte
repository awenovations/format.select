<script lang="ts">
	import { Card, Button, Badge, Alert, A } from 'flowbite-svelte';
	import { CheckCircleOutline } from 'flowbite-svelte-icons';

	let { data } = $props();
	let loading = $state(false);
	let portalLoading = $state(false);
	let apiLoading: string | null = $state(null);

	async function handleUpgrade() {
		loading = true;
		try {
			const res = await fetch('/api/checkout', { method: 'POST' });
			const { url } = await res.json();
			window.location.href = url;
		} catch {
			loading = false;
		}
	}

	async function handleManageBilling() {
		portalLoading = true;
		try {
			const res = await fetch('/api/billing-portal', { method: 'POST' });
			const { url } = await res.json();
			window.location.href = url;
		} catch {
			portalLoading = false;
		}
	}

	async function handleApiUpgrade(plan: string) {
		apiLoading = plan;
		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ plan })
			});
			const { url } = await res.json();
			window.location.href = url;
		} catch {
			apiLoading = null;
		}
	}
</script>

<div class="flex flex-1 items-start justify-center px-4 pt-16">
	<div class="w-full max-w-5xl">
		<h1 class="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-white">
			Choose Your Plan
		</h1>

		{#if data.usage.plan === 'free'}
			<p class="mb-8 text-center text-gray-600 dark:text-gray-400">
				You've used {data.usage.used} of {data.usage.limit} free conversions today.
			</p>
		{/if}

		<!-- Web Plans -->
		<h2 class="mb-4 text-center text-xl font-semibold text-gray-900 dark:text-white">Web Plans</h2>
		<div class="mx-auto grid max-w-sm grid-cols-1 gap-6 md:max-w-3xl md:grid-cols-2">
			<Card class="relative p-6">
				<h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Free</h2>
				<p class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
					$0<span class="text-base font-normal text-gray-500">/forever</span>
				</p>
				<ul class="mb-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						5 conversions per day
					</li>
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						All image formats
					</li>
				</ul>
				{#if data.usage.plan === 'free'}
					<Badge color="gray" class="w-full justify-center py-2">Current Plan</Badge>
				{/if}
			</Card>

			<Card class="relative border-2 border-blue-500 p-6">
				<div class="absolute -top-3 right-4">
					<Badge color="blue">Recommended</Badge>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Pro</h2>
				<p class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
					$3<span class="text-base font-normal text-gray-500">/month</span>
				</p>
				<ul class="mb-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						100 conversions per hour
					</li>
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						All image formats
					</li>
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						Priority processing
					</li>
				</ul>
				{#if data.usage.plan === 'pro'}
					<Badge color="blue" class="mb-2 w-full justify-center py-2">Current Plan</Badge>
					<Button
						color="alternative"
						class="w-full"
						disabled={portalLoading}
						loading={portalLoading}
						onclick={handleManageBilling}
					>
						Manage Subscription
					</Button>
				{:else}
					<Button
						color="blue"
						class="w-full"
						disabled={loading}
						loading={loading}
						onclick={handleUpgrade}
					>
						{loading ? 'Redirecting...' : 'Upgrade to Pro'}
					</Button>
				{/if}
			</Card>
		</div>

		{#if data.usage.plan === 'pro' || data.hasBilling}
			<p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
				<button class="underline hover:text-gray-700 dark:hover:text-gray-300" onclick={handleManageBilling}>
					Manage billing & cancel subscription
				</button>
			</p>
		{/if}

		<!-- API Plans -->
		<h2 class="mb-2 mt-12 text-center text-xl font-semibold text-gray-900 dark:text-white">API Plans</h2>
		<p class="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
			Integrate image conversion into your apps with our REST API.
		</p>

		<div class="mx-auto grid max-w-sm grid-cols-1 gap-6 md:max-w-none md:grid-cols-3">
			<Card class="relative p-6">
				<h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Free API</h3>
				<p class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
					$0<span class="text-base font-normal text-gray-500">/forever</span>
				</p>
				<ul class="mb-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						50 conversions per day
					</li>
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						1 API key
					</li>
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						10 MB max file size
					</li>
				</ul>
				{#if data.apiUsage.plan === 'api_free'}
					<Badge color="gray" class="w-full justify-center py-2">Current Plan</Badge>
				{/if}
			</Card>

			<Card class="relative border-2 border-blue-500 p-6">
				<div class="absolute -top-3 right-4">
					<Badge color="blue">Popular</Badge>
				</div>
				<h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Developer</h3>
				<p class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
					$9<span class="text-base font-normal text-gray-500">/month</span>
				</p>
				<ul class="mb-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						500 conversions per day
					</li>
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						3 API keys
					</li>
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						25 MB max file size
					</li>
				</ul>
				{#if data.apiUsage.plan === 'api_developer'}
					<Badge color="blue" class="mb-2 w-full justify-center py-2">Current Plan</Badge>
					<Button
						color="alternative"
						class="w-full"
						disabled={portalLoading}
						loading={portalLoading}
						onclick={handleManageBilling}
					>
						Manage Subscription
					</Button>
				{:else if data.apiUsage.plan === 'api_free'}
					<Button
						color="blue"
						class="w-full"
						disabled={apiLoading === 'api_developer'}
						loading={apiLoading === 'api_developer'}
						onclick={() => handleApiUpgrade('api_developer')}
					>
						{apiLoading === 'api_developer' ? 'Redirecting...' : 'Upgrade to Developer'}
					</Button>
				{/if}
			</Card>

			<Card class="relative p-6">
				<h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Business</h3>
				<p class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
					$29<span class="text-base font-normal text-gray-500">/month</span>
				</p>
				<ul class="mb-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						5,000 conversions per day
					</li>
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						10 API keys
					</li>
					<li class="flex items-center gap-2">
						<CheckCircleOutline class="h-4 w-4 text-green-500" />
						50 MB max file size
					</li>
				</ul>
				{#if data.apiUsage.plan === 'api_business'}
					<Badge color="green" class="mb-2 w-full justify-center py-2">Current Plan</Badge>
					<Button
						color="alternative"
						class="w-full"
						disabled={portalLoading}
						loading={portalLoading}
						onclick={handleManageBilling}
					>
						Manage Subscription
					</Button>
				{:else if data.apiUsage.plan !== 'api_admin'}
					<Button
						color="blue"
						class="w-full"
						disabled={apiLoading === 'api_business'}
						loading={apiLoading === 'api_business'}
						onclick={() => handleApiUpgrade('api_business')}
					>
						{apiLoading === 'api_business' ? 'Redirecting...' : 'Upgrade to Business'}
					</Button>
				{/if}
			</Card>
		</div>

		{#if data.usage.plan !== 'free' || data.usage.used < data.usage.limit}
			<p class="mt-8 text-center">
				<A href="/" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">&larr; back</A>
			</p>
		{/if}
	</div>
</div>
