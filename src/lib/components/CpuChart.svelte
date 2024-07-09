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
            (selectedProcess) => selectedProcess.processName === processName && selectedProcess.processPID === processPID
        );

        if (index === -1) {
            selectedProcesses = [...selectedProcesses, { processName, processPID }];
        } else {
            selectedProcesses = selectedProcesses.filter(
                (selectedProcess) => !(selectedProcess.processName === processName && selectedProcess.processPID === processPID)
            );
        }
		initializeChart();
	}

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	function toggleProcessDropdown(processName) {
        processDropdowns.set(processName, !processDropdowns.get(processName));
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
				tenantID: 'c6b06d8d-cc92-4f26-8c44-b348a416fffd',
				query: {
					numberOfProcesses: 0,
					devices: [],
					timeRange: {
						start: '2024-06-25T00:00:00Z',
						end: '2024-07-30T23:59:59Z'
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
				<div>
					<strong>{process.processName}</strong>
					<div class="nested-dropdown">
						{#each process.pids as pid}
							<label>
								<input
									type="checkbox"
									checked={selectedProcesses.find(
										(selectedProcess) => selectedProcess.processName === process.processName && selectedProcess.processPID === pid
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

	.nested-dropdown {
        margin-left: 20px;
    }
</style>
