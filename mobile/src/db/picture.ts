// Pictures are saved as text. Bundled mock images become "drawing:<key>" / "photo:<key>",
// real pictures keep their file URI.
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
  if (typeof picture === 'object' && picture && 'uri' in picture && picture.uri) return picture.uri;
  throw new Error('Picture has no URI');
}

export const fromPictureRef = (ref: string): Picture => assetOfRef.get(ref) ?? { uri: ref };
