$(function($) {
    // API asynchroon laden...
    var script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDwM5Co4Ya8j2FZ0LVHhUuLFIEj9pZtauk&language=nl&region=NL&callback=initialize";
    document.body.appendChild(script);
});

function initialize() {
    var map;
    var bounds = new google.maps.LatLngBounds();
    var mapOptions = {
        mapTypeId: 'roadmap',
        mapTypeControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM
        }
    };
    
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    
    function laadLocaties(callback) {
        $.getJSON( '../../api/vossen', function( vossen ) {
            var locaties = [];
            $.each(vossen, function(key, vos) {
                huidigeVos = [vos.naam, vos.locatieLat, vos.locatieLong];
                locaties.push(huidigeVos);
            });
            callback(locaties);
        });
    }
    
    laadLocaties(function(locaties) {
        // Info Window Content
        var infoWindow = new google.maps.InfoWindow(), marker, i;

        for( i = 0; i < locaties.length; i++ ) {
            var position = new google.maps.LatLng(locaties[i][1], locaties[i][2]);
            bounds.extend(position);
            marker = new google.maps.Marker({
                position: position,
                map: map,
                title: locaties[i][0]
            });     
        }

        map.fitBounds(bounds);
        var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
            this.setZoom(15);
            google.maps.event.removeListener(boundsListener);
        });
    });
}