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

var aoi = ee.FeatureCollection('users/krizovakk/bacina')

Map.addLayer(aoi)
Map.centerObject(aoi)

// SENTINEL-1 COLLECTIONS

var asc = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterDate("2020-03-1", "2020-05-31")
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  .filterBounds(aoi)

print(asc, 'Sentinel-1 ASC collection');

var dsc = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterDate("2020-03-1", "2020-05-31")
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .filterBounds(aoi)

print(dsc, 'Sentinel-1 DSC collection');

// EXPORT VH and VV stacked bands

// ascending VH

var avh = function(asc) {
  // get a string representation of the date.
  var dateString = ee.Date(asc.get('system:time_start')).format('yyyyMMdd');
  var selected = asc.select('VH');
  return selected.rename(dateString);
};

var avhcoll = asc.map(avh);

print(avhcoll, 'asc VH collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stacked_avh = stackCollection(avhcoll);
print('stacked AVH', stacked_avh);

Map.addLayer(stacked_avh.select(0).clip(aoi), {min:-1, max:1}, 'stacked_avh');

Export.image.toDrive({
 image: stacked_avh,
 description: 'ascVH',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

// ascending VV

var avv = function(asc) {
  // get a string representation of the date.
  var dateString = ee.Date(asc.get('system:time_start')).format('yyyyMMdd');
  var selected = asc.select('VV');
  return selected.rename(dateString);
};

var avvcoll = asc.map(avv);

print(avvcoll, 'asc VV collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stacked_avv = stackCollection(avvcoll);
print('stacked AVV', stacked_avv);

Map.addLayer(stacked_avv.select(0).clip(aoi), {min:-1, max:1}, 'stacked_avv');

Export.image.toDrive({
 image: stacked_avv,
 description: 'ascVV',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

// descending VH

var dvh = function(dsc) {
  // get a string representation of the date.
  var dateString = ee.Date(dsc.get('system:time_start')).format('yyyyMMdd');
  var selected = dsc.select('VH');
  return selected.rename(dateString);
};

var dvhcoll = dsc.map(dvh);

print(dvhcoll, 'dsc VH collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stacked_dvh = stackCollection(dvhcoll);
print('stacked DVH', stacked_dvh);

Map.addLayer(stacked_dvh.select(0).clip(aoi), {min:-1, max:1}, 'stacked_dvh');

Export.image.toDrive({
 image: stacked_dvh,
 description: 'dscVH',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

// ascending VV

var dvv = function(dsc) {
  // get a string representation of the date.
  var dateString = ee.Date(dsc.get('system:time_start')).format('yyyyMMdd');
  var selected = dsc.select('VV');
  return selected.rename(dateString);
};

var dvvcoll = dsc.map(avv);

print(dvvcoll, 'dsc VV collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stacked_dvv = stackCollection(dvvcoll);
print('stacked DVV', stacked_dvv);

Map.addLayer(stacked_dvv.select(0).clip(aoi), {min:-1, max:1}, 'stacked_dvv');

Export.image.toDrive({
 image: stacked_dvv,
 description: 'dscVV',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

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

// CALCULATE NRPB RADAR INDEX / https://www.mdpi.com/2072-4292/11/12/1441

// formula:  (VHdb - VVdb)/(VHdb + VVdb)
// must be in decibels units !!! -> conversion formula [10^((valueINdb)/10)] NOT NECESSARRY IN GEE

// ascending path

var calculateNRPB = function(asc) {
  // get a string representation of the date.
  var dateString = ee.Date(asc.get('system:time_start')).format('yyyyMMdd');
  var selected = asc.select('VH', 'VV');
  var nrpb = selected.expression('(b(0)-b(1))/(b(0)+b(1))')
  return nrpb.rename(dateString);
};

var ascNRPBcollection = asc.map(calculateNRPB);

print(ascNRPBcollection, 'ascNRPB collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stackedNRPBasc = stackCollection(ascNRPBcollection);
print('stackedNRPBasc', stackedNRPBasc);

Map.addLayer(stackedNRPBasc.select(0).clip(aoi), {min:-1, max:1}, 'stackedNRPBasc');

Export.image.toDrive({
 image: stackedNRPBasc,
 description: 'ascNRPB',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

// descending path

var calculateNRPB = function(dsc) {
  // get a string representation of the date.
  var dateString = ee.Date(dsc.get('system:time_start')).format('yyyyMMdd');
  var selected = dsc.select('VH', 'VV');
  var nrpb = selected.expression('(b(0)-b(1))/(b(0)+b(1))');
  return nrpb.rename(dateString);
};

var dscNRPBcollection = dsc.map(calculateNRPB);

print(dscNRPBcollection, 'dscNRPB collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stackedNRPBdsc = stackCollection(dscNRPBcollection);
print('stackedNRPBdsc', stackedNRPBdsc);

Map.addLayer(stackedNRPBdsc.select(0).clip(aoi), {min:-1, max:1}, 'stackedNRPBdsc');

Export.image.toDrive({
 image: stackedNRPBdsc,
 description: 'dscNRPB',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

//---------------------------------------------------------------------------
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

var aoi = ee.FeatureCollection('users/krizovakk/bacina')

Map.addLayer(aoi)
Map.centerObject(aoi)

// SENTINEL-1 COLLECTIONS

var asc = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterDate("2020-03-1", "2020-05-31")
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  .filterBounds(aoi)

print(asc, 'Sentinel-1 ASC collection');

var dsc = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterDate("2020-03-1", "2020-05-31")
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .filterBounds(aoi)

print(dsc, 'Sentinel-1 DSC collection');

// EXPORT VH and VV stacked bands

// ascending VH

var avh = function(asc) {
  // get a string representation of the date.
  var dateString = ee.Date(asc.get('system:time_start')).format('yyyyMMdd');
  var selected = asc.select('VH');
  return selected.rename(dateString);
};

var avhcoll = asc.map(avh);

print(avhcoll, 'asc VH collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stacked_avh = stackCollection(avhcoll);
print('stacked AVH', stacked_avh);

Map.addLayer(stacked_avh.select(0).clip(aoi), {min:-1, max:1}, 'stacked_avh');

Export.image.toDrive({
 image: stacked_avh,
 description: 'ascVH',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

// ascending VV

var avv = function(asc) {
  // get a string representation of the date.
  var dateString = ee.Date(asc.get('system:time_start')).format('yyyyMMdd');
  var selected = asc.select('VV');
  return selected.rename(dateString);
};

var avvcoll = asc.map(avv);

print(avvcoll, 'asc VV collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stacked_avv = stackCollection(avvcoll);
print('stacked AVV', stacked_avv);

Map.addLayer(stacked_avv.select(0).clip(aoi), {min:-1, max:1}, 'stacked_avv');

Export.image.toDrive({
 image: stacked_avv,
 description: 'ascVV',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

// descending VH

var dvh = function(dsc) {
  // get a string representation of the date.
  var dateString = ee.Date(dsc.get('system:time_start')).format('yyyyMMdd');
  var selected = dsc.select('VH');
  return selected.rename(dateString);
};

var dvhcoll = dsc.map(dvh);

print(dvhcoll, 'dsc VH collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stacked_dvh = stackCollection(dvhcoll);
print('stacked DVH', stacked_dvh);

Map.addLayer(stacked_dvh.select(0).clip(aoi), {min:-1, max:1}, 'stacked_dvh');

Export.image.toDrive({
 image: stacked_dvh,
 description: 'dscVH',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

// ascending VV

var dvv = function(dsc) {
  // get a string representation of the date.
  var dateString = ee.Date(dsc.get('system:time_start')).format('yyyyMMdd');
  var selected = dsc.select('VV');
  return selected.rename(dateString);
};

var dvvcoll = dsc.map(avv);

print(dvvcoll, 'dsc VV collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stacked_dvv = stackCollection(dvvcoll);
print('stacked DVV', stacked_dvv);

Map.addLayer(stacked_dvv.select(0).clip(aoi), {min:-1, max:1}, 'stacked_dvv');

Export.image.toDrive({
 image: stacked_dvv,
 description: 'dscVV',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

/*/ CALCULATE RVI4S1 RADAR INDEX

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

// CALCULATE NRPB RADAR INDEX / https://www.mdpi.com/2072-4292/11/12/1441

// formula:  (VHdb - VVdb)/(VHdb + VVdb)
// must be in decibels units !!! -> conversion formula [10^((valueINdb)/10)] NOT NECESSARRY IN GEE

// ascending path

var calculateNRPB = function(asc) {
  // get a string representation of the date.
  var dateString = ee.Date(asc.get('system:time_start')).format('yyyyMMdd');
  var selected = asc.select('VH', 'VV');
  var nrpb = selected.expression('(b(0)-b(1))/(b(0)+b(1))')
  return nrpb.rename(dateString);
};

var ascNRPBcollection = asc.map(calculateNRPB);

print(ascNRPBcollection, 'ascNRPB collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stackedNRPBasc = stackCollection(ascNRPBcollection);
print('stackedNRPBasc', stackedNRPBasc);

Map.addLayer(stackedNRPBasc.select(0).clip(aoi), {min:-1, max:1}, 'stackedNRPBasc');

Export.image.toDrive({
 image: stackedNRPBasc,
 description: 'ascNRPB',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});

// descending path

var calculateNRPB = function(dsc) {
  // get a string representation of the date.
  var dateString = ee.Date(dsc.get('system:time_start')).format('yyyyMMdd');
  var selected = dsc.select('VH', 'VV');
  var nrpb = selected.expression('(b(0)-b(1))/(b(0)+b(1))');
  return nrpb.rename(dateString);
};

var dscNRPBcollection = dsc.map(calculateNRPB);

print(dscNRPBcollection, 'dscNRPB collection')

var stackCollection = function(collection) {
  var first = ee.Image(collection.first()).select([]);
  var appendBands = function(image, previous) {
    return ee.Image(previous).addBands(image);
  };
  return ee.Image(collection.iterate(appendBands, first));
};
var stackedNRPBdsc = stackCollection(dscNRPBcollection);
print('stackedNRPBdsc', stackedNRPBdsc);

Map.addLayer(stackedNRPBdsc.select(0).clip(aoi), {min:-1, max:1}, 'stackedNRPBdsc');

Export.image.toDrive({
 image: stackedNRPBdsc,
 description: 'dscNRPB',
 scale: 10,
 region: aoi,
 maxPixels: 1e9
});
*/
