/**
 * Studio utilities — преднастроенные «инструменты» в каталоге Studio.
 * Не являются отдельными моделями в registry — это пресеты,
 * которые открывают конкретную модель с готовыми параметрами.
 */

export interface StudioUtility {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnail: string;
  badges: Array<'NEW' | 'POPULAR' | 'CHEAP' | 'TREND' | 'HOT' | '4K' | 'AUDIO'>;
  // Target model + mode + prefilled parameters
  modelSlug: string;
  modelMode: string;
  parameters: Record<string, unknown>;
  // Display
  category: 'utility';
}

export const STUDIO_UTILITIES: StudioUtility[] = [
  {
    id: 'util-instagram-carousel',
    slug: 'instagram-carousel',
    name: 'Instagram карусели',
    description: 'Серия слайдов 4:5 для Reels и постов — готовый формат',
    thumbnail: '/models/nano-banana-2.png',
    badges: ['POPULAR'],
    modelSlug: 'nano-banana-2',
    modelMode: 't2i',
    parameters: {
      prompt: 'Instagram carousel slide design, minimal typography, brand-consistent color palette, social media post',
      aspectRatio: '4:5',
      numberOfImages: 4,
      outputResolution: '2K',
    },
    category: 'utility',
  },
  {
    id: 'util-digital-avatar',
    slug: 'digital-avatar',
    name: 'Цифровой аватар',
    description: 'Стилизованный портрет-аватар в высоком качестве',
    thumbnail: '/models/flux-2-pro.jpg',
    badges: ['NEW'],
    modelSlug: 'flux-2-pro',
    modelMode: 't2i',
    parameters: {
      prompt: 'Professional digital avatar portrait, clean studio lighting, soft gradient background, expressive eyes, head-and-shoulders framing',
      aspectRatio: '1:1',
      outputFormat: 'png',
      outputQuality: 95,
    },
    category: 'utility',
  },
  {
    id: 'util-cartoon',
    slug: 'create-cartoon',
    name: 'Создать мультфильм',
    description: 'Анимированная сцена в Pixar-стиле с движением и звуком',
    thumbnail: '/models/kling-3.jpg',
    badges: ['TREND', 'AUDIO'],
    modelSlug: 'kling-3',
    modelMode: 't2v',
    parameters: {
      prompt: 'Pixar-style 3D animated cartoon scene, expressive characters, vibrant colors, cinematic camera motion, family-friendly',
      aspectRatio: '16:9',
      duration: '10',
      mode: 'pro',
      enableAudio: true,
    },
    category: 'utility',
  },
  {
    id: 'util-cinema-studio',
    slug: 'cinema-studio',
    name: 'Киностудия',
    description: 'Голливудский кинокадр 21:9 с проф. световым решением',
    thumbnail: '/models/veo-31.webp',
    badges: ['NEW', '4K'],
    modelSlug: 'veo-31',
    modelMode: 't2v',
    parameters: {
      prompt: 'Hollywood cinema shot, anamorphic 2.39:1, professional color grading, dramatic three-point lighting, depth of field, 35mm film grain',
      model: 'veo3_quality',
      aspectRatio: '21:9',
      enableAudio: true,
    },
    category: 'utility',
  },
];

/** Build /studio link with prefilled parameters from utility */
export function utilityToLink(util: StudioUtility): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(util.parameters)) {
    params.set(k, String(v));
  }
  params.set('utilId', util.id);
  return `/studio/${util.modelSlug}/${util.modelMode}?${params.toString()}`;
}
