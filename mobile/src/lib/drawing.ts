// Turns a photo into a drawing through the Worker. The photo is resized here, the
// drawing is saved under the app's documents. Neither is kept on the server.
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { DRAW_PHOTO_PX } from '@/constants';
import { cutout } from '../../modules/cutout/src';
import type { Picture } from '@/types';

import { ApiError, requestDrawing } from './api';

const DRAWINGS_DIR = 'drawings';
const JPEG_QUALITY = 0.8;

export type DrawErrorKind = 'no_brushes' | 'failed' | 'offline' | 'busy';

/** One id per drawing attempt. The server charges a request id once, so retries reuse it. */
export function newRequestId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** A bundled image (`require()`) or a file URI as a local file URI. */
async function localUri(photo: Picture) {
  if (typeof photo === 'number') {
    const asset = await Asset.fromModule(photo).downloadAsync();
    if (!asset.localUri) throw new Error('Bundled photo has no local file');
    return asset.localUri;
  }
  if (typeof photo === 'object' && photo && 'uri' in photo && photo.uri) return photo.uri;
  throw new Error('Photo has no URI');
}

/** JPEG as base64, the long side at most DRAW_PHOTO_PX. */
async function preparePhoto(photo: Picture) {
  const uri = await localUri(photo);
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const { width, height } = original;
  const image =
    Math.max(width, height) > DRAW_PHOTO_PX
      ? await ImageManipulator.manipulate(uri)
          .resize(width >= height ? { width: DRAW_PHOTO_PX } : { height: DRAW_PHOTO_PX })
          .renderAsync()
      : original;
  const { base64 } = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY, base64: true });
  if (!base64) throw new Error('Photo could not be encoded');
  return base64;
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
 * Draws the photo. Returns the saved drawing and the new brush balance.
 * Throws DrawError; the server has already refunded the brush when it says "failed".
 */
export async function drawPhoto(photo: Picture, requestId: string) {
  const jpeg = await preparePhoto(photo);
  try {
    const { image, brushes } = await requestDrawing({ requestId, photo: jpeg, cards: [] });
    return { drawing: await saveDrawing(image, requestId), brushes };
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
