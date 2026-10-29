// Drawing prompt v1 (test/PROMPTS.md, "v3 (card3) — NOW v1"). Keep in sync with
// test/scripts/generate_google.py. A new version must beat v1 in test/compare.html first.

const STYLE =
  'Style: naive children\'s drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, ' +
  'simple shapes, warm and playful. At most one or two key objects that tell the moment.\n';

const STICKER =
  'MOST IMPORTANT, sticker format: a single isolated sticker on a plain pure white background. ' +
  'No room, furniture, plants, walls, floor or scenery unless it is a key object. No shadows, no frame, no text. ' +
  'The whole drawing must fit inside the image with wide white margin on every side; nothing touches or crosses the edges.';

const NO_INVENT =
  'Do not invent: draw only body parts that are visible in the photo. If the photo cuts a person off (no feet, no legs), ' +
  'end the figure there with a soft crayon fade instead of completing it.\n';

const withCards = (n: number) =>
  `The first ${n} image(s) are character reference cards for the people and pets of this memory collection. ` +
  'The LAST image is a new photo. Redraw ONLY the last photo as a memory sticker.\n' +
  "Characters: draw only the people/pets visible in the last photo. If one matches a card, keep that card's look " +
  '(face, hair, beard, fur colors and markings, proportions). Never add anyone who is not visible in the last photo. ' +
  'If no person or pet is visible, ignore all cards.\n' +
  "From the photo only: pose, hands, clothing, objects. For heads only: copy the photo's head turn and tilt, " +
  "eyes open or closed and expression, not the card's front-facing face.\n" +
  NO_INVENT +
  STYLE +
  STICKER;

const withoutCards =
  'Redraw this photo as a memory sticker.\n' +
  'Characters: draw only the people/pets visible in the photo. Keep what makes them recognizable: face, hair, beard, ' +
  'fur colors and markings, proportions. Copy their pose, hands, clothing, head turn and tilt, eyes open or closed ' +
  'and expression.\n' +
  NO_INVENT +
  STYLE +
  STICKER;

export const drawingPrompt = (cardCount: number) => (cardCount > 0 ? withCards(cardCount) : withoutCards);
