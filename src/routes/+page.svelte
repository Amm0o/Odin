<script>
	import { onMount } from 'svelte';

	let metrics = [];

	async function fetchMetrics() {
		const requestBody = {
			tenantID: '6a63b790-eead-4e12-869c-2ca3a9da650d',
			query: {
				numberOfProcesses: 0,
				devices: ['angelo'],
				timeRange: {
					start: '2024-06-25T00:00:00Z',
					end: '2024-06-28T23:59:59Z'
				},
				metrics: {
					cpuLevel: 29.4
				}
			}
		};

		const response = await fetch('http://localhost:8080/api/v1/cpumetrics', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			console.error('Failed to fetch metrics:', response.statusText);
			return;
		}
		metrics = await response.json();

		console.log(metrics);
	}

	onMount(() => {
		fetchMetrics();
	});
</script>

<h1>Process Performance Metrics</h1>

{#if metrics.length > 0}
	<table>
		<thead>
			<tr>
				<th>Timestamp</th>
				<th>PID</th>
				<th>Name</th>
				<th>Command</th>
				<th>CPU Usage (%)</th>
				<th>RAM Usage (MB)</th>
				<th>Avg CPU Usage (%)</th>
			</tr>
		</thead>
		<tbody>
			{#each metrics as metric}
				<tr>
					<td>{metric.timestamp}</td>
					<td>{metric.processPID}</td>
					<td>{metric.processName}</td>
					<td>{metric.processCommand}</td>
					<td>{metric.processCpuUsage}</td>
					<td>{metric.processRamUsage}</td>
					<td>{metric.avgCpuUsage}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p>Loading metrics...</p>
{/if}

<style>
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: left;
	}
	th {
		background-color: #f2f2f2;
	}
</style>
