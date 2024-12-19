const saveButton = document.querySelector('.fa-floppy-disk');

saveButton.addEventListener('click', () => {
	const noteTitle = document.querySelector('.note-title');

	if (!noteTitle.value) return window.alert('Please enter a title.');

	saveNote(currentNoteDisplayed);
});
