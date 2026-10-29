// Pictures are saved as text. Bundled mock images become "drawing:<key>" / "photo:<key>".
// Files in the app's documents become "doc:<relative path>": iOS moves the documents folder
// on updates, so the full URI would break. Other pictures keep their URI.
import { File, Paths } from 'expo-file-system';

import { drawings, photos } from '@/mock/images';
import type { Picture } from '@/types';

const refOfAsset = new Map<number, string>();
const assetOfRef = new Map<string, number>();

const register = (prefix: string, images: Partial<Record<string, number>>) => {
  for (const [key, asset] of Object.entries(images)) {
    if (asset === undefined) continue;
    refOfAsset.set(asset, `${prefix}:${key}`);
    assetOfRef.set(`${prefix}:${key}`, asset);
  }
};
register('drawing', drawings);
register('photo', photos);

export function toPictureRef(picture: Picture): string {
  if (typeof picture === 'number') {
    const ref = refOfAsset.get(picture);
    if (!ref) throw new Error('Unknown bundled picture');
    return ref;
  }
  if (typeof picture === 'object' && picture && 'uri' in picture && picture.uri) {
    const docs = Paths.document.uri;
    return picture.uri.startsWith(docs) ? DOC_PREFIX + picture.uri.slice(docs.length) : picture.uri;
  }
  throw new Error('Picture has no URI');
}

const DOC_PREFIX = 'doc:';

/** The picture is a file the app saved (a real drawing or photo), not a bundled mock image. */
export const isDocRef = (ref: string) => ref.startsWith(DOC_PREFIX);

export function fromPictureRef(ref: string): Picture {
  const bundled = assetOfRef.get(ref);
  if (bundled !== undefined) return bundled;
  if (ref.startsWith(DOC_PREFIX)) return { uri: Paths.document.uri + ref.slice(DOC_PREFIX.length) };
  return { uri: ref };
}

/** The saved file is still there. A permanently deleted memory's file is gone. */
export function pictureFileExists(ref: string) {
  try {
    return new File(Paths.document.uri + ref.slice(DOC_PREFIX.length)).exists;
  } catch {
    return false;
  }
}

/** Removes the picture's file when the app saved it in documents. Bundled images are left alone. */
export function deletePictureFile(ref: string) {
  if (!isDocRef(ref)) return;
  try {
    const file = new File(Paths.document.uri + ref.slice(DOC_PREFIX.length));
    if (file.exists) file.delete();
  } catch {
    // A file that cannot be removed only takes space; the row is already gone.
  }
}
