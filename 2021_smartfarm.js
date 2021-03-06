/*
SMART FARM project
aoi = 6 plots
pts = 18 sampling points
yield potential map
  NDVI
*/

// IMPORT AOIs

var pts = ee.FeatureCollection('users/krizovakk/2021_smartfarm_point')
var aoi = ee.FeatureCollection('users/krizovakk/smartfarm_polygon_32633')

Map.centerObject(aoi)
Map.addLayer(aoi)
Map.addLayer(pts)


// SENTINEL2 L2A COLLECTION

var collection = ee.ImageCollection("COPERNICUS/S2_SR") // S2_SR = L2A level
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
  .filterDate("2015-05-1", "2020-08-31")
  .filter(ee.Filter.calendarRange(5,6, 'month'))
  .filterBounds(aoi)

print(collection, 'S2collection');

// CALCULATE NDVI

var calculateNDVI = function(scene) {
  // get a string representation of the date.
  var dateString = ee.Date(scene.get('system:time_start')).format('yyyyMMdd');
  var ndvi = scene.normalizedDifference(['B8', 'B4']);
  return ndvi.rename(dateString);
};

var NDVIcollection = collection.map(calculateNDVI);

print(NDVIcollection, 'NDVIcollection')

// stack imagery into a single multiple-band image

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stackedNDVI = stackCollection(NDVIcollection);
print('stackedNDVI', stackedNDVI);

Map.addLayer(stackedNDVI.select(0).clip(aoi), {min:-1, max:1}, 'stackedNDVI');

// export stacked

Export.image.toDrive({
 image: stackedNDVI,
 description: 'NDVI',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

/*

// CALCULATE NDWI

var calculateNDWI = function(scene) {
  // get a string representation of the date.
  var dateString = ee.Date(scene.get('system:time_start')).format('yyyyMMdd');
  var selected = scene.select('B8', 'B12');
  //var ndwi = selected.expression('(B8-B12)/(B8+B12)');
  var ndwi = selected.expression('(b(0)-b(1))/(b(0)+b(1))');
  return ndwi.rename(dateString);
};

var NDWIcollection = collection.map(calculateNDWI);

print(NDWIcollection, 'NDWI collection')

// stack NDWI

var stackedNDWI = stackCollection(NDWIcollection);
print('stackedNDWI', stackedNDWI);

Map.addLayer(stackedNDWI.select(0).clip(aoi), {min:-1, max:1}, 'stackedNDWI');

// export stacked NDWI

Export.image.toDrive({
 image: stackedNDWI,
 description: 'NDWI',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

// CALCULATE LAI

var calculateLAI = function(scene) {
  // get a string representation of the date.
  var dateString = ee.Date(scene.get('system:time_start')).format('yyyyMMdd');
  var selected = scene.select('B2', 'B4', 'B8');
  //var evi = selected.expression('2.5*((b(2)-b(1))/(b(2)+6*b(1)-7.5*b(0)+1))');
  var lai = selected.expression('3.618*(2.5*((b(2)-b(1))/(b(2)+6*b(1)-7.5*b(0)+1)))-0.118');
  return lai.rename(dateString);
};

var LAIcollection = collection.map(calculateLAI);

print(LAIcollection, 'LAI collection')

// stack LAI

var stackedLAI = stackCollection(LAIcollection);
print('stackedLAI', stackedLAI);

Map.addLayer(stackedLAI.select(0).clip(aoi), {min:-1, max:1}, 'stackedLAI');

// export stacked LAI

Export.image.toDrive({
 image: stackedLAI,
 description: 'LAI',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});
*/
