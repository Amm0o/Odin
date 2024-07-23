<script>
	import { onMount } from 'svelte';

	let onboardLink = '';
	let fileName = '';
	// Fetching the onboarding script link
	async function fetchOnboardingScript() {
		try {
			const response = await fetch('http://cloudvigilante.anoliveira.com/api/v1/onboard-device');
			if (!response.ok) {
				console.error('Failed to fetch onboarding script:', response.statusText);
				return;
			}

			onboardLink = await response.json();
			fileName = onboardLink.downloadLink.split('/').pop();
		} catch (error) {
			console.error('Error fetching onboarding script:', error);
		}
	}

	onMount(() => {
		fetchOnboardingScript();
	});
</script>

<div class="onboard-wrapper">
	<h1>Onboard Device</h1>
	<p>Download the script below and run it on the device you want to onboard.</p>
	<ul>
		<li><code>curl {onboardLink.downloadLink} -O</code></li>
		<li><code>chmod +x {fileName}</code></li>
		<li><code>./{fileName}</code></li>
	</ul>
</div>

<style>
	.onboard-wrapper {
		max-width: 600px;
		margin: 2rem auto;
		padding: 20px;
		background-color: #f4f4f4;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.onboard-wrapper h1 {
		color: #333;
	}
	.onboard-wrapper ul {
		list-style-type: none;
		padding: 0;
	}
	.onboard-wrapper li {
		background-color: #fff;
		margin-bottom: 10px;
		padding: 10px;
		border-radius: 4px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	.onboard-wrapper code {
		background-color: #eee;
		padding: 2px 4px;
		border-radius: 4px;
		font-family: monospace;
	}
</style>
