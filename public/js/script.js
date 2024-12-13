// Check and remove token
window.onload = () => checkAndRemoveToken();

// Display user data on main page
if (window.location.pathname === '/') {
	displayUserName();
	displayUserNotes();
	checkIfLoggedIn();
}

// Display User's Name
async function displayUserName() {
	const accountName = document.querySelector('.account-name');
	const token = localStorage.getItem('token');
	const refreshToken = localStorage.getItem('refreshToken');

	if (token || refreshToken) {
		try {
			const userData = await getUserData(token, refreshToken);
			accountName.textContent = userData.username;
		} catch (error) {
			console.error('Failed to fetch user data:', error);
		}
	} else {
		accountName.textContent = 'Sign In';
	}
}

// Display Notes
async function displayUserNotes() {
	const token = localStorage.getItem('token');
	const refreshToken = localStorage.getItem('refreshToken');

	if (token || refreshToken) {
		try {
			const notes = await getUserNotes(token, refreshToken);
			console.log(notes);
			if (notes) {
				const noteListItems = document.querySelector('.note-list-items');

				notes.forEach((note) => {
					const noteItem = document.createElement('li');
					noteItem.classList.add('note-list-item');
					noteItem.innerHTML = `
						<div class="note-list-title">${note.title}</div>
						<div class="note-list-subtitle">${note.subtitle}</div>
						<div class="note-list-date">${note.createdAt}</div>
					`;
					noteListItems.appendChild(noteItem);
				});
			}
		} catch (error) {
			console.error('Failed to fetch user notes:', error);
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
			localStorage.setItem('refreshToken', result.refreshToken);

			window.location.href = '/';
		} else {
			console.error('Failed to login:', result.message);
		}
	} catch (error) {
		console.error('Failed to login:', error);
	}
}

// Get user data from the token
async function getUserData(token, refreshToken) {
	const response = await fetch('/user-data', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token ? token : refreshToken}`,
		},
	});

	const data = await response.json();

	return data;
}

// Fetch user's notes
async function getUserNotes(token, refreshToken) {
	const response = await fetch('/user-notes', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token ? token : refreshToken}`,
		},
	});

	const data = await response.json();

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
	localStorage.removeItem('refreshToken');
}

function checkAndRemoveToken() {
	const token = localStorage.getItem('token');

	if (token && isTokenExpired(token)) {
		localStorage.removeItem('token');
	}
}

function isTokenExpired(token) {
	const payload = JSON.parse(atob(token.split('.')[1]));
	const now = Math.floor(Date.now() / 1000);
	return payload.exp < now;
}
