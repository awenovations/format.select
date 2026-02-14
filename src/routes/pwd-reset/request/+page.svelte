<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Card, Input, Label, Button, A } from 'flowbite-svelte';

	let loading = $state(false);

	const onSubmit = () => {
		loading = true;

		return async ({ result }: { result: any }) => {
			loading = false;
			goto(`/pwd-reset/check-your-email?email=${result.data.email}`);
		};
	};
</script>

<div class="flex flex-1 items-start justify-center px-4 pt-16">
	<div class="w-full max-w-md">
		<h1 class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
			format<span class="text-blue-600">.select</span>
		</h1>

		<Card size="md" class="p-6">
			<h2 class="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-white">
				Reset Password
			</h2>
			<p class="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
				Enter the email you used to register.
			</p>

			<form method="post" use:enhance={onSubmit} class="flex flex-col gap-4">
				<div>
					<Label for="email" class="mb-2">Email</Label>
					<Input type="email" id="email" name="email" placeholder="email@example.com" required />
				</div>
				<Button type="submit" class="w-full" disabled={loading} loading={loading}>
					{loading ? 'Sending...' : 'Send instructions'}
				</Button>
			</form>

			<div class="mt-4 text-center text-sm">
				<A href="/signin">Back to sign in</A>
			</div>
		</Card>
	</div>
</div>
