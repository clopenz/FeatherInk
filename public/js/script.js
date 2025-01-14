let notesList = [];
let currentNoteDisplayed = {};
let activeTab = null;

// Check and remove token
window.onload = () => {
	checkAndRemoveToken();
	setDarkMode();
};

// Display user data on main page
if (window.location.pathname === '/') {
	displayUserName();
	displayUserNotes();
	checkIfLoggedIn();
}

// Display User's Name
async function displayUserName() {
	const accountName = document.querySelector('.account-name');
	const token =
		localStorage.getItem('token') || localStorage.getItem('refreshToken');

	if (token) {
		try {
			const userData = await getUserData(token);
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
	const token =
		localStorage.getItem('token') || localStorage.getItem('refreshToken');

	const noteListItems = document.querySelector('.note-list-items');
	noteListItems.innerHTML = '';

	if (token) {
		try {
			const notes = await getUserNotes(token);

			notesList = notes;

			if (notes) {
				const noteListItems = document.querySelector('.note-list-items');

				notes.forEach((note) => {
					const noteItem = document.createElement('li');
					noteItem.classList.add('note-list-item');

					const date = new Date(note.updatedAt).toLocaleString('en-US');

					noteItem.innerHTML = `
						<div class="note-list-title">${note.title}</div>
						<div class="note-list-subtitle">${note.subtitle}</div>
						<div class="note-list-date">${date}</div>
						<div class="delete-note"><i class="fa-solid fa-trash-can"></i>
						<span class="hover-label delete-label">Delete Note</span>
						</div>
					`;
					noteListItems.appendChild(noteItem);

					// Add click event to delete note
					const deleteNoteBtn = noteItem.querySelector('.delete-note');
					deleteNoteBtn.addEventListener('click', (e) => {
						e.stopPropagation();

						if (window.confirm('Are you sure you want to delete this note?'))
							deleteNote(note);
						else {
							return;
						}
					});

					// Add click event to create a tab
					noteItem.addEventListener('click', () => {
						createTab(note);
					});
				});
			}
		} catch (error) {
			console.error('Error', error);
		}
	}
}

// Create new tab
function createTab(note) {
	const tabsItems = document.querySelector('.tabs-items');

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

	newTab.querySelector('.close-button').addEventListener('click', (e) => {
		e.stopPropagation();

		closeTab(newTab);
	});

	tabsItems.insertBefore(newTab, tabsItems.firstChild);
	setActiveTab(newTab);

	// Display note content
	displayNoteonMainContent(note);
}

// Update tab title
function updateTabTitle(tab, title) {
	tab.querySelector('p').textContent = title;
}

// Helper to set active tab
function setActiveTab(tab) {
	const tabsItems = document.querySelector('.tabs-items');
	[...tabsItems.children].forEach((t) => t.classList.remove('active'));
	tab.classList.add('active');

	activeTab = tab;
}

// Close tab
function closeTab(tab) {
	const tabsItems = document.querySelector('.tabs-items');
	let tabElement;

	if (typeof tab === 'string') {
		tabElement = document.querySelector(`[data-id="${tab}"]`);
	} else {
		tabElement = document.querySelector(`[data-id="${tab.dataset.id}"]`);
	}

	if (tabElement) {
		const wasActive = tabElement.classList.contains('active');
		tabElement.remove();

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
	}
}

// Display notes on main content
function displayNoteonMainContent(note) {
	const noteTitle = document.querySelector('.note-title');
	const noteSubtitle = document.querySelector('.note-subtitle');
	const noteContent = document.querySelector('.note-content');

	noteTitle.value = note.title;
	noteSubtitle.value = note.subtitle;
	noteContent.value = note.content;

	currentNoteDisplayed = note;
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
			alert('Invalid credentials');
		}
	} catch (error) {
		alert('Invalid credentials');
	}
}

// Get user data from the token
async function getUserData(token) {
	const response = await fetch('/user-data', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await response.json();

	return data;
}

// Fetch user's notes
async function getUserNotes(token) {
	const response = await fetch('/user-notes', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
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
	const token =
		localStorage.getItem('token') || localStorage.getItem('refreshToken');

	if (token) {
		const signOutBtn = document.querySelector('.header-modal-item.login');

		signOutBtn.textContent = 'Sign Out';

		signOutBtn.addEventListener('click', handleLogout);
	} else {
		window.location.href = '/login';
	}
}

function handleLogout() {
	localStorage.removeItem('token');
	localStorage.removeItem('refreshToken');
}

function checkAndRemoveToken() {
	const token =
		localStorage.getItem('token') || localStorage.getItem('refreshToken');
	const refreshToken = localStorage.getItem('refreshToken');

	if (token && isTokenExpired(token)) {
		localStorage.removeItem('token');
		window.location.href = '/';
	}

	if (refreshToken && isTokenExpired(refreshToken)) {
		localStorage.removeItem('refreshToken');
		window.location.href = '/';
	}
}

function isTokenExpired(token) {
	const payload = JSON.parse(atob(token.split('.')[1]));
	const now = Math.floor(Date.now() / 1000);
	return payload.exp < now;
}

// Save note
async function saveNote(note) {
	const token =
		localStorage.getItem('token') || localStorage.getItem('refreshToken');
	const noteTitleForm = document.querySelector('.note-title');
	const noteSubtitleForm = document.querySelector('.note-subtitle');
	const noteContentForm = document.querySelector('.note-content');

	const noteAlreadyExists = getUserNoteById(note._id);

	if (noteAlreadyExists) {
		try {
			const response = await fetch('/save-note', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					noteId: note._id,
					title: noteTitleForm.value,
					subtitle: noteSubtitleForm.value,
					content: noteContentForm.value,
				}),
			});

			if (response.ok) {
				const data = await response.json();

				await updateTabTitle(activeTab, noteTitleForm.value);

				await displayUserNotes();
			} else {
				console.error('Failed to create note:', response.statusText);
			}
		} catch (error) {
			console.error('Failed to save note:', error);
		}
	} else if (noteTitleForm.value) {
		const n = {
			title: noteTitleForm.value,
			subtitle: noteSubtitleForm.value,
			content: noteContentForm.value,
		};

		createNote(n);
	} else {
		createNote();
	}
}

// Create Note
async function createNote(note) {
	const token =
		localStorage.getItem('token') || localStorage.getItem('refreshToken');

	let noteTitle = 'Untitled';
	let noteSubtitle = '';
	let noteContent = '';

	if (note.title || note.subtitle || note.content) {
		noteTitle = note.title;
		noteSubtitle = note.subtitle;
		noteContent = note.content;
	}

	try {
		const response = await fetch('/create-note', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				title: noteTitle,
				subtitle: noteSubtitle,
				content: noteContent,
			}),
		});

		if (response.ok) {
			const data = await response.json();

			await createTab(data.note);
			await displayUserNotes();
		} else {
			console.error('Failed to create note:', response.statusText);
		}
	} catch (error) {
		console.error('Failed to create note:', error);
	}
}

// Delete Note
async function deleteNote(note) {
	const token =
		localStorage.getItem('token') || localStorage.getItem('refreshToken');
	try {
		const response = await fetch('/delete-note', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				noteId: note._id,
			}),
		});

		if (response.ok) {
			await displayUserNotes();

			await closeTab(note._id);
		} else {
			console.error('Failed to create note:', response.statusText);
		}
	} catch (error) {
		console.error('Failed to delete note:', error);
	}
}

// Download Button Listener
const downloadButton = document.querySelector('.download-notes-btn');
downloadButton.addEventListener('click', downloadNotes);

// Download Notes
async function downloadNotes() {
	const token =
		localStorage.getItem('token') || localStorage.getItem('refreshToken');
	try {
		const response = await fetch('/download-notes', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (response.ok) {
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = 'notes.json';
			document.body.appendChild(a);
			a.click();
			URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} else {
			const errorData = await response.json();
			alert(`Failed to download notes: ${errorData.message}`);
		}
	} catch (error) {
		console.error('Error Downloading Notes:', error);
		alert('An error occurred while downloading notes.');
	}
}

// Dark Mode
const darkModeToggle = document.querySelector(
	'.header-modal-item.dark-mode-btn'
);

darkModeToggle.addEventListener('click', () => {
	toggleDarkMode();
});

function toggleDarkMode() {
	document.body.classList.toggle('dark-mode');
	if (document.body.classList.contains('dark-mode')) {
		darkModeToggle.textContent = 'Light Mode';
		localStorage.setItem('darkMode', 'true');
	} else {
		darkModeToggle.textContent = 'Dark Mode';
		localStorage.removeItem('darkMode');
	}
}

function setDarkMode() {
	if (localStorage.getItem('darkMode') === 'true') {
		document.body.classList.add('dark-mode');
		darkModeToggle.textContent = 'Light Mode';
	}
}

// Close Note Button
const closeNoteButton = document.querySelector('.note-close-btn');
const noteListWrapper = document.querySelector('.note-list-wrapper');

closeNoteButton.addEventListener('click', () => {
	if (noteListWrapper.style.display === 'none') {
		noteListWrapper.style.display = 'block';
		closeNoteButton.style.left = '223px';
		closeNoteButton.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
	} else {
		noteListWrapper.style.display = 'none';
		closeNoteButton.style.left = '0px';
		closeNoteButton.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
	}
});
