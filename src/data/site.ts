import { SITE_URL } from './site-url.mjs';

/**
 * Single source of truth for the site. Edit here; nothing else needs to change.
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

/** wa.me link for an already-composed message. Booking messages are only built by src/lib/booking.ts, from validated values. */
export const whatsappUrl = (message: string) => `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(message)}`;

/** The one static WhatsApp link on the site: general questions, never an empty or generic booking message. */
export const questionMessage = 'Olá! Vim pelo site e tenho uma dúvida:';
export const questionLink = whatsappUrl(questionMessage);

/** Every booking CTA points here: the guided form (src/components/Booking.astro). */
export const bookingAnchor = '#agendar-horario';

export const mapsDirectionsUrl = business.mapsUrl;
export const mapsEmbedUrl = `https://www.google.com/maps?q=${business.geo.lat},${business.geo.lng}&z=17&hl=pt-BR&output=embed`;

export const fullAddress = `${business.address.street}, ${business.address.district}, ${business.address.city}, ${business.address.state}, ${business.address.zip}`;

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
  title: ['Do primeiro oi ao ', 'último detalhe'],
  paragraphs: [
    "No Studio Diva's Hair, um salão unissex no Centro de Indaiatuba, cada atendimento é pensado para você. A Adriana, a Dri, recebe cada cliente com carinho e atenção, escuta o que você deseja e orienta com sinceridade sobre o melhor caminho para os seus fios.",
    'O objetivo é simples: que você saia daqui se sentindo bem, bonita e pronta para qualquer ocasião, com dicas práticas para cuidar do cabelo em casa.',
    'Do corte às unhas, dos tratamentos à estética, venha sentir a diferença de um atendimento feito com calma e atenção.',
  ],
};

export interface Testimonial { quote: string; author: string; when: string }

// Real public Google reviews (Google Maps listing), copied as written.
// TODO(owner): confirm each client's permission to be quoted (names are shortened to first name + initial).
export const testimonials: Testimonial[] = [
  { quote: 'Adorei a experiência. A Adri além de ser uma ótima profissional, também é uma pessoa incrível, simpática, me deixou super a vontade, além de me dar várias dicas de como cuidar do meu cabelo.', author: 'Viviane Q.', when: 'há 7 meses' },
  { quote: 'Cabelinho devidamente cortado, hidratado e matizado. Me sinto pronta para o Réveillon. O atendimento da Dri é impecável, ela é extremamente atenciosa e querida e tudo o que ela faz fica perfeito 🤍…', author: 'Maria M.', when: 'há 10 meses' },
  { quote: 'Quero agradecer pelo carinho e capricho. Minhas unhas ficaram perfeitas e o atendimento foi excelente. Com certeza virei cliente!', author: 'Thaiane M.', when: 'há 10 meses' },
];

export const navLinks = [
  { href: '#servicos', label: 'Serviços' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#avaliacoes', label: 'Avaliações' },
  { href: '#contato', label: 'Contato' },
];

export const serviceCount = serviceGroups.reduce((n, g) => n + g.items.length, 0);

/** Hero proof card: a short excerpt copied as written from a real Google review (first name + initial). */
export const heroReview = { quote: 'A Adri além de ser uma ótima profissional, também é uma pessoa incrível, simpática', author: 'Viviane Q.' };

/** The four pinned chapters. `key` = image set in public/media (see src/data/image-credits.ts). title = [plain, italic accent]. */
export const chapters = [
  { n: '01', label: 'A Conversa', key: 'conversa', title: ['Tudo começa ', 'ouvindo você'],
    text: 'Antes de qualquer tesoura ou produto, a gente conversa. Você conta o que deseja e nós explicamos cada passo com clareza.' },
  { n: '02', label: 'O Diagnóstico', key: 'diagnostico', title: ['Cada fio ', 'tem uma história'],
    text: 'Olhamos o seu cabelo com calma e indicamos só o que faz sentido para ele, com toda sinceridade.' },
  { n: '03', label: 'O Cuidado', key: 'cuidado', title: ['Capricho em ', 'cada detalhe'],
    text: 'Técnica, atenção e carinho do começo ao fim, para você relaxar e aproveitar o momento.' },
  { n: '04', label: 'O Resultado', key: 'resultado', title: ['Liso, leve e ', 'cheio de brilho'],
    text: 'Fios alinhados, macios e com brilho de salão. E você sai com dicas simples para manter em casa.' },
] as const;

/** The three service cards (one per serviceGroups entry, same ids). */
export const serviceCards = [
  { id: 'cabelo', key: 'cabelo', title: ['Cabelo', ''], line: 'Corte, escova, progressiva, hidratação e mais, para mulheres e homens.', ask: 'cabelo' },
  { id: 'unhas', key: 'unhas', title: ['Unhas', ''], line: 'Mãos e pés bem cuidados, com acabamento natural e durável.', ask: 'unhas' },
  { id: 'estetica', key: 'estetica', title: ['Estética e ', 'bem-estar'], line: 'Maquiagem, sobrancelhas, depilação e momentos para relaxar.', ask: 'estética e bem-estar' },
] as const;

export const aboutPoints = [
  { title: 'Atendimento personalizado', text: 'Cada pessoa é única: escutamos antes de indicar o melhor caminho.' },
  { title: 'Orientação sincera', text: 'Dicas práticas para cuidar do cabelo em casa.' },
  { title: 'Para mulheres e homens', text: 'Salão unissex, com cabelo, unhas e estética no mesmo lugar.' },
  { title: 'Cabelos étnicos', text: 'Atendimento atento à natureza de cada fio.' },
] as const;
