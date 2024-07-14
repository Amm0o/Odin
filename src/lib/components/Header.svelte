<header>
	<div class="title">Cloud Vigilante</div>
	<nav>
		<a href="/device-inventory" class="links" style="text-decoration: none;">Device Inventory</a>
		<a href="/" class="links" style="text-decoration: none;">Metrics</a>
		<a href="/onboard" class="links" style="text-decoration: none;">Onboard</a>
	</nav>
	<div class="logout">
		<a href="/logout" style="text-decoration: none; color: white;">Logout</a>
	</div>
</header>

<style>
	.title {
		color: white;
		font-size: 30px;
		letter-spacing: 5px;
		font-weight: 600;
	}
	header {
		background-color: #2c3e50;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30px 30px;
	}
	.title {
		flex-grow: 1;
	}
	nav {
		display: flex;
		justify-content: center;
		flex-grow: 2;
	}
	.links {
		margin: 0 10px;
		color: white;
		font-weight: 700;
	}
	.logout {
		text-decoration: none;
		color: white;
		font-weight: 700;
		flex-grow: 1;
		text-align: right;
	}

	.logout a {
		display: inline-block; /* Allows width and height to be set */
		width: 158px;
		height: 59px;
		background-color: #3498db;
		color: white; /* Assuming you want the text color to be white */
		text-align: center; /* Centers the text horizontally */
		line-height: 59px; /* Centers the text vertically */
		border-radius: 10px; /* Rounded corners */
		text-decoration: none; /* Removes underline from the link */
	}
</style>
