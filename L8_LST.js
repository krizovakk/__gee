/*
RAGO / Norske fondy
zelene strechy
Martin Stehlik
to do:
LANDSAT thermal band -> sklady na periferiich Prahy -> rozdil teplot? Radove? Skala?
*/

// IMPORT AOIs

Map.addLayer(geom)
Map.centerObject(geom)

// LANDSAT 8 COLLECTION

var collection = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR") // T1 = po korekcich
  .filter(ee.Filter.lt("CLOUD_COVER", 10))
  .filterDate("2020-06-1", "2020-08-31")
  .filterBounds(geom)

print(collection, 'L8 collection')

var imagesInCelcius = collection.map(function (image) {
  return image.select("B10")
  .multiply(0.1)
  .subtract(273.5);
});
print('imagesInCelcius', imagesInCelcius)
//Map.addLayer(imagesInCelcius, {min: 0, max: 40, palette: 'blue,green,yellow,orange,red'});

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stackedLST = stackCollection(imagesInCelcius);
print('imagesInCelcius', imagesInCelcius);

Map.addLayer(stackedLST.select(0).clip(geom), {min:-10, max:40}, 'imagesInCelcius');

Export.image.toDrive({
 image: stackedLST,
 description: 'LST_cestlice',
 scale: 10,
 //region: geom,
 maxPixels: 1e9
});
