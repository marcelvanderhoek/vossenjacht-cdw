// selectors
var sluiten = document.getElementById('sluiten');
var overlay = document.getElementById('modal');
var overlayInhoud = document.getElementById('overlayInhoud');

// functies
function toggle(element) {
	if (element.style.display === '') {
		element.style.display = 'none';
	} else {
		element.style.display = '';
	}
}

// event listeners
if(overlay !== null) {
	sluiten.addEventListener('click', function() {
		toggle(overlay);
	});
}