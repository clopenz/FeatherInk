// Display user data on main page
if (window.location.pathname === '/') {
	displayUserData();
	checkIfLoggedIn();

	async function displayUserData() {
		const token = localStorage.getItem('token');

		if (token) {
			try {
				const userData = await getUserData();

				const accountName = document.querySelector('.account-name');
				accountName.textContent = userData.username;
			} catch (error) {
				console.error('Failed to fetch user data:', error);
			}
		} else {
			console.log('User not logged in');
		}
	}
}

// Handle Login
async function handleLogin(e) {
	e.preventDefault();
	const formData = new FormData(e.target);

	try {
		const response = await fetch('/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(Object.fromEntries(formData.entries())),
		});

		const result = await response.json();

		if (response.ok && result.token) {
			localStorage.setItem('token', result.token);

			window.location.href = '/';
		} else {
			console.error('Failed to login:', result.message);
		}
	} catch (error) {
		console.error('Failed to login:', error);
	}
}

// Get user data from the token
async function getUserData() {
	const token = localStorage.getItem('token');

	const response = await fetch('/user-data', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await response.json();
	console.log('User Data:', data);

	return data;
}

// Handle Logout
function checkIfLoggedIn() {
	const token = localStorage.getItem('token');
	if (token) {
		const signOutBtn = document.querySelector('.header-modal-item.login');

		signOutBtn.textContent = 'Sign Out';

		signOutBtn.addEventListener('click', handleLogout);
	}
}

function handleLogout() {
	localStorage.removeItem('token');
}
