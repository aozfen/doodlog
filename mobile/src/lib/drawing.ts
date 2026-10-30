// Turns a photo into a drawing through the Worker. The photo is resized here, the
// drawing and a copy of the photo are saved under the app's documents. Neither is kept on the server.
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { DRAW_PHOTO_PX, KEEP_PHOTO_PX } from '@/constants';
import { galleryFileUri, isGalleryId } from '@/lib/gallery';
import { cutout } from '../../modules/cutout/src';
import type { Picture } from '@/types';

import { ApiError, requestDrawing } from './api';

const DRAWINGS_DIR = 'drawings';
const PHOTOS_DIR = 'photos';
const JPEG_QUALITY = 0.8;
const KEEP_JPEG_QUALITY = 0.85;

export type DrawErrorKind = 'no_brushes' | 'failed' | 'offline' | 'busy';

/** One id per drawing attempt. The server charges a request id once, so retries reuse it. */
export function newRequestId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** A bundled image (`require()`), a gallery photo (`ph://`) or a file URI as a local file URI. */
async function localUri(photo: Picture) {
  if (typeof photo === 'number') {
    const asset = await Asset.fromModule(photo).downloadAsync();
    if (!asset.localUri) throw new Error('Bundled photo has no local file');
    return asset.localUri;
  }
  if (typeof photo === 'object' && photo && 'uri' in photo && photo.uri) {
    return isGalleryId(photo.uri) ? galleryFileUri(photo.uri) : photo.uri;
  }
  throw new Error('Photo has no URI');
}

/** The photo as a JPEG, the long side at most `maxPx`. */
async function resizedJpeg(photo: Picture, maxPx: number, compress: number, base64: boolean) {
  const uri = await localUri(photo);
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const { width, height } = original;
  const image =
    Math.max(width, height) > maxPx
      ? await ImageManipulator.manipulate(uri)
          .resize(width >= height ? { width: maxPx } : { height: maxPx })
          .renderAsync()
      : original;
  return image.saveAsync({ format: SaveFormat.JPEG, compress, base64 });
}

/** JPEG as base64, the long side at most DRAW_PHOTO_PX. */
async function preparePhoto(photo: Picture) {
  const { base64 } = await resizedJpeg(photo, DRAW_PHOTO_PX, JPEG_QUALITY, true);
  if (!base64) throw new Error('Photo could not be encoded');
  return base64;
}

/**
 * Keeps a copy of the original photo with the memory, so it stays when the user deletes
 * it from the gallery. Bundled mock photos and photos already in documents stay as they are.
 */
async function keepPhoto(photo: Picture, requestId: string): Promise<Picture> {
  if (typeof photo === 'number') return photo;
  if (typeof photo === 'object' && photo && 'uri' in photo && photo.uri?.startsWith(Paths.document.uri)) return photo;
  const dir = new Directory(Paths.document, PHOTOS_DIR);
  dir.create({ idempotent: true, intermediates: true });
  const file = new File(dir, `${requestId}.jpg`);
  if (file.exists) file.delete();
  const { uri } = await resizedJpeg(photo, KEEP_PHOTO_PX, KEEP_JPEG_QUALITY, false);
  new File(uri).moveSync(file);
  return { uri: file.uri };
}

/** Saves the drawing with a transparent background. Gemini draws on white, Vision cuts it out. */
async function saveDrawing(base64: string, requestId: string): Promise<Picture> {
  const dir = new Directory(Paths.document, DRAWINGS_DIR);
  dir.create({ idempotent: true, intermediates: true });
  const raw = new File(dir, `${requestId}_raw.png`);
  const file = new File(dir, `${requestId}.png`);
  raw.write(base64, { encoding: 'base64' });
  if (file.exists) file.delete();
  // No cutout (old iOS, no subject): keep the white background rather than lose the drawing.
  if (await cutout(raw.uri, file.uri)) raw.delete();
  else raw.moveSync(file);
  return { uri: file.uri };
}

/**
 * Draws the photo. Returns the saved drawing, the kept copy of the photo and the new brush balance.
 * Throws DrawError; the server has already refunded the brush when it says "failed".
 */
export async function drawPhoto(photo: Picture, requestId: string) {
  const jpeg = await preparePhoto(photo);
  try {
    const { image, brushes } = await requestDrawing({ requestId, photo: jpeg, cards: [] });
    const drawing = await saveDrawing(image, requestId);
    // A failed copy must not lose a paid drawing: the memory is then saved without its photo.
    const kept = await keepPhoto(photo, requestId).catch((error: unknown) => {
      console.warn('keep_photo_failed', error);
      return undefined;
    });
    return { drawing, photo: kept, brushes };
  } catch (error) {
    throw new DrawError(kindOf(error), error instanceof ApiError ? error.body.brushes : undefined);
  }
}

export class DrawError extends Error {
  constructor(
    readonly kind: DrawErrorKind,
    readonly brushes?: ApiError['body']['brushes'],
  ) {
    super(`draw_${kind}`);
  }
}

function kindOf(error: unknown): DrawErrorKind {
  if (!(error instanceof ApiError)) return 'offline'; // fetch throws only when there is no answer
  if (error.status === 402) return 'no_brushes';
  if (error.status === 409 && error.body.error === 'in_progress') return 'busy';
  return 'failed';
}
