/**
 * Turns a logo image into the outline a neon tube would follow, for the studio preview.
 *
 * The background is taken from the image's border (or its transparency), everything that differs
 * from it is the logo, and the logo's edge pixels are thickened into a tube-width stroke. It is a
 * preview, not production artwork: our designers bend the real tubes from a hand-made vector.
 */

export interface TracedLogo {
  /** White strokes on a transparent background, cropped to the logo. */
  outline: HTMLCanvasElement;
  /** Height ÷ width of the cropped logo. */
  aspect: number;
}

export class LogoTraceError extends Error {}

const WORKING_SIZE = 520;
const BACKGROUND_DISTANCE = 64;

export async function traceLogo(file: Blob): Promise<TracedLogo> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new LogoTraceError('We could not open this image. Try a PNG or JPG.');
  });

  const scale = Math.min(1, WORKING_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const context = source.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const { data } = context.getImageData(0, 0, width, height);
  const foreground = segment(data, width, height);
  const box = boundingBox(foreground, width, height);
  if (!box || box.area < width * height * 0.002) {
    throw new LogoTraceError(
      'We could not find a clear logo. Use an image with a plain or transparent background.',
    );
  }
  if (box.area > width * height * 0.97) {
    throw new LogoTraceError(
      'This looks like a photo rather than a logo. Use an image with a plain background.',
    );
  }

  const stroke = Math.max(2, Math.round(Math.max(box.width, box.height) / 110));
  const edges = dilate(outlineOf(foreground, width, height), width, height, stroke);

  const padding = stroke * 2;
  const outline = document.createElement('canvas');
  outline.width = box.width + padding * 2;
  outline.height = box.height + padding * 2;
  const out = outline.getContext('2d')!;
  const pixels = out.createImageData(outline.width, outline.height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!edges[y * width + x]) continue;
      const ox = x - box.x + padding;
      const oy = y - box.y + padding;
      if (ox < 0 || oy < 0 || ox >= outline.width || oy >= outline.height) continue;
      const i = (oy * outline.width + ox) * 4;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = pixels.data[i + 3] = 255;
    }
  }
  out.putImageData(pixels, 0, 0);

  return { outline, aspect: outline.height / outline.width };
}

/** Marks logo pixels: opaque ones where the image is transparent, otherwise ones unlike the border colour. */
function segment(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const border: number[] = [];
  for (let x = 0; x < width; x++) border.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) border.push(y * width, y * width + width - 1);

  const transparentBorder = border.filter((p) => data[p * 4 + 3]! < 128).length > border.length / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  for (const p of border) {
    r += data[p * 4]!;
    g += data[p * 4 + 1]!;
    b += data[p * 4 + 2]!;
  }
  r /= border.length;
  g /= border.length;
  b /= border.length;

  const mask = new Uint8Array(width * height);
  for (let p = 0; p < mask.length; p++) {
    const alpha = data[p * 4 + 3]!;
    if (alpha < 128) continue;
    if (transparentBorder) {
      mask[p] = 1;
      continue;
    }
    const distance = Math.hypot(data[p * 4]! - r, data[p * 4 + 1]! - g, data[p * 4 + 2]! - b);
    if (distance > BACKGROUND_DISTANCE) mask[p] = 1;
  }
  return mask;
}

function boundingBox(mask: Uint8Array, width: number, height: number) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let area = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1, area };
}

/** Logo pixels that touch the background: where the tube runs. */
function outlineOf(mask: Uint8Array, width: number, height: number): Uint8Array {
  const edges = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (!mask[p]) continue;
      const touchesBackground =
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        !mask[p - 1] ||
        !mask[p + 1] ||
        !mask[p - width] ||
        !mask[p + width];
      if (touchesBackground) edges[p] = 1;
    }
  }
  return edges;
}

/** Thickens the outline to roughly the width of a neon tube at this scale. */
function dilate(mask: Uint8Array, width: number, height: number, size: number): Uint8Array {
  const radius = Math.floor(size / 2);
  const result = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < width) result[ny * width + nx] = 1;
        }
      }
    }
  }
  return result;
}

/** The outline recoloured for a given tube colour. */
export function tint(outline: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = outline.width;
  canvas.height = outline.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(outline, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}
