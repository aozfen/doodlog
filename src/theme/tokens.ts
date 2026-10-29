// Theme tokens. Source of truth: design/TEMA.md (A v2).
// Rule: the drawing is the hero, the UI stays quiet. One accent color (red).

export const colors = {
  bg: '#f7f5f0', // screen background
  surface: '#fffdf7', // card, notebook, field
  surfaceTop: '#ffffff', // top of the raised gradient
  edge: '#e2dbcd', // hard 3D bottom edge of light surfaces
  edgeSoft: '#ddd5c6', // edge of small parts and secondary button
  line: '#ebe5d9', // border of flat (non-tappable) cards
  empty: '#efebe3', // empty calendar day
  chip: '#efe9de', // chip / icon button surface
  chipEdge: '#cec8bf', // edge of chips, tags and icon buttons
  secondary: '#f3eee5', // light button face
  dot: '#e6e0d4', // empty day in the year map
  radio: '#cfc8bb', // empty radio ring
  chevron: '#b5aea2',
  grab: '#d6cfc2', // sheet handle
  inkMuted: '#8d877c', // unselected segment, month labels
  pill: '#f1ece3',
  // One neutral dark for text, dark buttons and the bottom bar (was purple-tinted #2a2733).
  ink: '#161616', // text, dark button
  inkTop: '#3b3a3e', // top of the dark button gradient
  inkEdge: '#000000', // dark button edge
  red: '#c9533a', // single accent: today, brush, "1 year ago", badge
  redTop: '#d8664d', // top of the red button gradient
  redLight: '#e0705c', // start of progress bars
  ok: '#3d8a55', // status only: "connected", brushes added (+20)
  okOnDark: '#8fd19e', // check icon on the dark toast
  redOnDark: '#f0a493', // action text on the dark toast ("Geri al")
  redEdge: '#8e3426',
  dashed: '#c9c0ae',
  dashedText: '#8d7f66',
  placeholder: '#a39d92',
  white: '#ffffff',
  black: '#000000',
  scrim: 'rgba(22,22,22,0.38)',
  viewer: 'rgba(10,10,10,0.94)', // full screen photo backdrop
  bgClear: 'rgba(247,245,240,0)', // bg at 0 alpha, for fades
  badge: 'rgba(255,255,255,0.92)',
  onDarkSoft: 'rgba(255,255,255,0.12)',
  dashedSoft: 'rgba(22,22,22,0.25)',
  // Floating bottom bar
  bar: '#161616', // same as ink
  barTop: '#3b3a3e', // same as inkTop
  barIcon: '#8f8b84',
  barAddTop: '#ffffff',
  barAdd: '#ebe6dc',
  barAddEdge: '#d3ccbf',
} as const;

// Secondary text = ink at 55% opacity.
export const opacity = { mute: 0.55, faint: 0.3, disabled: 0.45, placeholderArt: 0.75 } as const;

// Spacing: multiples of 8, screen gutter 20.
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, xxxl: 32, gutter: 20 } as const;

export const radius = {
  card: 28,
  notebook: 18,
  button: 28,
  chip: 20,
  field: 18,
  day: 10,
  sheet: 32,
  thumb: 16,
  option: 20, // kind option in the "Yeni defter" sheet
} as const;

// Hard 3D edge thickness. Only tappable things are raised.
export const depth = { card: 5, small: 3, button: 5, pressed: 2 } as const;

export const fonts = {
  hand: 'Caveat_700Bold', // one title per screen only, never under 18px
  regular: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
} as const;

export const type = {
  // paddingRight: Caveat's last letter leans past its box and iOS clips it ("Ahmet" lost the t's tail).
  hand: { fontFamily: fonts.hand, fontSize: 38, lineHeight: 40, paddingRight: 8, color: colors.ink },
  sec: { fontFamily: fonts.heavy, fontSize: 20, lineHeight: 24, letterSpacing: -0.2, color: colors.ink },
  note: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 21.6, color: colors.ink },
  body: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.ink },
  sub: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 17, color: colors.ink, opacity: opacity.mute },
  label: {
    fontFamily: fonts.heavy,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.66,
    color: colors.ink,
    opacity: opacity.mute,
  },
  button: { fontFamily: fonts.heavy, fontSize: 16, color: colors.ink },
} as const;

export type TypeVariant = keyof typeof type;
