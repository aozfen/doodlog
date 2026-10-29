/**
 * Turkish-safe uppercase: "i" becomes "İ", "ı" becomes "I".
 * textTransform: 'uppercase' gives "SEVGILIMLE", so it is done by hand.
 */
export const toUpperCaseTr = (s: string) => s.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();

const BACK_VOWELS = 'aıou';
const FRONT_VOWELS = 'eiöü';

/**
 * Name + Turkish dative suffix with an apostrophe: "Kendim'e", "Fıstık'a", "Ailem'e",
 * "Sevgilimle'ye". The suffix follows the last vowel; a name ending in a vowel takes "y".
 */
export function withDative(name: string) {
  const lower = name.toLocaleLowerCase('tr-TR');
  const vowels = [...lower].filter((c) => BACK_VOWELS.includes(c) || FRONT_VOWELS.includes(c));
  const last = vowels.at(-1);
  const vowel = last && BACK_VOWELS.includes(last) ? 'a' : 'e';
  const buffer = last && lower.endsWith(last) ? 'y' : '';
  return `${name}'${buffer}${vowel}`;
}

/** First letter of a name, uppercase, for avatars. */
export const initialOf = (name: string) => toUpperCaseTr(name.slice(0, 1));
