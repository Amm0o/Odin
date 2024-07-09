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

			//console.log(metrics);
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
				borderColor: getRandomColor(), // Define a function to generate random colors
				tension: 0.1
			}));

			// Assuming timestamps are consistent across all processes, use the first process's timestamps for labels
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
					maintainAspectRatio: false, // Optional: if you want the chart to resize in both dimensions without maintaining the original aspect ratio
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
			const requestBody = {
				tenantID: 'c6b06d8d-cc92-4f26-8c44-b348a416fffd',
				query: {
					numberOfProcesses: 1,
					devices: [],
					timeRange: {
						start: '2024-06-25T00:00:00Z',
						end: '2024-07-30T23:59:59Z'
					}
				}
			};

			const response = await fetch('http://localhost:8080/api/v1/rammetrics', {
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
			// Initialize chart after metrics are fetched
			initializeChart();
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
						checked={selectedProcesses.includes(process)}
						on:change={() => handleProcessToggle(process)}
					/>
					{process}
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
