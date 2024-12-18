const tabsItems = document.querySelector('.tabs-items');

// Listen for the mouse wheel event
tabsItems.addEventListener('wheel', (event) => {
	event.preventDefault(); // Prevent vertical scrolling

	tabsItems.scrollLeft += event.deltaY; // Scroll horizontally
});
