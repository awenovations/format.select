<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, Input, Label, Button, Alert, A } from 'flowbite-svelte';

	let loading = $state(false);
	let errorMessage: string | null = $state(null);

	const onSubmit = () => {
		loading = true;
		errorMessage = null;

		return async ({ result, update }: { result: any; update: () => void }) => {
			loading = false;

			if (result.type === 'failure') {
				errorMessage = result.data?.message ?? 'Something went wrong, please try again.';
			} else if (result.type === 'redirect') {
				await update();
			}
		};
	};
</script>

<div class="flex flex-1 items-start justify-center px-4 pt-16">
	<div class="w-full max-w-md">
		<h1 class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
			format<span class="text-blue-600">.select</span>
		</h1>

		<Card size="md" class="p-6">
			<h2 class="mb-6 text-center text-xl font-semibold text-gray-900 dark:text-white">
				Sign Up
			</h2>

			{#if errorMessage}
				<Alert color="red" class="mb-4" dismissable onclick={() => (errorMessage = null)}>
					{errorMessage}
				</Alert>
			{/if}

			<form method="post" use:enhance={onSubmit} class="flex flex-col gap-4">
				<div>
					<Label for="name" class="mb-2">Name</Label>
					<Input type="text" id="name" name="name" placeholder="Your name" required />
				</div>
				<div>
					<Label for="email" class="mb-2">Email</Label>
					<Input type="email" id="email" name="email" placeholder="email@example.com" required />
				</div>
				<div>
					<Label for="password" class="mb-2">Password</Label>
					<Input type="password" id="password" name="password" required />
					<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum 6 characters</p>
				</div>
				<Button type="submit" color="blue" class="w-full" disabled={loading} loading={loading}>
					{loading ? 'Creating account...' : 'Sign Up'}
				</Button>
			</form>

			<div class="mt-4 text-center text-sm">
				<span class="text-gray-500 dark:text-gray-400">
					Already have an account? <A href="/signin">Sign in</A>
				</span>
			</div>
		</Card>
	</div>
</div>
