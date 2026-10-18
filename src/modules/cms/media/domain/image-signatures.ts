export type VerifiedImage = Readonly<{
  extension: "jpg" | "png" | "webp";
  height: number;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
}>;

const jpegSoi = [0xff, 0xd8];
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const maximumJpegInspectionBytes = 256 * 1024;

function hasBytes(
  value: Uint8Array,
  offset: number,
  bytes: readonly number[]
): boolean {
  return bytes.every((byte, index) => value[offset + index] === byte);
}

function readUint16(value: Uint8Array, offset: number): number {
  const first = value[offset];
  const second = value[offset + 1];
  if (first === undefined || second === undefined) return 0;
  return (first << 8) | second;
}

function readUint32(value: Uint8Array, offset: number, littleEndian = false): number {
  const view = new DataView(value.buffer, value.byteOffset, value.byteLength);
  return view.getUint32(offset, littleEndian);
}

function jpegDimensions(value: Uint8Array): VerifiedImage | null {
  if (!hasBytes(value, 0, jpegSoi)) return null;
  let offset = 2;
  const limit = Math.min(value.length, maximumJpegInspectionBytes);
  while (offset + 4 <= limit) {
    if (value[offset] !== 0xff) return null;
    while (offset < limit && value[offset] === 0xff) offset += 1;
    const marker = value[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda || marker === undefined) return null;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    if (offset + 2 > limit) return null;
    const length = readUint16(value, offset);
    if (length < 2 || offset + length > limit) return null;
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) {
      if (length < 8) return null;
      const height = readUint16(value, offset + 3);
      const width = readUint16(value, offset + 5);
      return width > 0 && height > 0
        ? { extension: "jpg", height, mimeType: "image/jpeg", width }
        : null;
    }
    offset += length;
  }
  return null;
}

function pngDimensions(value: Uint8Array): VerifiedImage | null {
  if (!hasBytes(value, 0, pngSignature) || value.length < 24) return null;
  if (!hasBytes(value, 12, [0x49, 0x48, 0x44, 0x52])) return null;
  const width = readUint32(value, 16);
  const height = readUint32(value, 20);
  return width > 0 && height > 0
    ? { extension: "png", height, mimeType: "image/png", width }
    : null;
}

function webpDimensions(value: Uint8Array): VerifiedImage | null {
  if (
    !hasBytes(value, 0, [0x52, 0x49, 0x46, 0x46]) ||
    !hasBytes(value, 8, [0x57, 0x45, 0x42, 0x50])
  )
    return null;
  if (value.length < 30) return null;
  const chunk = String.fromCharCode(...value.slice(12, 16));
  let width = 0;
  let height = 0;
  if (chunk === "VP8 ") {
    if (!hasBytes(value, 23, [0x9d, 0x01, 0x2a])) return null;
    width = readUint16(value, 26) & 0x3fff;
    height = readUint16(value, 28) & 0x3fff;
  } else if (chunk === "VP8L") {
    if (value[20] !== 0x2f || value.length < 25) return null;
    const first = value[21];
    const second = value[22];
    const third = value[23];
    const fourth = value[24];
    if (
      first === undefined ||
      second === undefined ||
      third === undefined ||
      fourth === undefined
    ) {
      return null;
    }
    const bits = first | (second << 8) | (third << 16) | (fourth << 24);
    width = (bits & 0x3fff) + 1;
    height = ((bits >> 14) & 0x3fff) + 1;
  } else if (chunk === "VP8X") {
    if (value.length < 30) return null;
    const widthFirst = value[24];
    const widthSecond = value[25];
    const widthThird = value[26];
    const heightFirst = value[27];
    const heightSecond = value[28];
    const heightThird = value[29];
    if (
      widthFirst === undefined ||
      widthSecond === undefined ||
      widthThird === undefined ||
      heightFirst === undefined ||
      heightSecond === undefined ||
      heightThird === undefined
    ) {
      return null;
    }
    width = 1 + widthFirst + (widthSecond << 8) + (widthThird << 16);
    height = 1 + heightFirst + (heightSecond << 8) + (heightThird << 16);
  } else {
    return null;
  }
  return width > 0 && height > 0
    ? { extension: "webp", height, mimeType: "image/webp", width }
    : null;
}

export function inspectImageSignature(value: Uint8Array): VerifiedImage | null {
  return jpegDimensions(value) ?? pngDimensions(value) ?? webpDimensions(value);
}

export function validateImageDimensions(
  image: VerifiedImage,
  limits: Readonly<{ maxHeight: number; maxPixels: number; maxWidth: number }>
): boolean {
  return (
    image.width <= limits.maxWidth &&
    image.height <= limits.maxHeight &&
    image.width * image.height <= limits.maxPixels
  );
}
