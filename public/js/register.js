// Handle Register
document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('create-account-form');

	form.addEventListener('submit', async (event) => {
		// Prevent default form submission
		event.preventDefault();

		// Collect form data
		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());

		try {
			// Send data to the server using fetch
			const response = await fetch('/create-account', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			// Handle the response
			const result = await response.json();

			if (response.ok) {
				// Success message or redirect
				alert('Account created successfully!');
				window.location.href = '/'; // Example redirect
			} else {
				// Show error notification
				alert(result.message || 'An error occurred.');
			}
		} catch (error) {
			// Handle network or other errors
			console.error('Error:', error);
			alert('Something went wrong. Please try again later.');
		}
	});
});
