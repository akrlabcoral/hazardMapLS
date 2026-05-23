const GeoTIFF = require('geotiff');

async function test() {
  const tiff = await GeoTIFF.fromFile('/Users/manasrai/MyFolder/Summer Internship/GeoGuardian(Real-time)/public/rasters/land-cover.tif');
  const image = await tiff.getImage(0);
  const fd = image.fileDirectory;
  console.log('Image:', image);
  console.log('FD:', fd);
  console.log('PhotometricInterpretation:', fd.PhotometricInterpretation);
  console.log('ColorMap:', fd.ColorMap);
  console.log('BitsPerSample:', fd.BitsPerSample);
  
  // Try getting it via getField?
  // Or check actualizedFields
  console.log('actualizedFields:', fd.actualizedFields);
}

test().catch(console.error);
