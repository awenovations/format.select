<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, Button, Badge, Alert, Input, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, A } from 'flowbite-svelte';
	import { ClipboardOutline, TrashBinOutline } from 'flowbite-svelte-icons';

	let { data, form } = $props();

	let newToken: string | null = $state(null);
	let tokenName: string = $state('');
	let copied = $state(false);

	// When form action returns a new token, show it
	$effect(() => {
		if (form?.newToken) {
			newToken = form.newToken;
			tokenName = '';
		}
	});

	function copyToken() {
		if (newToken) {
			navigator.clipboard.writeText(newToken);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	function formatDate(iso: string | null) {
		if (!iso) return 'Never';
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function handleUpgrade() {
		const res = await fetch('/api/checkout', { method: 'POST' });
		const { url } = await res.json();
		if (url) window.location.href = url;
	}

	async function handleManageBilling() {
		const res = await fetch('/api/billing-portal', { method: 'POST' });
		const { url } = await res.json();
		if (url) window.location.href = url;
	}
</script>

<div class="flex flex-1 items-start justify-center px-4 pt-16">
	<div class="w-full max-w-5xl">
		<h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
		<p class="mb-8 text-gray-600 dark:text-gray-400">Manage your plans, billing, and API tokens.</p>

		<!-- Plans & Billing -->
		<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Plans & Billing</h2>

		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Web Plan -->
			<Card size="xl" class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<div class="flex items-center gap-3">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Web Plan</h3>
							{#if data.webUsage.plan === 'admin'}
								<Badge color="purple">Admin</Badge>
							{:else if data.webUsage.plan === 'pro'}
								<Badge color="blue">Pro</Badge>
							{:else}
								<Badge color="gray">Free</Badge>
							{/if}
						</div>
						{#if data.webUsage.plan === 'admin'}
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Unlimited conversions</p>
						{:else if data.webUsage.plan === 'pro'}
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
								{data.webUsage.used} / {data.webUsage.limit} conversions this hour
							</p>
						{:else}
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
								{data.webUsage.used} / {data.webUsage.limit} conversions today
							</p>
						{/if}
					</div>
					{#if data.webUsage.plan === 'free'}
						<Button color="blue" size="sm" onclick={handleUpgrade}>Upgrade to Pro</Button>
					{:else if data.webUsage.plan === 'pro'}
						<Button color="alternative" size="sm" onclick={handleManageBilling}>Manage Subscription</Button>
					{/if}
				</div>

				{#if data.webUsage.plan !== 'admin' && data.webUsage.limit !== Infinity}
					<div class="mt-3">
						<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
							<div
								class="h-2 rounded-full transition-all {data.webUsage.used >= data.webUsage.limit ? 'bg-red-500' : 'bg-blue-500'}"
								style="width: {Math.min(100, (data.webUsage.used / data.webUsage.limit) * 100)}%"
							></div>
						</div>
					</div>
				{/if}
			</Card>

			<!-- API Plan & Usage -->
			<Card size="xl" class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<div class="flex items-center gap-3">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">API Plan</h3>
							{#if data.apiUsage.plan === 'api_admin'}
								<Badge color="purple">Admin</Badge>
							{:else if data.apiUsage.plan === 'api_business'}
								<Badge color="green">Business</Badge>
							{:else if data.apiUsage.plan === 'api_developer'}
								<Badge color="blue">Developer</Badge>
							{:else}
								<Badge color="gray">Free</Badge>
							{/if}
						</div>
						{#if data.apiUsage.plan !== 'api_admin'}
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
								{data.apiUsage.used} / {data.apiUsage.limit} conversions today
							</p>
						{:else}
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Unlimited conversions</p>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						{#if data.apiUsage.plan === 'api_free'}
							<A href="/paywall" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Upgrade API Plan</A>
						{:else if data.apiUsage.plan === 'api_developer' || data.apiUsage.plan === 'api_business'}
							<Button color="alternative" size="sm" onclick={handleManageBilling}>Manage Subscription</Button>
						{/if}
					</div>
				</div>

				{#if data.apiUsage.plan !== 'api_admin' && data.apiUsage.limit !== Infinity}
					<div class="mt-3">
						<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
							<div
								class="h-2 rounded-full transition-all {data.apiUsage.used >= data.apiUsage.limit ? 'bg-red-500' : 'bg-blue-500'}"
								style="width: {Math.min(100, (data.apiUsage.used / data.apiUsage.limit) * 100)}%"
							></div>
						</div>
					</div>
				{/if}
			</Card>
		</div>

		<!-- API Tokens -->
		<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">API Tokens</h2>

		<div class="mb-6 grid grid-cols-1 gap-6">
			<!-- Create Token -->
			<Card size="xl" class="p-6">
				<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Create API Token</h3>

				{#if form?.error}
					<Alert color="red" class="mb-4" dismissable>{form.error}</Alert>
				{/if}

				{#if newToken}
					<Alert color="green" class="mb-4">
						<p class="mb-2 font-semibold">Token created! Copy it now — you won't see it again.</p>
						<div class="flex items-center gap-2">
							<code class="flex-1 break-all rounded bg-green-100 px-3 py-2 font-mono text-sm text-green-900 dark:bg-green-900 dark:text-green-100">
								{newToken}
							</code>
							<Button size="sm" color="alternative" onclick={copyToken}>
								<ClipboardOutline class="h-4 w-4" />
								{copied ? 'Copied!' : 'Copy'}
							</Button>
						</div>
					</Alert>
				{/if}

				<form method="post" action="?/createToken" use:enhance={() => {
					return async ({ update }) => {
						await update();
					};
				}}>
					<div class="flex gap-3">
						<Input
							name="name"
							placeholder="Token name (e.g. My App)"
							bind:value={tokenName}
							class="flex-1"
							required
							maxlength={100}
						/>
						<Button type="submit" color="blue" disabled={!tokenName.trim()}>
							Create Token
						</Button>
					</div>
				</form>

				{#if data.maxKeys !== Infinity}
					<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
						{data.tokens.length} / {data.maxKeys} tokens used
					</p>
				{/if}
			</Card>
		</div>

		<!-- Token List -->
		<Card size="xl" class="p-6">
			<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Your Tokens</h3>

			{#if data.tokens.length === 0}
				<p class="text-sm text-gray-500 dark:text-gray-400">No API tokens yet. Create one above to get started.</p>
			{:else}
				<Table striped>
					<TableHead>
						<TableHeadCell>Name</TableHeadCell>
						<TableHeadCell>Token</TableHeadCell>
						<TableHeadCell>Created</TableHeadCell>
						<TableHeadCell>Last Used</TableHeadCell>
						<TableHeadCell></TableHeadCell>
					</TableHead>
					<TableBody>
						{#each data.tokens as token}
							<TableBodyRow>
								<TableBodyCell>{token.name}</TableBodyCell>
								<TableBodyCell>
									<code class="text-xs text-gray-500">ic_****...{token.tokenSuffix}</code>
								</TableBodyCell>
								<TableBodyCell class="text-sm">{formatDate(token.createdAt)}</TableBodyCell>
								<TableBodyCell class="text-sm">{formatDate(token.lastUsedAt)}</TableBodyCell>
								<TableBodyCell>
									<form method="post" action="?/deleteToken" use:enhance>
										<input type="hidden" name="tokenId" value={token.id} />
										<Button type="submit" size="xs" color="red" outline>
											<TrashBinOutline class="h-3 w-3" />
										</Button>
									</form>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</Card>

		<p class="mt-6 text-center">
			<A href="/app" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">&larr; back</A>
		</p>
	</div>
</div>
