<script>
	import { onMount } from 'svelte';

	let allDevices;
	// Get all device info
	async function fetchDevices() {
		try {
			const response = await fetch(
				'http://cloudvigilante.anoliveira.com/api/v1/getdeviceinfo?tenantID=9052ef58-b79e-4684-a026-f39fd6f8f717',
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			if (!response.ok) {
				console.error('Failed to fetch metrics:', response.statusText);
				return;
			}
			allDevices = await response.json();

			console.log(allDevices);
			// Initialize chart after metrics are fetched
		} catch (error) {
			console.error('Error fetching devices:', error);
		}
	}

	onMount(() => {
		fetchDevices();
	});
</script>

<div class="inventory-container">
	<div class="inventory-header">
		<!-- Header Row -->
		<div class="device-list-header">
			<div class="header-item">Device Name</div>
			<div class="header-item">Device Id</div>
			<div class="header-item">IP Address</div>
			<div class="header-item">MAC Address</div>
		</div>
	</div>
	{#if allDevices}
		<div class="device-list">
			{#each allDevices as device, index}
				<div class="device-row {index % 2 === 0 ? 'even' : 'odd'}">
					<div class="device-item">{device.device_hostname}</div>
					<div class="device-item">{device.device_id}</div>
					<div class="device-item">{device.ip_address}</div>
					<div class="device-item">{device.mac_address}</div>
				</div>
			{/each}
		</div>
	{:else}
		<p>No devices found</p>
	{/if}
</div>

<style>
	.inventory-container {
		width: 100vw;
	}

	.device-list-header,
	.device-row {
		display: flex;
	}

	.header-item,
	.device-item {
		flex: 1;
		text-align: center;
		padding: 10px;
		box-sizing: border-box;
	}

	.device-list-header {
		background-color: #474444;
		font-weight: bold;
		color: white;
		padding: 2rem 0;
	}

	.device-row.even {
		padding: 1.6rem 0;
		background-color: #ecf0f1;
	}

	.device-row.odd {
		padding: 1.6rem 0;
		background-color: #bdc3c7;
	}
</style>
