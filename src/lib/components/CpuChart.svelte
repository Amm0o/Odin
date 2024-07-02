<script>
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import 'chartjs-adapter-date-fns';

	let metrics = [];
	let chartContainer;
	let ctx;
	let chart;
	let selectedProcesses = []; // Tracks selected processes
	let allProcesses = []; // List of all processes to populate the dropdown
	let isDropdownOpen = false;

	$: if (metrics) {
		const processSet = new Set();
		metrics.forEach((group) => {
			group.metrics.forEach((metric) => {
				const processKey = `${group.processName}(${metric.processPID})`; // Unique identifier for each process
				if (!processSet.has(processKey)) {
					allProcesses.push({
						processName: group.processName,
						processPID: metric.processPID
					});
					processSet.add(processKey);
				}
			});
		});
	}

	function handleProcessToggle(process) {
		const processKey = `${process.processName}(${process.processPID})`; // Match the unique identifier format
		const index = selectedProcesses.findIndex(
			(selectedProcess) =>
				`${selectedProcess.processName}(${selectedProcess.processPID})` === processKey
		);
		if (index > -1) {
			selectedProcesses.splice(index, 1);
		} else {
			selectedProcesses.push({
				processName: process.processName,
				processPID: process.processPID
			});
		}
		initializeChart();
	}

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	function getRandomColor() {
		const letters = '0123456789ABCDEF';
		let color = '#';
		for (let i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

	function initializeChart() {
		if (metrics.length > 0 && chartContainer) {
			ctx = chartContainer.getContext('2d');
			if (chart) chart.destroy();

			const filteredMetrics = metrics.filter((group) =>
				selectedProcesses.some(
					(selectedProcess) =>
						selectedProcess.processPID === group.processPID &&
						selectedProcess.processName === group.processName
				)
			);

			const datasets = filteredMetrics.map((group) => ({
				label: `${group.processName}(${group.processPID})`,
				data: group.metrics.map(({ processCpuUsage }) => processCpuUsage),
				fill: false,
				borderColor: getRandomColor(),
				tension: 0.1
			}));

			const labels = filteredMetrics[0]?.metrics.map(
				({ timestamp }) => timestamp || 'Undefined Timestamp'
			);

			chart = new Chart(ctx, {
				type: 'line',
				data: { labels, datasets },
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						y: { beginAtZero: true, title: { display: true, text: 'CPU Usage (%)' } },
						x: {
							type: 'time',
							time: { unit: 'minute', tooltipFormat: 'HH:mm' },
							title: { display: true, text: 'Time' }
						}
					}
				}
			});
		}
	}

	async function fetchMetrics() {
		try {
			const requestBody = {
				tenantID: '6a63b790-eead-4e12-869c-2ca3a9da650d',
				query: {
					numberOfProcesses: 0,
					devices: ['angelo'],
					timeRange: {
						start: '2024-06-25T00:00:00Z',
						end: '2024-06-30T23:59:59Z'
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

			// Initialize chart after metrics are fetched
			// initializeChart();
		} catch (error) {
			console.error('Error fetching metrics:', error);
		}
	}

	onMount(() => {
		fetchMetrics();
	});
</script>

<!-- Render checkboxes for each process -->
<div class="dropdown">
	<button on:click={toggleDropdown}>Select Processes</button>
	{#if isDropdownOpen}
		<div class="dropdown-content">
			{#each allProcesses as process}
				<label>
					<input
						type="checkbox"
						checked={selectedProcesses.find(
							(selectedProcess) => selectedProcess.processPID === process.processPID
						)}
						on:change={() => handleProcessToggle(process)}
					/>
					{process.processName}({process.processPID})
				</label>
			{/each}
		</div>
	{/if}
</div>

<section>
	<canvas bind:this={chartContainer}></canvas>
</section>

<style>
	canvas {
		height: 400px; /* Example height */
		width: 100%; /* Example width */
	}

	.dropdown {
		position: relative;
		display: inline-block;
	}
	.dropdown-content {
		display: block;
		position: absolute;
		background-color: #f9f9f9;
		min-width: 160px;
		box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
		padding: 12px;
		z-index: 1;
	}
</style>
