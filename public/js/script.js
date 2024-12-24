let notesList = [];
let currentNoteDisplayed = {};
let activeTab = null;

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

	const noteListItems = document.querySelector('.note-list-items');
	noteListItems.innerHTML = '';

	if (token || refreshToken) {
		try {
			const notes = await getUserNotes(token, refreshToken);

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
	tabsItems.removeChild(tab);

	const wasActive = tab.classList.contains('active');

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
	const refreshToken = localStorage.getItem('refreshToken');
	if (token || refreshToken) {
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

// Save note listener
const saveButton = document.querySelector('.fa-floppy-disk');

saveButton.addEventListener('click', () => {
	const noteTitle = document.querySelector('.note-title');

	if (!noteTitle.value) return window.alert('Please enter a title.');

	saveNote(currentNoteDisplayed);
});

// Save note
async function saveNote(note) {
	const token = localStorage.getItem('token');
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
					Authorization: `Bearer ${token ? token : refreshToken}`,
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

// Add note listener
const addNoteBtn = document.querySelector('.add-note');
addNoteBtn.addEventListener('click', createNote);

// Create Note
async function createNote(note) {
	const token = localStorage.getItem('token');

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
				Authorization: `Bearer ${token ? token : refreshToken}`,
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
	const token = localStorage.getItem('token');
	try {
		const response = await fetch('/delete-note', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token ? token : refreshToken}`,
			},
			body: JSON.stringify({
				noteId: note._id,
			}),
		});

		if (response.ok) {
			await displayUserNotes();
			await closeTab(activeTab);
		} else {
			console.error('Failed to create note:', response.statusText);
		}
	} catch (error) {
		console.error('Failed to delete note:', error);
	}
}
