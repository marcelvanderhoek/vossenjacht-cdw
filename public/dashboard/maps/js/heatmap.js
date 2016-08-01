$(function($) {
    // API asynchroon laden...
    var script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDwM5Co4Ya8j2FZ0LVHhUuLFIEj9pZtauk&language=nl&libraries=visualization&region=NL&callback=initialize";
    document.body.appendChild(script);
});

function initialize() {
    var map;
   
    function laadLocaties(callback) {
        $.getJSON( '../../api/vossen', function( vossen ) {
            var locaties = [];
            $.each(vossen, function(key, vos) {
                huidigeVos = {location: new google.maps.LatLng(vos.locatieLat, vos.locatieLong), weight: vos.gevangen};
                locaties.push(huidigeVos);
                console.log(vos.gevangen);
            });
            callback(locaties);
        });
    }
    
    laadLocaties(function(locaties) {
        var ouderkerk = new google.maps.LatLng(51.931936, 4.639085);
        map = new google.maps.Map(document.getElementById('map'), {
          center: ouderkerk,
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        var heatmap = new google.maps.visualization.HeatmapLayer({
          data: locaties,
          radius: 30, // hoeveel invloed moet 1 vos hebben op de kaart? (px)
          opacity: 0.8
        });
        heatmap.setMap(map);
    });
}