 /* var aoi = ee.Geometry.Rectangle(xMin, yMin, xMax, yMax) 
 GEE asks if I want to converti it to the Import - I said Yes - shp is inserted */
 
var collection = ee.ImageCollection("COPERNICUS/S2")
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
  .filterDate("2020-03-1", "2020-08-31")
  .filterBounds(aoi); // 18 elements
  
print(collection);

// from the console read the image ID and assign specific image to var 'image'

var image = ee.Image("COPERNICUS/S2/20200304T101019_20200304T101022_T33UVR") // ID 0
print(image);

Map.addLayer(image); // display image
Map.addLayer(image, {min: 0, max: 3000}, 'custom visualization');
/*Map.addLayer(image, {min: 0, max: 3000, palette: ['blue', 'green', 'red']},
    'custom palette'); <- custom palette: Layer error: Image.visualize: Cannot provide a palette when visualizing more than one band. */
var slope = ee.Terrain.slope(image)
Map.addLayer(slope, {min: 0, max :60}, 'slope');

var meanDict = image.reduceRegion({ // reduces computation to gived AOI
  reducer: ee.Reducer.mean(),
  geometry: aoi,
  scale: 90
});

var mean = meanDict.get('B1');
print('Mean value of B1 is ', mean); // computes and displays mean value of specific band


