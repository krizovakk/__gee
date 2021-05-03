/*
Jakub, Vaclav
Slovec 2020
SAR data / Dubois model
 S2: NDWI
Data loggers period: 2020-05-08 - 2020-07-27

*/

var geom = ee.FeatureCollection('users/krizovakk/slovec')
var pt = ee.FeatureCollection('users/krizovakk/sar_dubois_slovec_4326')

Map.addLayer(geom)
Map.addLayer(pt)
Map.centerObject(geom)

// SENTINEL2 L2A COLLECTION

var collection = ee.ImageCollection("COPERNICUS/S2_SR") // S2_SR = L2A level
  //.filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
  .filterDate("2020-05-08", "2020-07-27") // dataloggers on the plot
  .filterBounds(geom)

print(collection);

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

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};

var stackedNDWI = stackCollection(NDWIcollection);
print('stackedNDWI', stackedNDWI);

Map.addLayer(stackedNDWI.select(0).clip(geom), {min:-1, max:1}, 'stackedNDWI');

// export NDWI
Export.image.toDrive({
 image: stackedNDWI,
 description: 'NDWI',
 scale: 10,
 region: geom,
 maxPixels: 1e9
});
