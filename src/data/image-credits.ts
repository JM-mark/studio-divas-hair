/**
 * Image credits. Only images that are actually PUBLISHED belong in `publishedCredits`.
 * No stock photos (Pexels/Pixabay) are used yet; see scripts/fetch-stock.ts and .env.example.
 */
export interface ImageCredit { file: string; source: string; url: string; usedIn: string }

/** Currently published photos: none. The logo, icons and templates were created for the salon. */
export const publishedCredits: ImageCredit[] = [];

/** Held back until the owner supplies her own photos or the uploaders give permission (internal note, never rendered). */
export const heldBack = [
  'hero-interior.jpg', 'fachada.jpg', 'galeria-cachos.jpg', 'galeria-azul-ondas.jpg', 'galeria-azul-liso.jpg', 'galeria-unhas-pretas.jpg',
];
