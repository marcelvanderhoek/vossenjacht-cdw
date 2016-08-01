$(document).ready(function() {
	var socket = io();
  	socket.on('update', function(bericht){
	  	Date.prototype.timeNow = function () {
	    	return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
		}
	    var tijd = new Date().timeNow();
	    var aantalRijen = $('#logboek tr').length;
	    if (aantalRijen <= 10) {
	   		$('#logboek > tbody').prepend('<tr><td class="tijdstip">' + tijd + '</td><td>' + bericht + '</td></tr>');
	    } else {
	    	$('#logboek tr:last').remove();
	    	$('#logboek > tbody').prepend('<tr><td class="tijdstip">' + tijd + '</td><td>' + bericht + '</td></tr>');
	    	$('#logboek > tbody tr:nth-child(1)').effect("highlight", 1000);
	    }
	});

	$('#nieuwevos').click(function(event) {
		event.preventDefault();
		
		var nummer = $('#nummer').val();
		var naam = $('#naam').val();
		var omschrijving = $('#omschrijving').val();
		var locatieLat = $('#locatielat').val();
		var locatieLong = $('#locatielong').val();
		var url = '../api/vos/maak';

		if(nummer !== '' && naam !== '' && omschrijving !== '' && locatieLat !== '' && locatieLong !== '') {
			$.post(url, {
				naam: naam,
				nummer: nummer,
				beschrijving: omschrijving,
				locatieLong: locatieLong,
				locatieLat: locatieLat
			});
			location.reload();
		} else {
		}
	});

	$('a.verwijder-vos').click(function(event) { // Lelijk
		event.preventDefault();
		var doel = event.target.href;
		$.getJSON(doel, function(vos) {
			location.reload();
		});				
	});

	$('#instellingen-opslaan').click(function(event) {
		event.preventDefault();
		var eindtijd = $('#eindtijd').val();
		var url = '../api/instelling/update';

		$.post(url, {
			eindtijd: eindtijd
		});

		location.reload();
	});

});