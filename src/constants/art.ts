// Bundled app illustrations (not user drawings), in the same crayon sticker style.
import type { Picture } from '@/types';

export const ART = {
  /** Two hands drawing in one notebook: invite sheet when the notebook has no cover yet. */
  inviteTogether: require('@/assets/art/invite_together.png'),
  /** Blank polaroid and a crayon: cover spot of an empty notebook. */
  emptyCover: require('@/assets/art/empty_cover.png'),
  exitOffer: require('@/assets/art/exit_offer.png'),
} satisfies Record<string, Picture>;
