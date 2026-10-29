import { requireOptionalNativeModule } from 'expo';

type CutoutModule = { cutout(input: string, output: string): Promise<boolean> };

// Optional: a build without the native module (old dev client) keeps the white background.
const native = requireOptionalNativeModule<CutoutModule>('Cutout');

/**
 * Writes `input` with a transparent background to `output` (file URIs).
 * iOS uses Apple Vision. Android uses ML Kit, and clears the white background
 * where Google Play services are missing (Huawei) or ML Kit fails.
 * Returns false when nothing was cut: no native module, iOS < 17 or no subject found on iOS.
 */
export async function cutout(input: string, output: string) {
  if (!native) return false;
  try {
    return await native.cutout(input, output);
  } catch {
    return false;
  }
}
