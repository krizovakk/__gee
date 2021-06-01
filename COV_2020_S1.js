/*
Sentinel-1 / European Space Agency
C-SAR imagery
temporal resolution: 2 days (for the S1A and S1B tandem; over CZ)
spatial resolution: 5*20 m
image mode: IW
product type used: GRD (ground range detected) redukovaný šum za cenu nižšího geometrického rozlišení
satellie path: indifferent
polarisation:
  single VV VH
  dual VVVH
spectral indices: RVI4S1
workflow:
  load separate collections for ASCENDING and DESCENDING paths,
  calculate specific index over entire collection,
  stack all dates in a single multiband image,
  export image to Google Drive
*/

var aoi = ee.FeatureCollection('users/krizovakk/COV_32633')

Map.addLayer(aoi)
Map.centerObject(aoi)

// SENTINEL-1 COLLECTIONS

var asc = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterDate("2020-04-1", "2020-07-16")
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  .filterBounds(aoi)

print(asc, 'Sentinel-1 ASC collection');

var dsc = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterDate("2020-04-1", "2020-07-16")
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .filterBounds(aoi)

print(dsc, 'Sentinel-1 DSC collection');

// CALCULATE RVI4S1 RADAR INDEX

// formula:  (4xVH)/(VV+VH)
// must be in linear units !!! -> conversion formula: 10^((valueINdb)/10) DONE

// ascending path

/*
var calculateRVI = function(asc) {
  // get a string representation of the date.
  var dateString = ee.Date(asc.get('system:time_start')).format('yyyyMMdd');
  var selected = asc.select('VH', 'VV');
  var rvi = selected.expression('4*b(0)/(b(1)+b(0))');
  return rvi.rename(dateString);
};*/

var calculateRVI = function(asc) {
  // get a string representation of the date.
  var dateString = ee.Date(asc.get('system:time_start')).format('yyyyMMdd');
  var selected = asc.select('VH', 'VV');
  var rvi = selected.expression('4*(10**((b(0))/10))/((10**((b(1))/10))+(10**((b(0))/10)))'); // formula for db2linear conversion incorporated
  return rvi.rename(dateString);
};

var ascRVIcollection = asc.map(calculateRVI);

print(ascRVIcollection, 'ascRVI collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stackedRVIasc = stackCollection(ascRVIcollection);
print('stackedRVIasc', stackedRVIasc);

Map.addLayer(stackedRVIasc.select(0).clip(aoi), {min:-1, max:1}, 'stackedRVIasc');

Export.image.toDrive({
 image: stackedRVIasc,
 description: 'ascRVI',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

// descending path

var calculateRVI = function(dsc) {
  // get a string representation of the date.
  var dateString = ee.Date(dsc.get('system:time_start')).format('yyyyMMdd');
  var selected = dsc.select('VH', 'VV');
  var rvi = selected.expression('4*(10**((b(0))/10))/((10**((b(1))/10))+(10**((b(0))/10)))');
  return rvi.rename(dateString);
};

var dscRVIcollection = dsc.map(calculateRVI);

print(dscRVIcollection, 'dscRVI collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stackedRVIdsc = stackCollection(dscRVIcollection);
print('stackedRVIdsc', stackedRVIdsc);

Map.addLayer(stackedRVIdsc.select(0).clip(aoi), {min:-1, max:1}, 'stackedRVIdsc');

Export.image.toDrive({
 image: stackedRVIdsc,
 description: 'dscRVI',
 scale: 10,
 region: aoi,
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

// ascRVI wm

var wm_ascRVI = ascRVIcollection.map(wm)
var table_ascRVI = wm_ascRVI.flatten() // https://gis.stackexchange.com/questions/333392/gee-reduceregions-for-an-image-collection
print(table_ascRVI, 'Weighted mean of RVI4S1 / ascending path')

Export.table.toDrive({
  collection: table_ascRVI,
  description: 'table_ascRVI',
  fileFormat: 'CSV'
});

// dscRVI wm

var wm_dscRVI = dscRVIcollection.map(wm)
var table_dscRVI = wm_dscRVI.flatten() // https://gis.stackexchange.com/questions/333392/gee-reduceregions-for-an-image-collection
print(table_dscRVI, 'Weighted mean of RVI4S1 / descending path')

Export.table.toDrive({
  collection: table_dscRVI,
  description: 'table_dscRVI',
  fileFormat: 'CSV'
});

// collection without any additional parameters

var col = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterDate("2020-04-1", "2020-07-16")
  .filterBounds(aoi);

print(col, 'Basic collection of S1')
  
