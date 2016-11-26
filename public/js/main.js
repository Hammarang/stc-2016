

// Create canvas containing the test image
let canvas = document.createElement('canvas');
let context = canvas.getContext('2d');
let img = document.getElementById('main-image');


console.log(img);

//context.drawImage(img, 0, 0);
let pixels = getPixels(img, context);

let colorThief = new ColorThief();
let dominantColor = getDominantColor(img);
let dominantPalette = getDominantPalette(img);

console.log("Dominant Color:");
console.log(dominantColor);
console.log("Dominant Palette:");
console.log(dominantPalette);

// Print 10 first pixels
console.log(pixels.slice(0, 10));

// Get intensity
let intensity = getPaletteIntensity(dominantPalette)

console.log("Intensity of dominant palette")
console.log(intensity);

console.log("Constrast of dominant palette");
let contrast = getPaletteContrast(dominantPalette);
console.log(contrast);

console.log("Brightness of image");
let brightness = getBrightness(dominantPalette);
console.log(brightness);

console.log("Saturation of image");
let saturation = getSaturation(dominantPalette);
console.log(saturation);

// Calculates "contrast" in relation to most dominant color
function getPaletteContrast(palette) {
  let lightnessPalette = palette.map(color => {
    return rgbToHsl(color).l
  });
  let mainColor = lightnessPalette[0];
  let squareLightDiff = 0;
  for (var i = 1; i < lightnessPalette.length; i++) {
    squareLightDiff += Math.pow(lightnessPalette[i] - mainColor, 2);
  }
  return Math.pow(squareLightDiff/lightnessPalette.length, 0.5);
}

// Calculates the average brightness of the palette
function getBrightness(palette) {
  return palette
    .map(color => {
      return rgbToHsl(color).l
    })
    .reduce((sum, val) => {
      return sum + val
    })
  /palette.length
}

// Calculates the average saturation of the palette
function getSaturation(palette) {
  return palette
    .map(color => {
      return rgbToHsl(color).s
    })
    .reduce((sum, val) => {
      return sum + val
    })
  /palette.length
}

// Gets the intensity of a palette of colors. The intensity being the V-values
// in HSV form
function getPaletteIntensity(palette) {
  return palette
    .map(color => {
      return rgbToHsv(color).v
    })
    .reduce((sum, val) => {
      return sum + val
    })
  /palette.length;
}

// Convert an array of RGB values to HSV
function rgbToHsv(pixel) {
  return tinycolor(
    {
      r: pixel[0],
      b: pixel[1],
      g: pixel[2],
    }
  ).toHsv();
}

// Convert an array of RGB values to HSV
function rgbToHsl(pixel) {
  return tinycolor(
    {
      r: pixel[0],
      b: pixel[1],
      g: pixel[2],
    }
  ).toHsl();
}


// Returns an array of pixels, RGBA
function getPixels(image, context) {
  let pixels = [];

  for (var offsetX = 0; offsetX < image.width; offsetX++) {
    for (var offsetY = 0; offsetY < image.height; offsetY++) {
      pixels.push(context.getImageData(offsetX, offsetY, 1, 1).data);
    }
  }
  return pixels;
}

function getDominantColor(image){
  return colorThief.getColor(image);
}

function getDominantPalette(image){
  return colorThief.getPalette(image, 4);
}
