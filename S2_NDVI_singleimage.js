 /* var aoi = ee.Geometry.Rectangle(xMin, yMin, xMax, yMax) 
 GEE asks if I want to converti it to the Import - I said Yes - shp is inserted */
 
// IMPORT THE WHOLE COLLECTION  

var collection = ee.ImageCollection("COPERNICUS/S2_SR") // S2_SR = L2A level
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
  .filterDate("2020-03-1", "2020-08-31")
  .filterBounds(aoi); // 15 elements
  
print(collection);

// IMAGE EXPLORATION 

//var date = collection.filterDate("2020-03-1", "2020-08-31")
//print(date)

var image = collection.first(); // first functioning, second not (?)
print(image)

// from the console read the image ID and assign specific image to 
//var image = ee.Image("COPERNICUS/S2_SR/20200405T100021_20200405T100236_T33UVR") // ID 0
//print(image);

// CLIP

var iclip = image.clip(aoi)

// SPECTRAL INDICES CALCULAION

//var nir = image.select('B8'); // 'iclip' instead of 'image' when clipped
//var red = image.select('B4');
//var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI'); // choose bands to calculate ither indices

// NDVI

var ndvi = iclip.normalizedDifference(['B8', 'B4']).rename('NDVI'); // specific for NDVI

// Display the result.
Map.centerObject(iclip, 9);
Map.addLayer(ndvi, ndviParams, 'NDVI image'); // WORKS !!!!! <3

// EXPORT

// Create a task that you can launch from the Tasks tab.
Export.image.toDrive({
  image: ndvi,
  description: 'NDVI_O',
  scale: 10,
  region: aoi,
  maxPixels: 1e9
});

/* TASKS:

- solve the issue with the "first"
- applying calculation on whole collection?

*/
