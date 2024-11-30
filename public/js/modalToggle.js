// Open and Close Account Modal
const headerModal = document.querySelector('.header-modal');
const menuToggleOpen = document.querySelector('.header-menu');
const menuToggleClose = document.querySelector('.menu-toggle-close');

menuToggleOpen.addEventListener('click', (e) => {
	e.stopPropagation();
	headerModal.classList.remove('hidden');
});

menuToggleClose.addEventListener('click', (e) => {
	e.stopPropagation();
	headerModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
	e.stopPropagation();
	console.log(e.target);

	if (!headerModal.contains(e.target) && !menuToggleClose.contains(e.target)) {
		headerModal.classList.add('hidden');
	}
});
