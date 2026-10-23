import { SITE_URL } from './site-url.mjs';

/**
 * Single source of truth for the site. Edit here — nothing else needs to change.
 * Items marked TODO(owner) are placeholders or points the salon owner must confirm.
 */

export const business = {
  name: "Studio Diva's Hair",
  legalTitle: "Studio Diva's Hair – Salão de Beleza",
  tagline: 'Salão de Beleza Unissex no Centro de Indaiatuba',
  professional: 'Adriana',
  professionalNick: 'Dri',
  address: {
    street: 'R. Pedro de Toledo, 799',
    district: 'Centro',
    city: 'Indaiatuba',
    state: 'SP',
    zip: '13330-090',
    country: 'BR',
  },
  geo: { lat: -23.084908, lng: -47.2134706 },
  phoneDisplay: '(19) 99345-8629',
  phoneE164: '+5519993458629',
  whatsappNumber: '5519993458629',
  // TODO(owner): confirm the landline from the 2021 flyer is still active. Empty = hidden.
  phoneSecondaryDisplay: '(19) 3834-4868',
  phoneSecondaryE164: '+551938344868',
  mapsUrl: 'https://maps.app.goo.gl/fws4ko4nN24UcN5Y6',
  rating: { value: 5.0, count: 132 },
  // Public address: change it in src/data/site-url.mjs (single constant).
  siteUrl: SITE_URL,
  instagramUrl: 'https://www.instagram.com/studiodivascabeloecorpo/',
  instagramHandle: '@studiodivascabeloecorpo',
} as const;

export const bookingMessage = "Olá! Gostaria de agendar um horário no Studio Diva's Hair.";

export const whatsappLink = (message: string = bookingMessage) =>
  `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(message)}`;

export const mapsDirectionsUrl = business.mapsUrl;
export const mapsEmbedUrl = `https://www.google.com/maps?q=${business.geo.lat},${business.geo.lng}&z=17&hl=pt-BR&output=embed`;

export const fullAddress = `${business.address.street} – ${business.address.district}, ${business.address.city} – ${business.address.state}, ${business.address.zip}`;

/** day: 0 = Domingo … 6 = Sábado (JS getDay order). open/close in 24h "HH:MM"; null = fechado. */
export const hours: { day: number; label: string; open: string | null; close: string | null }[] = [
  { day: 1, label: 'Segunda', open: null, close: null },
  { day: 2, label: 'Terça', open: '08:00', close: '18:00' },
  { day: 3, label: 'Quarta', open: '09:00', close: '18:00' },
  { day: 4, label: 'Quinta', open: '08:00', close: '19:00' },
  { day: 5, label: 'Sexta', open: '08:00', close: '19:00' },
  { day: 6, label: 'Sábado', open: '08:00', close: '19:00' },
  { day: 0, label: 'Domingo', open: null, close: null },
];

export const schemaDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface Service {
  id: string;
  name: string;
  description: string;
  /** TODO(owner): e.g. 'A partir de R$ 80'. Empty = price hidden (owner prefers no prices; clients ask on WhatsApp). */
  price: string;
}
export interface ServiceGroup { id: string; title: string; intro: string; items: Service[] }

const svc = (name: string, description: string): Service => ({
  id: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'),
  name, description, price: '',
});

// Source: the salon's own flyer (2021) + treatments clients mention in Google reviews (matização, selagem).
// TODO(owner): confirm the list is still current.
export const serviceGroups: ServiceGroup[] = [
  { id: 'cabelo', title: 'Cabelo', intro: 'Para mulheres e homens, com atendimento personalizado.', items: [
    svc('Corte feminino', 'Um corte pensado para o seu rosto, seus fios e a sua rotina.'),
    svc('Corte masculino', 'Acabamento limpo e alinhado, do jeito que você gosta.'),
    svc('Corte bordado', 'Detalhes e contornos precisos para um visual marcante.'),
    svc('Hidratação', 'Maciez, brilho e vida de volta aos fios ressecados.'),
    svc('Matização', 'Realça o brilho e equilibra os tons de loiros e cabelos claros.'),
    svc('Escova', 'Fios alinhados e com movimento para qualquer ocasião.'),
    svc('Selagem', 'Menos frizz e fios mais leves e fáceis de pentear.'),
    svc('Progressiva', 'Escova progressiva para fios alinhados e fáceis de cuidar no dia a dia.'),
    svc('Mechas', 'Luminosidade e dimensão para o seu cabelo, com técnica e cuidado.'),
    svc('Cabelos étnicos', 'Especialista em cabelos étnicos, respeitando a natureza dos seus fios.'),
    svc('Desintoxicação da fibra capilar', 'Limpeza profunda para renovar a fibra e preparar o cabelo para os tratamentos.'),
    svc('Penteado', 'Penteados para festas, casamentos e eventos especiais.'),
  ]},
  { id: 'unhas', title: 'Unhas', intro: 'Mãos e pés bem cuidados.', items: [
    svc('Manicure e pedicure', 'Cuidado completo para mãos e pés, num atendimento tranquilo e atencioso.'),
    svc('Alongamento de unhas (gel e fibra)', 'Unhas alongadas com acabamento natural e durável.'),
  ]},
  { id: 'estetica', title: 'Estética e bem-estar', intro: 'Para realçar sua beleza e relaxar.', items: [
    svc('Maquiagem', 'Make para realçar o seu melhor em cada ocasião.'),
    svc('Design de sobrancelhas', 'Sobrancelhas harmonizadas com o formato do seu rosto.'),
    svc('Depilação feminina e masculina', 'Depilação para mulheres e homens.'),
    svc('Depilação método espanhol', 'Opção de depilação com o método espanhol.'),
    svc('Massoterapia', 'Massagem para aliviar a tensão e relaxar.'),
    svc('Estética', 'Cuidados estéticos com atenção personalizada.'),
  ]},
];

export const about = {
  // TODO(owner): review/replace this text. It is generic and based only on public review themes.
  title: 'Do primeiro oi ao último detalhe',
  paragraphs: [
    "No Studio Diva's Hair, um salão unissex no Centro de Indaiatuba, cada atendimento é pensado para você. A Adriana, a Dri, recebe cada cliente com carinho e atenção, escuta o que você deseja e orienta com sinceridade sobre o melhor caminho para os seus fios.",
    'O objetivo é simples: que você saia daqui se sentindo bem, bonita e pronta para qualquer ocasião — e com dicas práticas para cuidar do cabelo em casa.',
    'Do corte ao cuidado com as unhas, passando por tratamentos e estética, venha sentir a diferença de um atendimento personalizado.',
  ],
};

export interface Testimonial { quote: string; author: string; when: string; reply?: string }

// Real public Google reviews (Google Maps listing), copied as written.
// TODO(owner): confirm each client's permission to be quoted (names are shortened to first name + initial).
export const testimonials: Testimonial[] = [
  { quote: 'Adorei a experiência. A Adri além de ser uma ótima profissional, também é uma pessoa incrível, simpática, me deixou super a vontade, além de me dar várias dicas de como cuidar do meu cabelo.', author: 'Viviane Q.', when: 'há 7 meses' },
  { quote: 'Cabelinho devidamente cortado, hidratado e matizado. Me sinto pronta para o Réveillon. O atendimento da Dri é impecável, ela é extremamente atenciosa e querida e tudo o que ela faz fica perfeito 🤍…', author: 'Maria M.', when: 'há 10 meses', reply: 'Eu que agradeço de coração pela confiança e pelo carinho… estou à disposição sempre.' },
  { quote: 'Quero agradecer pelo carinho e capricho. Minhas unhas ficaram perfeitas e o atendimento foi excelente. Com certeza virei cliente!', author: 'Thaiane M.', when: 'há 10 meses', reply: 'Um enorme prazer em atendê-la.. Obrigada pelo carinho e confiança.' },
];

/**
 * Feature flags. showClientPhotos stays OFF until the owner sends her own photos (and permission for any client photos).
 * It controls EVERY client-uploaded photo: hero, "Sobre" facade, gallery and the Instagram photo grid. While off, the
 * site shows brand-coloured panels instead, and the photo files are git-ignored (see .gitignore).
 */
export const features = { showClientPhotos: false };

const allNav = [
  { href: '#servicos', label: 'Serviços' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#galeria', label: 'Galeria' },
  { href: '#avaliacoes', label: 'Avaliações' },
  { href: '#contato', label: 'Contato' },
];
export const navLinks = allNav.filter((l) => features.showClientPhotos || l.href !== '#galeria');

/**
 * Gallery photos (files in src/assets/images/). TODO(owner): replace with your own photos of your work;
 * these four come from public Google Maps photos and need the photographers' permission before launch.
 */
export const gallery = [
  { file: 'galeria-cachos.jpg', alt: 'Cabelo longo com cachos definidos e mechas douradas, visto de costas' },
  { file: 'galeria-azul-ondas.jpg', alt: 'Cabelo com coloração azul em tons de petróleo e pontas onduladas' },
  { file: 'galeria-azul-liso.jpg', alt: 'Cabelo liso com mechas azul-elétrico' },
  { file: 'galeria-unhas-pretas.jpg', alt: 'Mão com unhas curtas pretas decoradas com detalhes' },
] as const;
