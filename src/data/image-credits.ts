/**
 * Image and video credits. Every file in public/media comes from here (scripts/process-media.mjs reads this list).
 * All items are published under the Pexels License (https://www.pexels.com/license/): free for commercial use, no
 * attribution required, edits allowed; people shown must not be presented as endorsing the business.
 * They are illustrative stock images: they are NEVER presented as the salon's work, as Adriana or as a client.
 */
export interface PhotoCredit {
  /** key used by scripts/process-media.mjs and the components (public/media/{key}-…) */
  key: string;
  /** Pexels photo id (the original is fetched from the public image CDN) */
  id: number;
  title: string;
  photographer: string;
  photographerUrl: string;
  pageUrl: string;
  usedIn: string;
  alt: string;
}

const photo = (p: Omit<PhotoCredit, 'photographerUrl' | 'pageUrl'> & { handle: string; slug: string }): PhotoCredit => ({
  key: p.key, id: p.id, title: p.title, photographer: p.photographer, usedIn: p.usedIn, alt: p.alt,
  photographerUrl: `https://www.pexels.com/@${p.handle}/`,
  pageUrl: `https://www.pexels.com/photo/${p.slug}-${p.id}/`,
});

export const photoCredits: PhotoCredit[] = [
  photo({ key: 'conversa', id: 3992863, title: 'Getting a Haircut', photographer: 'cottonbro studio', handle: 'cottonbro', slug: 'getting-a-haircut',
    usedIn: 'Capítulo 01 · A Conversa', alt: 'Cabeleireira conversando com uma cliente diante do espelho do salão' }),
  photo({ key: 'diagnostico', id: 23349912, title: 'A Hairdresser Combing Clients Hair', photographer: 'Oleskandra Biliak', handle: 'oleksandra', slug: 'a-hairdresser-combing-clients-hair',
    usedIn: 'Capítulo 02 · O Diagnóstico', alt: 'Mãos de cabeleireira examinando e penteando mechas longas e lisas' }),
  photo({ key: 'cuidado', id: 14615061, title: 'Hairdresser Making Woman Hairstyle', photographer: 'Daniil Kondrashin', handle: 'konrads-photo', slug: 'hairdresser-making-woman-hairstyle',
    usedIn: 'Capítulo 03 · O Cuidado', alt: 'Escova e secador alinhando fios longos em um salão de luz quente' }),
  photo({ key: 'resultado', id: 7479946, title: 'Gorgeous model with makeup and long hair', photographer: 'Alyona Stafeeva', handle: 'stuffotoo', slug: 'gorgeous-model-with-makeup-and-long-hair',
    usedIn: 'Capítulo 04 · O Resultado', alt: 'Mulher loira com cabelo longo, liso e brilhante sob luz suave' }),
  photo({ key: 'cabelo', id: 2325807, title: 'Portrait of Woman Looking side', photographer: 'fall maple', handle: 'fall-maple-1195057', slug: 'portrait-of-woman-looking-side',
    usedIn: 'Serviços · Cabelo', alt: 'Mulher de perfil com cabelo longo, castanho e liso' }),
  photo({ key: 'unhas', id: 4677845, title: 'A Person Getting a Nail Polish', photographer: 'Leeloo The First', handle: 'leeloothefirst', slug: 'a-person-getting-a-nail-polish',
    usedIn: 'Serviços · Unhas', alt: 'Manicure aplicando esmalte escuro nas unhas de uma cliente' }),
  photo({ key: 'estetica', id: 37710473, title: 'Bride Getting Ready with Makeup Artist', photographer: 'Alexander Mass', handle: 'rebornfilmes', slug: 'bride-getting-ready-with-makeup-artist',
    usedIn: 'Serviços · Estética e bem-estar', alt: 'Maquiadora preparando uma mulher de roupão, com luz natural' }),
  photo({ key: 'sobre', id: 7195806, title: 'Beauty salon with reception desk', photographer: 'Max Vakhtbovych', handle: 'artbovich', slug: 'beauty-salon-with-reception-desk',
    usedIn: "Sobre (imagem ilustrativa de salão; não é o Studio Diva's Hair)", alt: 'Interior elegante de um salão de beleza, com espelhos iluminados e piso de mármore escuro' }),
];

export interface VideoCredit { id: number; title: string; creator: string; creatorUrl: string; pageUrl: string; file: string; usedIn: string }
export const videoCredit: VideoCredit = {
  id: 36707549,
  title: 'Blonde Woman Showcasing Silky Long Hair',
  creator: 'Zenia Diamond',
  creatorUrl: 'https://www.pexels.com/@zenia-diamond-2147728402/',
  pageUrl: 'https://www.pexels.com/video/blonde-woman-showcasing-silky-long-hair-36707549/',
  file: 'https://videos.pexels.com/video-files/36707549/15558864_1080_1920_30fps.mp4',
  usedIn: 'Vídeo do topo da página (câmera lenta, em loop, com o mesmo tratamento de cor das fotos)',
};
