/*
Sentinel-1 / European Space Agency
SAR imagery
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
  .filterDate("2020-03-1", "2020-08-31")
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  .filterBounds(aoi)

print(asc, 'Sentinel-1 ASC collection');

var dsc = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterDate("2020-03-1", "2020-08-31")
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .filterBounds(aoi)

print(dsc, 'Sentinel-1 DSC collection');

// CALCULATE RVI4S1 RADAR INDEX

// formula:  (4xVH)/(VV+VH)
// must be in linear units !!! -> conversion formula: 10^((valueINdb)/10) DONE

// ascending path

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
