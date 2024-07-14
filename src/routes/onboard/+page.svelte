<script>
	import { onMount } from 'svelte';

	let onboardLink = '';
	// Fetching the onboarding script link
	async function fetchOnboardingScript() {
		try {
			const response = await fetch('http://localhost:8080/api/v1/onboard-device');
			if (!response.ok) {
				console.error('Failed to fetch onboarding script:', response.statusText);
				return;
			}

			onboardLink = await response.json();
			console.log(onboardLink.downloadLink);
			console.log(onboardLink);
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
	<p>curl {onboardLink.downloadLink} -O</p>
	<p>chmod +x onboard.sh</p>
	<p>./onboard_x.sh</p>
</div>
