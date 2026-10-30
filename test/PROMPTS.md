# Prompt history

Model: gemini-nano-banana-2.1 (~$0.034 per image). `{n}` = number of character cards sent before the photo.
Current versions: **v1 = old v3 (card3 + cutout)**, **v2 = old v5 (card5)**. Images of the other versions were deleted on 2026-10-22.

## Tek başına (solo)

Only the photo, no reference.

```
Redraw this photo as a small hand-drawn memory sticker. Style: naive children's drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, simple shapes, warm and playful. Draw ONLY the main subject(s) (people and/or pets) and at most one or two key objects that tell the moment. Remove the background completely: plain pure white background, no shadows, no frame, no text. Keep what makes the subject recognizable: hair style and color, clothing colors, fur color and markings, pose and what they are doing. Center the drawing with generous white margin.
```

## Referanslı (ref)

First drawing of the set sent as reference. Copied pose/composition from it.

```
Image 1 is an existing crayon drawing of a character. Image 2 is a new photo of the same character(s). Redraw image 2 as a new memory sticker in exactly the same drawing style AND the same character design as image 1 (same face shape, hair, fur colors and markings, proportions, crayon texture). Clothing and pose should follow image 2. Draw ONLY the main subject(s) and at most one or two key objects. Plain pure white background, no shadows, no frame, no text. Center the drawing with generous white margin.
```

## Kartlı v1 (card)

Character cards sent with each photo. Good context; frontal faces/open eyes leaked from cards.

```
The first {n} image(s) are character reference cards for the people and pets of this memory collection. The LAST image is a new photo. Redraw ONLY the last photo as a memory sticker. Rules: draw only the people/pets that are actually visible in the last photo. If one of them matches a reference card, keep that card's look (face, hair, fur colors and markings, proportions). Never add a person or pet that is not visible in the last photo, even if it has a card. If no person or pet is visible, ignore all cards and draw only the main objects of the photo. Pose, gaze direction, hand positions, clothing, objects and composition must come ONLY from the last photo, never from the cards. Style: naive children's drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, simple shapes, warm and playful. Draw at most one or two key objects that tell the moment. Plain pure white background, no shadows, no frame, no text. Center the drawing with generous white margin.
```

## Kartlı v2 (card2)

card + FACE_RULE. 'Match exactly' spread to whole image; edge crops and background returned.

```
The first {n} image(s) are character reference cards for the people and pets of this memory collection. The LAST image is a new photo. Redraw ONLY the last photo as a memory sticker. Rules: draw only the people/pets that are actually visible in the last photo. If one of them matches a reference card, keep that card's look (face, hair, fur colors and markings, proportions). Never add a person or pet that is not visible in the last photo, even if it has a card. If no person or pet is visible, ignore all cards and draw only the main objects of the photo. Pose, gaze direction, hand positions, clothing, objects and composition must come ONLY from the last photo, never from the cards. The cards only show identity. Head turn and tilt, face angle (profile, three-quarter, looking down), eyes open or closed, smile or kiss, and every facial expression must match the last photo exactly, never the front-facing neutral face of a card. Style: naive children's drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, simple shapes, warm and playful. Draw at most one or two key objects that tell the moment. Plain pure white background, no shadows, no frame, no text. Center the drawing with generous white margin.
```

## v3 (card3) — NOW v1

Strict sticker, head rule, soft fade, + Apple Vision cutout (--cutout). Best faces and soft fade; lost sofa/plant/dog context.

```
The first {n} image(s) are character reference cards for the people and pets of this memory collection. The LAST image is a new photo. Redraw ONLY the last photo as a memory sticker.
Characters: draw only the people/pets visible in the last photo. If one matches a card, keep that card's look (face, hair, beard, fur colors and markings, proportions). Never add anyone who is not visible in the last photo. If no person or pet is visible, ignore all cards.
From the photo only: pose, hands, clothing, objects. For heads only: copy the photo's head turn and tilt, eyes open or closed and expression, not the card's front-facing face.
Do not invent: draw only body parts that are visible in the photo. If the photo cuts a person off (no feet, no legs), end the figure there with a soft crayon fade instead of completing it.
Style: naive children's drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, simple shapes, warm and playful. At most one or two key objects that tell the moment.
MOST IMPORTANT, sticker format: a single isolated sticker on a plain pure white background. No room, furniture, plants, walls, floor or scenery unless it is a key object. No shadows, no frame, no text. The whole drawing must fit inside the image with wide white margin on every side; nothing touches or crosses the edges.
```

## v1.2 (card3 + no halo) — NOW in the app

v1 with one more sentence at the end of the sticker rule. v1 sometimes drew faint sketch lines around a figure (seen on a white jacket); Vision kept them as part of the subject, with white paper between, so the sticker got a white halo. The app also clears white left next to the cut edge (cutout module, `clearWhiteEdge`). Not yet compared against v1 in test/compare.html.

Added after "...nothing touches or crosses the edges.":

```
Draw no outline, halo, glow, aura, sketch lines or motion lines around the figures; right outside every figure the background is pure white.
```

## v4 (card4)

card3 without strict rules, close context allowed, no cutout. Context back, but random deformed figures and invented background.

```
The first {n} image(s) are character reference cards for the people and pets of this memory collection. The LAST image is a new photo. Redraw the last photo as a small hand-drawn memory illustration.
Characters: draw every person and pet visible in the last photo (also small ones in corners or under furniture). If one matches a card, keep that card's look (face, hair, beard, fur colors and markings, proportions). Never add anyone who is not visible in the last photo. If no person or pet is visible, ignore all cards.
From the photo only: pose, hands, clothing, objects. For heads only: copy the photo's head turn and tilt, eyes open or closed and expression, not the card's front-facing face.
Context: keep the close things that tell the moment: what people sit or lean on (sofa, chair, bed), the table and what is on it, food, cups, plants on the table, toys, pets. Leave out walls, floor, windows, rooms, distant scenery and anything in the far background.
Framing: stay close to the photo's framing. Do not add feet or legs to a standing person whose legs are cut by the photo. Only if the photo is a very tight close-up that cuts off a head or most of a body, step back a little and complete it naturally.
Style: naive children's drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, simple shapes, warm and playful.
Background: plain pure white around the drawing, no shadows, no frame, no text, white margin on every side, nothing crosses the edges.
```

## v5 (card5) — NOW v2

v1 base + v3 soft fade + face focus + 'meaningful context only'. Good context and fade; clutter returned on me_05, edge overflow on cift_07.

```
The first {n} image(s) are character reference cards for the people and pets of this memory collection. The LAST image is a new photo. Redraw the last photo as a small hand-drawn memory illustration.
Characters: draw every person and pet visible in the last photo. If one matches a card, keep that card's look (face, hair, beard, fur colors and markings, proportions). Never add anyone who is not visible in the last photo. If no person or pet is visible, ignore all cards.
From the photo only: pose, hands, clothing, objects, head turn and tilt, eyes open or closed, expression.
Focus: put the most care and detail into the faces and people; they must look like the real people, solid and well proportioned.
Context: keep only a few close things that belong to the moment: what people sit on, what they hold, a nearby pet, a plant or plate on the table they use. Leave out clutter, crowded tables, half-cut chairs, walls, floor, rooms and distant scenery.
Edges: where the photo cuts a person or object off, do not complete it and do not end it with a hard edge; let the crayon strokes fade out softly. A partly visible arm or body of another person also fades out softly.
Style: naive children's drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, simple shapes, warm and playful.
Plain pure white background, no shadows, no frame, no text, white margin on every side, nothing crosses the edges.
```

## Character card prompt (make_cards.py)

```
From this photo, draw ONLY {who} as a character reference card. Full body, standing and facing forward, neutral relaxed pose, nothing in the hands or mouth, no other people or animals, no objects. Keep the exact look: face, hair or fur colors and markings, body proportions, and the clothing or collar visible in the photo. Style: naive children's drawing made with wax crayons and oil pastels, visible crayon texture, slightly wobbly outlines, simple shapes. Plain pure white background, no shadows, no frame, no text.
```
