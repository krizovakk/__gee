/*
Vaclav
Slovec 2014-2020
3 typy hnoje (kráva, prase, slepice)
NeOsol
-> MDPI Sustainability
RS data: S2: NDVI, NDWI, LAI
*/


var geom = ee.FeatureCollection('users/krizovakk/slovec')

// Map.addLayer(pt); // adds points to iteractive map
Map.addLayer(geom)
Map.centerObject(geom)

// SENTINEL2 L2A COLLECTION

var collection = ee.ImageCollection("COPERNICUS/S2_SR") // S2_SR = L2A level
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
  .filterDate("2015-04-1", "2020-08-31")
  .filterBounds(geom)
  //.map(maskS2clouds);// 15 elements

print(collection);

// RGB composite

var generate_rgb = function(scene) {
  var dateString = ee.Date(scene.get('system:time_start')).format('yyyyMMdd');
  var selected = scene.select(['B2', 'B3', 'B4']);
  var rgb = selected.expression('b(2)+b(1)+b(0)');
  return rgb.rename(dateString);
};

var RGBcollection = collection.map(generate_rgb);

print(RGBcollection, 'RGBcollection')

// STACK BASIC COLLECTION

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stacked = stackCollection(RGBcollection);
print('stacked', stacked);

Map.addLayer(stacked.select(0).clip(geom), {min:-1, max:1}, 'stacked');

Export.image.toDrive({
 image: stacked,
 description: 'basic',
 scale: 10,
 region: geom,
 maxPixels: 1e9
});

// CALCULATE NDVI

var calculateNDVI = function(scene) {
  // get a string representation of the date.
  var dateString = ee.Date(scene.get('system:time_start')).format('yyyyMMdd');
  var ndvi = scene.normalizedDifference(['B8', 'B4']);
  return ndvi.rename(dateString);
};

var NDVIcollection = collection.map(calculateNDVI);

print(NDVIcollection, 'NDVIcollection')

// STACK

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stackedNDVI = stackCollection(NDVIcollection);
print('stackedNDVI', stackedNDVI);

Map.addLayer(stackedNDVI.select(0).clip(geom), {min:-1, max:1}, 'stackedNDVI');

// EXPORT STACKED

Export.image.toDrive({
 image: stackedNDVI,
 description: 'NDVI',
 scale: 10,
 region: geom,
 maxPixels: 1e9
});

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

// STACK

var stackedNDWI = stackCollection(NDWIcollection);
print('stackedNDWI', stackedNDWI);

Map.addLayer(stackedNDWI.select(0).clip(geom), {min:-1, max:1}, 'stackedNDWI');

// EXPORT STACKED

Export.image.toDrive({
 image: stackedNDWI,
 description: 'NDWI',
 scale: 10,
 region: geom,
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

// STACK

var stackedLAI = stackCollection(LAIcollection);
print('stackedLAI', stackedLAI);

Map.addLayer(stackedLAI.select(0).clip(geom), {min:-1, max:1}, 'stackedLAI');

// EXPORT STACKED

Export.image.toDrive({
 image: stackedLAI,
 description: 'LAI',
 scale: 10,
 region: geom,
 maxPixels: 1e9
});
