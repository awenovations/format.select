<script lang="ts">
	import Landing from './Landing.svelte';

	let { data } = $props();
</script>

<Landing session={data.session} />
