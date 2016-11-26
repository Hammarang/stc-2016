

// Create canvas containing the test image
let canvas = document.createElement('canvas');
let context = canvas.getContext('2d');
let img = document.getElementById('main-image');
context.drawImage(img, 0, 0);
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
