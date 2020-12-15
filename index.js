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

function isViolent(datapoint) {
    return (datapoint.incident_category.indexOf("Assault") > -1) ||
        (datapoint.incident_category.indexOf("Weapons") > -1) ||
        (datapoint.incident_category.indexOf("Sex") > -1) ||
        (datapoint.incident_description.indexOf("Death") > -1);
}

function isRobbery(datapoint) {
    return (datapoint.incident_category.indexOf("Robbery") > -1) ||
        (datapoint.incident_category.indexOf("Theft") > -1) ||
        (datapoint.incident_category.indexOf("Burglary") >= -1) ||
        (datapoint.incident_category.indexOf("Stolen") > -1);
}

function isNonCrim(datapoint) {
    return (datapoint.incident_category.indexOf("Non-Criminal") > -1);
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
    //const names = noEmpties.map(n => n.incident_category)
    //const names =noEmpties.map(n => n.incident_description)
    //console.log([...new Set(names)]);
    var filteredData = noEmpties.filter(data => inBounds(data.latitude, data.longitude, nwLat, nwLng, seLat, seLng));
    filteredData.sort((a, b) => new Date(b.incident_datetime) - new Date(a.incident_datetime));
    console.error("************** Incidents in this area ***************")
    var heatmapData = filteredData.map(datapoint => {
        console.log(datapoint.incident_datetime, datapoint.incident_category, datapoint.incident_subcategory, datapoint.incident_description, datapoint.resolution);
        if (datapoint.latitude && datapoint.longitude) {
            var point = new google.maps.LatLng(datapoint.latitude, datapoint.longitude);
            if (isViolent(datapoint)) {
                return {location: point, weight: 8}
            } if (isRobbery(datapoint)) {
                return {location: point, weight: 2}
            } if (isNonCrim(datapoint)) {
                return {location: point, weight: 0.5}
            }
            else {
                return point;
            }
        } else {
            return;
        }
    });
    console.error(`****  ${heatmapData.length} reported incidents in this area since 2018`)
    var cleanHeatmapData = heatmapData.filter(n => n);
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: cleanHeatmapData
    });
    heatmap.set("radius", heatmap.get("radius") ? null : 20);

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

