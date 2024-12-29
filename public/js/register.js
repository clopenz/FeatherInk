document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('create-account-form');

	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());

		try {
			const response = await fetch('/create-account', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			if (!response.headers.get('content-type')?.includes('application/json')) {
				const text = await response.text();
				console.error('Unexpected response:', text);
				alert('Unexpected server response. Please try again.');
				return;
			}

			const result = await response.json();

			if (response.ok) {
				alert('Account created successfully!');
				window.location.href = '/';
			} else {
				alert(result.message || 'An error occurred.');
			}
		} catch (error) {
			console.error('Error:', error);
			alert('Something went wrong. Please try again later.');
		}
	});
});
