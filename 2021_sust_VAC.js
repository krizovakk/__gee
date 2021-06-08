/*
Vaclav
Slovec 2014-2020
3 typy hnoje (kráva, prase, slepice)
NeOsol
-> MDPI Sustainability
RS data: S2: NDVI, NDWI, LAI
*/

// ROI

var geom = ee.FeatureCollection('users/krizovakk/sust_slovec_polygon')

Map.addLayer(geom)
Map.centerObject(geom)

// REDUCERS

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

print(NDVIcollection, 'NDVIcollection')

// reduce NDVI

var NDVImeansd = NDVIcollection.map(meansd);

var fNDVImeansd = NDVImeansd.flatten()

print(fNDVImeansd, 'NDVI reduced')

Export.table.toDrive({
  collection: fNDVImeansd,
  description: 'NDVImeansd',
  folder: 'ee',
  fileFormat: 'CSV'
});

// stack NDVI

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};

var stackedNDVI = stackCollection(NDVIcollection);

print('stacked NDVI', stackedNDVI);

Map.addLayer(stackedNDVI.select(0).clip(geom), {min:-1, max:1}, 'stackedNDVI');

// export NDVI

Export.image.toDrive({
 image: stackedNDVI,
 description: 'NDVI',
 scale: 10,
 region: geom,
 maxPixels: 1e9
});

// NDWI

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

// reduce NDWI

var NDWImeansd = NDWIcollection.map(meansd);

var fNDWImeansd = NDWImeansd.flatten()

print(fNDWImeansd, 'NDWI reduced')

Export.table.toDrive({
  collection: fNDVImeansd,
  description: 'NDVImeansd',
  folder: 'ee',
  fileFormat: 'CSV'
});

// stack NDWI

var stackedNDWI = stackCollection(NDWIcollection);
print('stackedNDWI', stackedNDWI);

//Map.addLayer(stackedNDWI.select(0).clip(geom), {min:-1, max:1}, 'stackedNDWI');

// export NDWI

Export.image.toDrive({
 image: stackedNDWI,
 description: 'NDWI',
 scale: 10,
 region: geom,
 maxPixels: 1e9
});

// LAI

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

// reduce NDWI

var LAImeansd = LAIcollection.map(meansd);

var fLAImeansd = LAImeansd.flatten()

print(fLAImeansd, 'LAI reduced')

Export.table.toDrive({
  collection: fLAImeansd,
  description: 'LAImeansd',
  folder: 'ee',
  fileFormat: 'CSV'
});

// stack LAI

var stackedLAI = stackCollection(LAIcollection);

print('stackedLAI', stackedLAI);

//Map.addLayer(stackedLAI.select(0).clip(geom), {min:-1, max:1}, 'stackedLAI');

// export LAI

Export.image.toDrive({
 image: stackedLAI,
 description: 'LAI',
 scale: 10,
 region: geom,
 maxPixels: 1e9
});
