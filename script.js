mapboxgl.accessToken =
  "pk.eyJ1Ijoic2lha2FyYW1hbGVnb3MiLCJhIjoiY2s5bXo4dXVrMTZsczNrcGhremVjdmprYSJ9.IdrQnWUp4D1wBnWxh6T9ow";
const initialZoom = 6
const geojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [26.161880493164062, 37.60498423376982]
      },
      properties: {
        title: "Ikaria",
        description: "Ikaria (Greek: Ικαρία), is a Greek island in the Aegean Sea. According to tradition, it derives its name from Icarus, the son of Daedalus in Greek mythology, who was believed to have fallen into the sea nearby."
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [25.435409545898438, 36.40014547452743]
      },
      properties: {
        title: "Santorini",
        description: "Santorini, officially Thira (Greek: Θήρα), is an island in the southern Aegean Sea. It is part of a circular archipelago which is the remnant of a volcanic caldera. The island was the site of one of the largest volcanic eruptions in recorded history: the Minoan eruption about 3,600 years ago"
      }
    },
  ]
};

function getCenter(geojson) {
  let lats = []
  let longs = []
  geojson.features.forEach(element => {
    lats = [...lats, element.geometry.coordinates[0]]
    longs = [...longs, element.geometry.coordinates[1]]
  });
  centerLats = (Math.max(...lats) - Math.min(...lats)) / 2 + Math.min(...lats)
  centerLongs = (Math.max(...longs) - Math.min(...longs)) / 2 + Math.min(...longs)
  return [centerLats, centerLongs]
}

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/outdoors-v11",
  center: getCenter(geojson),
  zoom: initialZoom
});
const nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'bottom-right');

function renderMap() {
  // Add the geojson data points
  map.addSource("points", {
    type: "geojson",
    data: geojson
  });

  // Add a symbol layer for the geojson data.
  map.addLayer({
    id: "symbols",
    type: "symbol",
    source: "points",
    layout: {
      "icon-image": "mountain-15",
      "icon-size": 1
    }
  });

  // When a click event occurs on a feature in the symbols layer, open a popup at the
  // location of the feature, with description HTML from its properties.
  map.on('click', 'symbols', function (e) {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const {description, title} = e.features[0].properties;
    const html = `<h3>${title}</h3><p>${description}</p><button id="zoom-in">Zoom in</button><button id="zoom-out">Zoom out</button>`

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Also seems to re-center the map to the clicked symbol
    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(map);

    [].slice.call(document.querySelectorAll('#zoom-in')).pop().onclick = function () {
      map.zoomTo(11, { duration: 9000 });
    };
    [].slice.call(document.querySelectorAll('#zoom-out')).pop().onclick = function () {
      map.zoomTo(initialZoom, { duration: 9000 });
    };
  });

  // Change the cursor to a pointer when the mouse is over the symbols layer.
  map.on('mouseenter', 'symbols', function () {
    map.getCanvas().style.cursor = 'pointer';
  });

  // Change it back to a pointer when it leaves.
  map.on('mouseleave', 'symbols', function () {
    map.getCanvas().style.cursor = '';
  });

  // Add sea floor shading
  map.addSource('10m-bathymetry-81bsvj', {
    type: 'vector',
    url: 'mapbox://mapbox.9tm8dx88'
  });

  map.addLayer(
    {
      'id': '10m-bathymetry-81bsvj',
      'type': 'fill',
      'source': '10m-bathymetry-81bsvj',
      'source-layer': '10m-bathymetry-81bsvj',
      'layout': {},
      'paint': {
        'fill-outline-color': 'hsla(337, 82%, 62%, 0)',
        // cubic bezier is a four point curve for smooth and precise styling
        // adjust the points to change the rate and intensity of interpolation
        'fill-color': [
          'interpolate',
          ['cubic-bezier', 0, 0.5, 1, 0.5],
          ['get', 'DEPTH'],
          200,
          '#78bced',
          9000,
          '#15659f'
        ]
      }
    },
    'land-structure-polygon'
  );
}

map.on('load', renderMap)
map.on("click", "symbols", function (e) {
  map.flyTo({ center: e.features[0].geometry.coordinates });
});
