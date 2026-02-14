<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Card, Input, Label, Button, Alert, A } from 'flowbite-svelte';

	let password = $state('');
	let confirmPassword = $state('');
	let pristine = $state(true);
	let errorMessage: string | null = $state(null);
	let valid = $derived(!pristine && password === confirmPassword);

	const { data } = $page;

	const onSubmit = () => {
		return async ({ result }: { result: any }) => {
			if (result.type === 'failure' || result.type === 'error') {
				errorMessage = 'Something went wrong, please try again.';
			} else {
				goto('/pwd-reset/success');
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
			{#if data.authProvider === 'image-converter'}
				<h2 class="mb-6 text-center text-xl font-semibold text-gray-900 dark:text-white">
					Reset Password
				</h2>

				{#if errorMessage}
					<Alert color="red" class="mb-4" dismissable onclick={() => (errorMessage = null)}>
						{errorMessage}
					</Alert>
				{/if}

				<form method="post" use:enhance={onSubmit} class="flex flex-col gap-4">
					<div>
						<Label for="newPassword" class="mb-2">New Password</Label>
						<Input
							type="password"
							id="newPassword"
							name="newPassword"
							required
							bind:value={password}
						/>
					</div>
					<div>
						<Label for="confirmPassword" class="mb-2">Confirm Password</Label>
						<Input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							required
							bind:value={confirmPassword}
							oninput={() => (pristine = false)}
						/>
						{#if !pristine && !valid}
							<p class="mt-1 text-sm text-red-600 dark:text-red-500">Passwords don't match</p>
						{/if}
					</div>
					<Button type="submit" class="w-full" disabled={!valid}>Reset Password</Button>
				</form>

				<div class="mt-4 text-center text-sm">
					<span class="text-gray-500 dark:text-gray-400">
						Don't need to change it? <A href="/signin">Sign in</A>
					</span>
				</div>
			{:else}
				<h2 class="mb-4 text-center text-xl font-semibold text-gray-900 dark:text-white">
					Reset is not supported
				</h2>

				<p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
					Your account was not created with our authentication system, please login with your {data.authProvider} account.
				</p>

				<div class="text-center text-sm">
					<A href="/signin">Back to sign in</A>
				</div>
			{/if}
		</Card>
	</div>
</div>
