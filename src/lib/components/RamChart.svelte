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
	let isSettingsOpen = false; // Tracks if the settings menu is open

	// Query parameters inputs
	let numberOfProcesses = 1;
	let devices = '';
	let startTime = '2024-06-25T00:00:00Z';
	let endTime = '2024-07-30T23:59:59Z';

	$: if (metrics) {
		allProcesses = metrics.map((metric) => metric.processName);
	}

	function handleProcessToggle(processName) {
		const index = selectedProcesses.indexOf(processName);
		if (index > -1) {
			selectedProcesses.splice(index, 1);
		} else {
			selectedProcesses.push(processName);
		}
		initializeChart();
	}

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	function toggleSettings() {
		isSettingsOpen = !isSettingsOpen;
	}

	// create function to generate random colors
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
			if (chart) {
				chart.destroy(); // Destroy the previous instance before creating a new one
			}

			// Filter metrics based on selected processes
			const filteredMetrics = metrics.filter((metric) => {
				return selectedProcesses.includes(metric.processName);
			});

			// Aggregate RAM usage by processName
			const ramUsageByProcess = filteredMetrics.reduce((acc, metric) => {
				metric.metrics.forEach(({ processName, processRamUsage, timestamp }) => {
					if (!acc[processName]) {
						acc[processName] = [];
					}
					acc[processName].push({ ramUsage: processRamUsage, timestamp });
				});
				return acc;
			}, {});

			// Create datasets for each process
			const datasets = Object.keys(ramUsageByProcess).map((processName) => ({
				label: processName,
				data: ramUsageByProcess[processName].map((entry) => entry.ramUsage),
				fill: false,
				borderColor: getRandomColor(),
				tension: 0.1
			}));

			const labels = ramUsageByProcess[Object.keys(ramUsageByProcess)[0]].map(
				(entry) => entry.timestamp
			);

			chart = new Chart(ctx, {
				type: 'line',
				data: {
					labels,
					datasets
				},
				options: {
					responsive: true, // This makes the chart responsive
					maintainAspectRatio: false, // This makes the chart not maintain aspect ratio
					scales: {
						y: {
							beginAtZero: true,
							title: {
								display: true,
								text: 'RAM Usage (MB)'
							}
						},
						x: {
							type: 'time',
							time: {
								unit: 'minute',
								tooltipFormat: 'HH:mm'
								// stepSize: 1
							},
							ticks: {
								// maxTicksLimit: 10
							},
							title: {
								display: true,
								text: 'Time'
							}
						}
					}
				},
				tooltips: {
					enabled: true,
					mode: 'index',
					intersect: false,
					callbacks: {
						label: function (tooltipItem, data) {
							let label = data.datasets[tooltipItem.datasetIndex].label || '';
							if (label) {
								label += ': ';
							}
							label += tooltipItem.yLabel;
							return label;
						},
						afterLabel: function (tooltipItem, data) {
							const timestamp = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].x;
							return `Timestamp: ${moment(timestamp).format('MMM D, YYYY HH:mm')}`; // Format timestamp
						}
					}
				}
			});
		}
	}

	async function fetchMetrics() {
		try {
			if (devices != '') {
				devices = devices.split(',').map((device) => device.trim());
			} else {
				devices = [];
			}
			const requestBody = {
				tenantID: '6a63b790-eead-4e12-869c-2ca3a9da650d',
				query: {
					numberOfProcesses,
					devices: devices,
					timeRange: {
						start: startTime,
						end: endTime
					}
				}
			};

			const response = await fetch('http://cloudvigilante.anoliveira.com/api/v1/rammetrics', {
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
			initializeChart();
		} catch (error) {
			console.error('Error fetching metrics:', error);
		}
	}

	async function applySettings() {
		await fetchMetrics();
	}

	onMount(() => {
		fetchMetrics();
	});
</script>

<div class="page-wrapper">
	<!-- Render checkboxes for each process -->
	<div class="dropdown">
		<button on:click={toggleDropdown}>Select Processes</button>
		{#if isDropdownOpen}
			<div class="dropdown-content">
				{#each allProcesses as process}
					<label>
						<input
							type="checkbox"
							checked={selectedProcesses.includes(process)}
							on:change={() => handleProcessToggle(process)}
						/>
						{process}
					</label>
				{/each}
			</div>
		{/if}
	</div>
	<!-- Settings menu for user input -->
	<div class="settings">
		<button on:click={toggleSettings}>Filters</button>
		{#if isSettingsOpen}
			<div class="settings-content">
				<label>
					Number of Processes:
					<input type="number" bind:value={numberOfProcesses} min="1" />
				</label>
				<label>
					Devices (comma separated):
					<input type="text" bind:value={devices} />
				</label>
				<label>
					Start Time:
					<input type="datetime-local" bind:value={startTime} />
				</label>
				<label>
					End Time:
					<input type="datetime-local" bind:value={endTime} />
				</label>
				<button on:click={applySettings}>Apply</button>
			</div>
		{/if}
	</div>

	<section>
		<canvas bind:this={chartContainer}></canvas>
	</section>
</div>

<style>
	.page-wrapper {
		padding: 3.5rem;
	}

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
