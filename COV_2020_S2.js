var geom = ee.FeatureCollection('users/krizovakk/bacina21_point')

// Map.addLayer(pt); // adds points to iteractive map
Map.addLayer(cov) // polygons representing COV1, COV2
Map.addLayer(geom) // sampling points within cov
Map.centerObject(cov)
Map.addLayer(buff)

/*/ CLOUD MASKING

function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}
*/

// SENTINEL2 L2A COLLECTION

var collection = ee.ImageCollection("COPERNICUS/S2_SR") // S2_SR = L2A level
 // .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
  .filterDate("2020-04-20", "2020-07-08")
  .filterBounds(cov)
  //.map(maskS2clouds);// 15 elements

print(collection);

// CALCULATE NDVI

var calculateNDVI = function(scene) {
  // get a string representation of the date.
  var dateString = ee.Date(scene.get('system:time_start')).format('yyyyMMdd');
  var ndvi = scene.normalizedDifference(['B8', 'B4']);
  return ndvi.rename(dateString);
};

var NDVIcollection = collection.map(calculateNDVI);

print(NDVIcollection, 'NDVIcollection')

// STACK NDVI

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stackedNDVI = stackCollection(NDVIcollection);
print('stackedNDVI', stackedNDVI);

Map.addLayer(stackedNDVI.select(0).clip(cov), {min:-1, max:1}, 'stackedNDVI');

// EXPORT STACKED NDVI

Export.image.toDrive({
 image: stackedNDVI,
 description: 'COV_2020_NDVI',
 scale: 10,
 region: cov,
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

// STACK NDWI

var stackedNDWI = stackCollection(NDWIcollection);
print('stackedNDWI', stackedNDWI);

Map.addLayer(stackedNDWI.select(0).clip(cov), {min:-1, max:1}, 'stackedNDWI');

// EXPORT STACKED NDWI

Export.image.toDrive({
 image: stackedNDWI,
 description: 'COV_2020_NDWI',
 scale: 10,
 region: cov,
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

// STACK LAI

var stackedLAI = stackCollection(LAIcollection);
print('stackedLAI', stackedLAI);

Map.addLayer(stackedLAI.select(0).clip(cov), {min:-1, max:1}, 'stackedLAI');

// EXPORT STACKED LAI

Export.image.toDrive({
 image: stackedLAI,
 description: 'COV_2020_LAI',
 scale: 10,
 region: cov,
 maxPixels: 1e9
});

// WEIGHTED MEAN IN 5m BUFFER

//general commands for all indices

var buffer5 = ee.FeatureCollection('users/krizovakk/COV_buffer_5m');

var wm = function(scene) {
  var maineMeansFeatures = scene.reduceRegions({
  collection: buffer5,
  reducer: ee.Reducer.mean(),
  scale: 10,})
  return maineMeansFeatures;
};

// NDVI wm

var wmNDVI = NDVIcollection.map(wm)
var tableNDVI = wmNDVI.flatten() // https://gis.stackexchange.com/questions/333392/gee-reduceregions-for-an-image-collection
print(tableNDVI, 'Weighted mean of NDVI')

Export.table.toDrive({
  collection: tableNDVI,
  description: 'wmNDVI',
  fileFormat: 'CSV'
});

// NDWI wm

var wmNDWI = NDWIcollection.map(wm)
var tableNDWI = wmNDWI.flatten()
print(tableNDWI, 'Weighted mean of NDWI')

Export.table.toDrive({
  collection: tableNDWI,
  description: 'wmNDWI',
  fileFormat: 'CSV'
});

// LAI wm

var wmLAI = LAIcollection.map(wm)
var tableLAI = wmLAI.flatten()
print(tableLAI, 'Weighted mean of LAI')

Export.table.toDrive({
  collection: tableLAI,
  description: 'wmLAI',
  fileFormat: 'CSV'
});
