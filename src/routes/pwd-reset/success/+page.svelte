<script lang="ts">
	import { Card, A } from 'flowbite-svelte';
	import { CheckCircleOutline } from 'flowbite-svelte-icons';
</script>

<div class="flex flex-1 items-start justify-center px-4 pt-16">
	<div class="w-full max-w-md">
		<h1 class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
			format<span class="text-blue-600">.select</span>
		</h1>

		<Card size="md" class="p-6">
			<div class="flex flex-col items-center gap-4">
				<CheckCircleOutline class="h-16 w-16 text-green-500" />

				<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Success!</h2>

				<p class="text-center text-sm text-gray-600 dark:text-gray-400">
					Your password has successfully been reset. Click below to sign in.
				</p>

				<A href="/signin">Back to sign in</A>
			</div>
		</Card>
	</div>
</div>
