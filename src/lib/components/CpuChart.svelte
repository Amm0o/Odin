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
	let processDropdowns = new Map();
	let isSettingsOpen = false; // Tracks if the settings menu is open

	// Query parameters inputs
	let numberOfProcesses = 1;
	let devices = '';
	let startTime = '2024-06-25T00:00:00Z';
	let endTime = '2024-07-30T23:59:59Z';

	$: if (metrics) {
		const processMap = new Map();

		metrics.forEach((group) => {
			group.metrics.forEach((metric) => {
				const processName = group.processName;
				const processPID = metric.processPID;

				if (!processMap.has(processName)) {
					processMap.set(processName, new Set());
				}

				processMap.get(processName).add(processPID);
			});
		});

		// Convert the map to the desired structure
		processMap.forEach((pids, processName) => {
			allProcesses.push({
				processName,
				pids: Array.from(pids)
			});
		});
	}

	function handleProcessToggle(processName, processPID) {
		const index = selectedProcesses.findIndex(
			(selectedProcess) =>
				selectedProcess.processName === processName && selectedProcess.processPID === processPID
		);

		if (index === -1) {
			selectedProcesses = [...selectedProcesses, { processName, processPID }];
		} else {
			selectedProcesses = selectedProcesses.filter(
				(selectedProcess) =>
					!(
						selectedProcess.processName === processName && selectedProcess.processPID === processPID
					)
			);
		}
		initializeChart();
	}

	function toggleSettings() {
		isSettingsOpen = !isSettingsOpen;
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
			if (devices != '') {
				devices = devices.split(',').map((device) => device.trim());
			} else {
				devices = [];
			}
			const requestBody = {
				tenantID: '9052ef58-b79e-4684-a026-f39fd6f8f717',
				query: {
					numberOfProcesses,
					devices: devices,
					timeRange: {
						start: startTime,
						end: endTime
					}
				}
			};

			const response = await fetch('http://cloudvigilante.anoliveira.com/api/v1/cpumetrics', {
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
					<div>
						<strong>{process.processName}</strong>
						<div class="nested-dropdown">
							{#each process.pids as pid}
								<label>
									<input
										type="checkbox"
										checked={selectedProcesses.find(
											(selectedProcess) =>
												selectedProcess.processName === process.processName &&
												selectedProcess.processPID === pid
										)}
										on:change={() => handleProcessToggle(process.processName, pid)}
									/>
									{pid}
								</label>
							{/each}
						</div>
					</div>
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
		padding: 2.5rem;
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
		max-height: 200px; /* Adjust the height as needed */
		overflow-y: auto; /* Enables vertical scrolling */
		overflow-x: hidden; /* Hides horizontal scrollbar */
		display: block;
		position: absolute;
		background-color: #f9f9f9;
		min-width: 160px;
		box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
		padding: 12px;
		z-index: 1;
	}

	.nested-dropdown {
		margin-left: 20px;
	}
</style>
