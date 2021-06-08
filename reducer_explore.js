/*
Vaclav
Slovec 2014-2020
3 typy hnoje (kráva, prase, slepice)
NeOsol
-> MDPI Sustainability
RS data: S2: NDVI, NDWI, LAI
*/

var geom = ee.FeatureCollection('users/krizovakk/sust_slovec_polygon')
Map.addLayer(geom)
Map.centerObject(geom)

// SENTINEL2 L2A COLLECTION

var collection = ee.ImageCollection("COPERNICUS/S2_SR") // S2_SR = L2A level
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
  .filterDate("2017-04-1", "2020-08-31")
  .filter(ee.Filter.calendarRange(3,8, 'month'))
  .filterBounds(geom)

print(collection, 'basic collection');

// RGB composite

var generate_rgb = function(scene) {
  var dateString = ee.Date(scene.get('system:time_start')).format('yyyyMMdd');
  var selected = scene.select(['B2', 'B3', 'B4']);
  var rgb = selected.expression('b(2)+b(1)+b(0)');
  return rgb.rename(dateString);
};

var RGBcollection = collection.map(generate_rgb);

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};

var stacked = stackCollection(RGBcollection);

print('stacked', stacked);

// band names

var bands = stacked.bandNames();

print(bands)

var flatbands = bands.flatten() // https://gis.stackexchange.com/questions/333392/gee-reduceregions-for-an-image-collection
print(flatbands, 'list to export')

Export.table.toDrive({
  collection: flatbands,
  folder: 'ee',
  description:'SUST_S2_bandnames',
  fileFormat: 'CSV'
});


// CALCULATE NDVI

var calculateNDVI = function(scene) {
  // get a string representation of the date.
  var dateString = ee.Date(scene.get('system:time_start')).format('yyyyMMdd');
  var ndvi = scene.normalizedDifference(['B8', 'B4']);
  return ndvi.rename(dateString);
};

var NDVIcollection = collection.map(calculateNDVI);
print(NDVIcollection, 'NDVIcollection');

/* funkcni kod pro mean
var meansd = function(scene) {
  var bandNames = scene.bandNames();
  var selected = scene.select([0]);
  var reduced = selected.reduce(ee.Reducer.mean());
  return reduced.rename(bandNames);
}; */

var reducers = ee.Reducer.mean().combine({
  reducer2: ee.Reducer.stdDev(),
  sharedInputs: true
});

var meansd = function(scene) {
  var selected = scene.select([0]);
  var reduced = selected.reduce(reducers);
  //var bandNames = scene.bandNames();
  //var redtype = reducers.outputPrefix();
  //var newname = ee.String(bandNames).cat(redtype);
  return reduced; //.rename(newname)
};

var NDVImeansd = NDVIcollection.map(meansd);

print(NDVImeansd, 'NDVI mean and stdev')

// STACK

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};

var stackedNDVI = stackCollection(NDVImeansd);

print('stackedNDVI', stackedNDVI);

Map.addLayer(stackedNDVI.select(0).clip(geom), {min:-1, max:1}, 'stackedNDVI');

// FUNKCNI REDUCERS vvvvvvvvvvvvvvvvvvvvvvvv

var geom = ee.FeatureCollection('users/krizovakk/sust_slovec_polygon')
Map.addLayer(geom)
Map.centerObject(geom)

print(geom)

// SENTINEL2 L2A COLLECTION

var collection = ee.ImageCollection("COPERNICUS/S2_SR") // S2_SR = L2A level
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
  .filterDate("2017-04-1", "2020-08-31")
  .filter(ee.Filter.calendarRange(3,8, 'month'))
  .filterBounds(geom)

print(collection, 'basic collection');

// NDVI

var calculateNDVI = function(scene) {
  // get a string representation of the date.
  var dateString = ee.Date(scene.get('system:time_start')).format('yyyyMMdd');
  var ndvi = scene.normalizedDifference(['B8', 'B4']);
  return ndvi.rename(dateString);
};

var NDVIcollection = collection.map(calculateNDVI);

print(NDVIcollection, 'NDVIcollection');

var mean = function(scene) {
   var reduced = scene.reduceRegions({
    collection: geom,
    reducer: ee.Reducer.mean()
    });
  return reduced;
};

var reducers = ee.Reducer.mean().combine({
  reducer2: ee.Reducer.stdDev(),
  sharedInputs: true
});

var meansd = function(scene) {
   var reduced = scene.reduceRegions({
    collection: geom,
    reducer: reducers,
    });
  return reduced;
};

var NDVImean = NDVIcollection.map(mean);
var NDVImeansd = NDVIcollection.map(meansd);

print(NDVImean, 'NDVImean')

var flatndvi = NDVImean.flatten()
print(flatndvi, 'list to export')

var flatndvisd = NDVImeansd.flatten()
print(flatndvisd, 'list to export')

Export.table.toDrive({
  collection: flatndvi,
  description: 'NDVImean',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: flatndvisd,
  description: 'NDVImeansd',
  fileFormat: 'CSV'
});
