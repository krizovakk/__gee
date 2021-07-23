/*
Sentinel-2 / European Space Agency
multispectral imagery
spectral indices: NDVI, NDWI, LAI
workflow:
  load collection,
  calculate specific index over entire collection,
  stack all dates in a single multiband image,
  export image to Google Drive
  reduce information within shp (resp. variants) to a csv (mean and standard deviation)
*/

// IMPORT AOIs

var aoi = ee.FeatureCollection('')

Map.addLayer(aoi)
Map.centerObject(aoi)

// SENTINEL2 L2A COLLECTION

var collection = ee.ImageCollection("COPERNICUS/S2_SR") // S2_SR = L2A level
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
  .filterDate("2020-03-1", "2020-08-31")
  .filter(ee.Filter.calendarRange(3,7, 'month')) // filter only months march to july
  .filterBounds(aoi)

print(collection, 'S2collection');

// NDVI

// calculate

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

// reducers (mean and stdev)

var reducers = ee.Reducer.mean().combine({
  reducer2: ee.Reducer.stdDev(),
  sharedInputs: true
});

var meansd = function(scene) {
   var reduced = scene.reduceRegions({
    collection: aoi,
    reducer: reducers,
    });
  return reduced;
};

var NDVImeansd = NDVIcollection.map(meansd);

print(NDVImeansd, 'NDVImeansd')

var flatndvisd = NDVImeansd.flatten()
print(flatndvisd, 'list to export')

Export.table.toDrive({
  collection: flatndvisd,
  description: 'NDVImeansd',
  fileFormat: 'CSV'
});

// NDWI

// calculate

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

// reducers (mean and stdev)

var reducers = ee.Reducer.mean().combine({
  reducer2: ee.Reducer.stdDev(),
  sharedInputs: true
});

var meansd = function(scene) {
   var reduced = scene.reduceRegions({
    collection: aoi,
    reducer: reducers,
    });
  return reduced;
};

var NDWImeansd = NDWIcollection.map(meansd);

print(NDWImeansd, 'NDWImeansd')

var flatndwisd = NDWImeansd.flatten()
print(flatndwisd, 'list to export')

Export.table.toDrive({
  collection: flatndwisd,
  description: 'NDWImeansd',
  fileFormat: 'CSV'
});

// LAI

// calculate

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

// reducers (mean and stdev)

var reducers = ee.Reducer.mean().combine({
  reducer2: ee.Reducer.stdDev(),
  sharedInputs: true
});

var meansd = function(scene) {
   var reduced = scene.reduceRegions({
    collection: aoi,
    reducer: reducers,
    });
  return reduced;
};

var LAImeansd = LAIcollection.map(meansd);

print(LAImean, 'LAImean')

var flatlaisd = LAImeansd.flatten()
print(flatlaisd, 'list to export')

Export.table.toDrive({
  collection: flatlaisd,
  description: 'LAImeansd',
  fileFormat: 'CSV'
});
