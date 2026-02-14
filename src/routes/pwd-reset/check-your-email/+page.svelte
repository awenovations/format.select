<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Card, A, Button } from 'flowbite-svelte';

	const email = $page.url.searchParams.get('email');

	$effect(() => {
		if (!email) goto('/pwd-reset/request');
	});
</script>

<div class="flex flex-1 items-start justify-center px-4 pt-16">
	<div class="w-full max-w-md">
		<h1 class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
			format<span class="text-blue-600">.select</span>
		</h1>

		<Card size="md" class="p-6">
			<h2 class="mb-4 text-center text-xl font-semibold text-gray-900 dark:text-white">
				Check your email
			</h2>

			<p class="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
				We sent a password reset link to <A href={`mailto:${email}`}>{email}</A>
			</p>

			<form method="post" action={`/pwd-reset/check-your-email?email=${email}`} use:enhance>
				<input type="hidden" name="email" value={email} />
				<p class="text-center text-sm text-gray-500 dark:text-gray-400">
					If you didn't receive the email,
					<button type="submit" class="inline p-0 text-primary-700 underline dark:text-primary-500">click here to resend.</button>
				</p>
			</form>

			<div class="mt-4 text-center text-sm">
				<A href="/signin">Back to sign in</A>
			</div>
		</Card>
	</div>
</div>
