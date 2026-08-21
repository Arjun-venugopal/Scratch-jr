/**
 * AnimalSVGs — Inline SVG data for cute, kid-friendly characters.
 */

export interface AnimalCharacter {
  id: string;
  name: string;
  category: AnimalCategory;
  emoji: string;
  svg: string;
}

export type AnimalCategory =
  | 'animals'
  | 'kids'
  | 'fantasy'
  | 'vehicles'
  | 'objects'
  | 'letters'
  | 'numbers';

export const ANIMAL_CATEGORY_INFO: Record<AnimalCategory, { label: string; emoji: string; color: string }> = {
  animals:  { label: 'Animals',  emoji: '🐱', color: '#f472b6' },
  kids:     { label: 'Kids',     emoji: '👦', color: '#fb923c' },
  fantasy:  { label: 'Fantasy',  emoji: '🦄', color: '#c084fc' },
  vehicles: { label: 'Vehicles', emoji: '🚗', color: '#38bdf8' },
  objects:  { label: 'Objects',  emoji: '⚽', color: '#4ade80' },
  letters:  { label: 'Letters',  emoji: '🔤', color: '#facc15' },
  numbers:  { label: 'Numbers',  emoji: '🔢', color: '#ec4899' },
};

function makeSvg(body: string, size = 80): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${body}</svg>`;
}

export function svgToUrl(svg: string): string {
  return `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(svg))) : Buffer.from(svg).toString('base64')}`;
}

// ── SVG Character Definitions ──────────────────────────────────
const CAT_SVG = makeSvg(`
  <circle cx="40" cy="45" r="22" fill="#FF9F43"/>
  <polygon points="22,28 18,8 32,22" fill="#FF9F43"/>
  <polygon points="58,28 62,8 48,22" fill="#FF9F43"/>
  <circle cx="33" cy="40" r="4" fill="#2d3436"/>
  <circle cx="47" cy="40" r="4" fill="#2d3436"/>
  <circle cx="34" cy="39" r="1.5" fill="white"/>
  <circle cx="48" cy="39" r="1.5" fill="white"/>
  <ellipse cx="40" cy="48" rx="3" ry="2" fill="#e17055"/>
  <path d="M37 50 Q40 54 43 50" stroke="#2d3436" stroke-width="1.5" fill="none"/>
`);

const DOG_SVG = makeSvg(`
  <circle cx="40" cy="45" r="22" fill="#B97A57"/>
  <ellipse cx="24" cy="28" rx="8" ry="14" fill="#8B5E3C"/>
  <ellipse cx="56" cy="28" rx="8" ry="14" fill="#8B5E3C"/>
  <circle cx="33" cy="40" r="4" fill="#2d3436"/>
  <circle cx="47" cy="40" r="4" fill="#2d3436"/>
  <ellipse cx="40" cy="48" rx="5" ry="3.5" fill="#2d3436"/>
`);

const BOY_SVG = makeSvg(`
  <circle cx="40" cy="35" r="20" fill="#FFD3B6"/>
  <path d="M 20 30 Q 40 10 60 30 Z" fill="#6C5CE7"/>
  <circle cx="33" cy="35" r="3" fill="#2D3436"/>
  <circle cx="47" cy="35" r="3" fill="#2D3436"/>
  <path d="M 32 45 Q 40 52 48 45" stroke="#2D3436" stroke-width="2" fill="none"/>
  <rect x="25" y="55" width="30" height="20" rx="5" fill="#0984E3"/>
`);

const UNICORN_SVG = makeSvg(`
  <circle cx="40" cy="45" r="20" fill="#F8EFBA"/>
  <polygon points="40,5 35,25 45,25" fill="#F39C12"/>
  <circle cx="33" cy="42" r="3" fill="#2C3E50"/>
  <circle cx="47" cy="42" r="3" fill="#2C3E50"/>
  <path d="M 20 30 Q 10 40 20 60 Q 30 40 20 30 Z" fill="#E84393"/>
`);

const CAR_SVG = makeSvg(`
  <rect x="15" y="35" width="50" height="20" rx="8" fill="#E74C3C"/>
  <path d="M 25 35 Q 40 20 55 35 Z" fill="#3498DB"/>
  <circle cx="28" cy="55" r="7" fill="#2C3E50"/>
  <circle cx="52" cy="55" r="7" fill="#2C3E50"/>
`);

const BALL_SVG = makeSvg(`
  <circle cx="40" cy="40" r="25" fill="#2ECC71"/>
  <path d="M 20 40 Q 40 20 60 40 Q 40 60 20 40 Z" fill="#F1C40F"/>
`);

const LETTER_A_SVG = makeSvg(`
  <text x="40" y="55" font-size="48" font-weight="900" text-anchor="middle" fill="#E67E22" font-family="sans-serif">A</text>
`);

const NUMBER_1_SVG = makeSvg(`
  <text x="40" y="55" font-size="48" font-weight="900" text-anchor="middle" fill="#9B59B6" font-family="sans-serif">1</text>
`);

export const ANIMAL_CHARACTERS: AnimalCharacter[] = [
  // Animals
  { id: 'cat',  name: 'Whiskers Cat', category: 'animals', emoji: '🐱', svg: CAT_SVG },
  { id: 'dog',  name: 'Buddy Dog',    category: 'animals', emoji: '🐶', svg: DOG_SVG },

  // Kids
  { id: 'boy',  name: 'Leo Boy',      category: 'kids',    emoji: '👦', svg: BOY_SVG },

  // Fantasy
  { id: 'uni',  name: 'Sparkle Unicorn', category: 'fantasy', emoji: '🦄', svg: UNICORN_SVG },

  // Vehicles
  { id: 'car',  name: 'Red Car',      category: 'vehicles', emoji: '🚗', svg: CAR_SVG },

  // Objects
  { id: 'ball', name: 'Soccer Ball',  category: 'objects',  emoji: '⚽', svg: BALL_SVG },

  // Letters
  { id: 'letA', name: 'Letter A',     category: 'letters',  emoji: '🅰️', svg: LETTER_A_SVG },

  // Numbers
  { id: 'num1', name: 'Number 1',     category: 'numbers',  emoji: '1️⃣', svg: NUMBER_1_SVG },
];

export function getCharactersByCategory(cat: AnimalCategory): AnimalCharacter[] {
  return ANIMAL_CHARACTERS.filter((c) => c.category === cat);
}
