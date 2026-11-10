const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That photo couldn't be opened. Try a JPEG or PNG."));
    };
    img.src = url;
  });
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Centre-crops a photo to a square and shrinks it (default 512px), so uploads
 * are small (~30–80 KB) and phone photos load instantly in a lunch.
 * Also drops EXIF data (location etc.) because only the pixels are redrawn.
 * @returns {Promise<Blob>} WebP, or JPEG on browsers without WebP encoding
 */
export async function squarePhoto(file, size = 512) {
  if (!file) throw new Error('Choose a photo first.');
  if (!ACCEPTED.includes(file.type)) throw new Error('Use a JPEG, PNG or WebP photo.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('That photo is over 15 MB. Try a smaller one.');

  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const out = Math.min(size, side);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, out, out);

  const webp = await toBlob(canvas, 'image/webp', 0.86);
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.88);
  if (!jpeg) throw new Error("That photo couldn't be processed.");
  return jpeg;
}
