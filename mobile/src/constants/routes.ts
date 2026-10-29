// Typed hrefs for screens with params, so paths live in one place.

export const routes = {
  home: '/',
  onboarding: '/onboarding',
  offer: '/offer',
  firstDrawing: '/first-drawing',
  settings: '/settings',
  brushes: '/brushes',
  /** `notebook` limits swiping between the same day's memories to that notebook. */
  memory: (id: string, notebook?: string) =>
    ({ pathname: '/memory/[id]', params: notebook ? { id, notebook } : { id } }) as const,
  share: (id: string) => ({ pathname: '/share/[id]', params: { id } }) as const,
  notebook: (id: string) => ({ pathname: '/notebook/[id]', params: { id } }) as const,
  /** `notebook` skips the face guess (adding from an empty notebook). */
  add: (photo: string, notebook?: string) =>
    ({ pathname: '/add', params: notebook ? { photo, notebook } : { photo } }) as const,
  calendar: '/calendar',
} as const;
