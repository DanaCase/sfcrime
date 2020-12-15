let map;
let dataArr = [];

async function initMap() {
  map = await new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.7727855, lng: -122.3983158 },
    zoom: 15,
  });
}


async function fetchIt(offset){
    const url = `https://data.sfgov.org/resource/wg3w-h783.json`;
    const encoded = encodeURI(url);
    response =  await fetch(encoded)
    const data = await response.json();
    dataArr = dataArr.concat(data);
    if (data.length === 50000) {
        await fetchIt(offset + 50000);
    }

}

function inBounds(lat, lng, nwLat, nwLng, seLat, seLng) {
    return  ((lat <= nwLat && lat >= seLat) && (lng >= nwLng && lng <= seLng));
}

async function render() {
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast(); // LatLng of the north-east corner
    var sw = bounds.getSouthWest(); // LatLng of the south-west corder
    var nwLat = ne.lat();
    var nwLng = sw.lng();
    var seLat = sw.lat();
    var seLng = ne.lng();
    await fetchIt(0);
    const noEmpties = dataArr.filter(n => n);
    var filteredData = noEmpties.filter(data => inBounds(data.latitude, data.longitude, nwLat, nwLng, seLat, seLng));
    var heatmapData = filteredData.map(datapoint => {
        if (datapoint.latitude && datapoint.longitude) {
            var point = new google.maps.LatLng(datapoint.latitude, datapoint.longitude);
            return point;
        }
    });
    var cleanHeatmapData = heatmapData.filter(n => n);
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: cleanHeatmapData
    });
    heatmap.setMap(map);
}

async function main2() {
    await initMap();
    google.maps.event.addListener(map, 'idle', render);
    await render();

}
async function main() {

    setTimeout(main2, 500);
}

main();

