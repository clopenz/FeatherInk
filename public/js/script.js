let notesList = [];

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

			notesList = notes;

			if (notes) {
				const noteListItems = document.querySelector('.note-list-items');
				const tabsItems = document.querySelector('.tabs-items');

				notes.forEach((note) => {
					const noteItem = document.createElement('li');
					noteItem.classList.add('note-list-item');
					noteItem.innerHTML = `
						<div class="note-list-title">${note.title}</div>
						<div class="note-list-subtitle">${note.subtitle}</div>
						<div class="note-list-date">${note.createdAt}</div>
					`;
					noteListItems.appendChild(noteItem);

					// Add click event to create a tab
					noteItem.addEventListener('click', () => {
						const existingTab = [...tabsItems.children].find(
							(tab) => tab.dataset.id === note._id
						);

						if (existingTab) {
							setActiveTab(existingTab);
							displayNoteonMainContent(note);
							return;
						}

						// Create new tab
						const newTab = document.createElement('li');
						newTab.innerHTML = `
							<p>${note.title}</p>
							<div class="close-button"><i class="fa-solid fa-xmark"></i></div>
						`;
						newTab.dataset.id = note._id;
						newTab.classList.add('tabs-item');
						newTab.classList.add('active');

						newTab.addEventListener('click', () => {
							setActiveTab(newTab);
							displayNoteonMainContent(note);
						});

						newTab
							.querySelector('.close-button')
							.addEventListener('click', (e) => {
								e.stopPropagation();

								const wasActive = newTab.classList.contains('active');
								closeTab(newTab);

								if (wasActive) {
									const firstTab = [...tabsItems.children][0];
									if (firstTab) {
										setActiveTab(firstTab);
										const firstNote = getUserNoteById(firstTab.dataset.id);

										displayNoteonMainContent(firstNote);
									} else {
										const emptyNote = {
											title: '',
											subtitle: '',
											content: '',
										};

										displayNoteonMainContent(emptyNote);
									}
								}
							});

						tabsItems.insertBefore(newTab, tabsItems.firstChild);
						setActiveTab(newTab);

						// Display note content
						displayNoteonMainContent(note);
					});
				});
			}
		} catch (error) {
			console.error('User not logged in');
		}
	}
}

// Helper to set active tab
function setActiveTab(tab) {
	const tabsItems = document.querySelector('.tabs-items');
	[...tabsItems.children].forEach((t) => t.classList.remove('active'));
	tab.classList.add('active');
}

// Close tab
function closeTab(tab) {
	const tabsItems = document.querySelector('.tabs-items');
	tabsItems.removeChild(tab);
}

// Display notes on main content
function displayNoteonMainContent(note) {
	const noteContentWrapper = document.querySelector('.note-content-wrapper');
	const noteTitle = document.querySelector('.note-title');
	const noteSubtitle = document.querySelector('.note-subtitle');
	const noteContent = document.querySelector('.note-content');

	noteTitle.value = note.title;
	noteSubtitle.value = note.subtitle;
	noteContent.value = note.content;
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

// Get user's note by ID
function getUserNoteById(noteId) {
	return notesList.find((note) => note._id === noteId);
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

// Save note
function saveNote() {

}

// Create Note
function createNote() {

}

// Delete Note
function deleteNote() {
	
}