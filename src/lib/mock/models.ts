import type { AIModel, ContentTab, TaskCategoryItem } from '@/types';

export const taskCategories: TaskCategoryItem[] = [
  {
    id: 'video',
    label: 'Генерация видео',
    tasks: [
      { id: 'text-to-video', label: 'Текст → Видео', icon: 'FileText' },
      { id: 'image-to-video', label: 'Фото → Видео', icon: 'ImagePlay' },
      { id: 'video-to-video', label: 'Видео → Видео', icon: 'RefreshCw' },
      { id: 'lip-sync', label: 'Lip Sync', icon: 'Mic' },
      { id: 'video-editing', label: 'Монтаж видео', icon: 'Scissors' },
    ],
  },
  {
    id: 'image',
    label: 'Генерация изображений',
    tasks: [
      { id: 'text-to-image', label: 'Текст → Фото', icon: 'Type' },
      { id: 'image-to-image', label: 'Фото → Фото', icon: 'ImagePlus' },
      { id: 'image-editing', label: 'Редактор фото', icon: 'Paintbrush' },
    ],
  },
  {
    id: 'character',
    label: 'Персонажи',
    tasks: [
      { id: 'avatar', label: 'Аватары', icon: 'UserCircle' },
      { id: 'mascot', label: 'Маскоты', icon: 'Sparkles' },
    ],
  },
  {
    id: 'content',
    label: 'Контент',
    tasks: [
      { id: 'carousel', label: 'Карусель', icon: 'LayoutGrid' },
      { id: 'cinema', label: 'Кино-студия', icon: 'Clapperboard' },
    ],
  },
];

// --- Video model fields (per-model, based on KIE API docs) ---

// Kling 2.6: text-to-video + image-to-video (start frame only, no end frame)
const klingFields: AIModel['fields'] = [
  { name: 'prompt', type: 'textarea', label: 'Промпт', required: true, placeholder: 'Опишите видео (макс. 1000 символов)...', maxLength: 1000 },
  { name: 'image', type: 'image-upload', label: 'Стартовый кадр', required: false },
  { name: 'duration', type: 'duration', label: 'Длительность', required: true, options: [{ value: '5', label: '5 сек' }, { value: '10', label: '10 сек' }] },
  { name: 'aspectRatio', type: 'select', label: 'Соотношение сторон', required: true, options: [{ value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '1:1', label: '1:1' }] },
  { name: 'sound', type: 'toggle', label: 'Звук', required: false },
];

// Kling 3.0: start + end frame, mode std/pro, 3-15 сек
const kling3Fields: AIModel['fields'] = [
  { name: 'prompt', type: 'textarea', label: 'Промпт', required: true, placeholder: 'Опишите видео (макс. 1000 символов)...', maxLength: 1000 },
  { name: 'image', type: 'image-upload', label: 'Стартовый кадр', required: false },
  { name: 'endFrame', type: 'image-upload', label: 'Конечный кадр', required: false },
  { name: 'duration', type: 'duration', label: 'Длительность', required: true, options: [{ value: '5', label: '5 сек' }, { value: '10', label: '10 сек' }, { value: '15', label: '15 сек' }] },
  { name: 'aspectRatio', type: 'select', label: 'Соотношение сторон', required: true, options: [{ value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '1:1', label: '1:1' }] },
  { name: 'mode', type: 'select', label: 'Режим', required: true, options: [{ value: 'std', label: 'Standard (720p)' }, { value: 'pro', label: 'Pro (1080p)' }] },
  { name: 'sound', type: 'toggle', label: 'Звук', required: false },
];

// Hailuo 02 Pro: text-to-video + image-to-video (start + end frame!)
const hailuoFields: AIModel['fields'] = [
  { name: 'prompt', type: 'textarea', label: 'Промпт', required: true, placeholder: 'Опишите видео (макс. 1500 символов)...', maxLength: 1500 },
  { name: 'image', type: 'image-upload', label: 'Стартовый кадр', required: false },
  { name: 'endFrame', type: 'image-upload', label: 'Конечный кадр', required: false },
];

// Wan 2.6: text-to-video + image-to-video (start frame, no end frame)
const wanFields: AIModel['fields'] = [
  { name: 'prompt', type: 'textarea', label: 'Промпт', required: true, placeholder: 'Опишите видео (макс. 5000 символов)...', maxLength: 5000 },
  { name: 'image', type: 'image-upload', label: 'Стартовый кадр', required: false },
  { name: 'duration', type: 'duration', label: 'Длительность', required: true, options: [{ value: '5', label: '5 сек' }, { value: '10', label: '10 сек' }, { value: '15', label: '15 сек' }] },
  { name: 'resolution', type: 'select', label: 'Разрешение', required: false, options: [{ value: '720p', label: '720p' }, { value: '1080p', label: '1080p' }] },
];

// --- Image model fields (per-model, based on KIE API docs) ---

// NanoBanana: prompt + aspect ratio only
const nanoBananaFields: AIModel['fields'] = [
  { name: 'prompt', type: 'textarea', label: 'Промпт', required: true, placeholder: 'Опишите изображение...', maxLength: 5000 },
  { name: 'aspectRatio', type: 'select', label: 'Соотношение сторон', required: false, options: [{ value: '1:1', label: '1:1' }, { value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '4:3', label: '4:3' }, { value: '3:4', label: '3:4' }, { value: '3:2', label: '3:2' }, { value: '2:3', label: '2:3' }] },
];

// Grok Imagine: prompt + aspect ratio
const grokFields: AIModel['fields'] = [
  { name: 'prompt', type: 'textarea', label: 'Промпт', required: true, placeholder: 'Опишите изображение (English only)...', maxLength: 5000 },
  { name: 'aspectRatio', type: 'select', label: 'Соотношение сторон', required: false, options: [{ value: '1:1', label: '1:1' }, { value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '3:2', label: '3:2' }, { value: '2:3', label: '2:3' }] },
];

// Ideogram V3: prompt + style + negative prompt + aspect ratio + speed
const ideogramFields: AIModel['fields'] = [
  { name: 'prompt', type: 'textarea', label: 'Промпт', required: true, placeholder: 'Опишите изображение...', maxLength: 5000 },
  { name: 'negativePrompt', type: 'textarea', label: 'Негативный промпт', required: false, placeholder: 'Что исключить...', maxLength: 5000 },
  { name: 'style', type: 'select', label: 'Стиль', required: false, options: [{ value: 'AUTO', label: 'Авто' }, { value: 'GENERAL', label: 'Общий' }, { value: 'REALISTIC', label: 'Реализм' }, { value: 'DESIGN', label: 'Дизайн' }] },
  { name: 'aspectRatio', type: 'select', label: 'Соотношение сторон', required: false, options: [{ value: 'square', label: '1:1' }, { value: 'square_hd', label: '1:1 HD' }, { value: 'landscape_16_9', label: '16:9' }, { value: 'portrait_16_9', label: '9:16' }, { value: 'landscape_4_3', label: '4:3' }, { value: 'portrait_4_3', label: '3:4' }] },
  { name: 'rendering_speed', type: 'select', label: 'Скорость', required: false, options: [{ value: 'TURBO', label: 'Турбо' }, { value: 'BALANCED', label: 'Баланс' }, { value: 'QUALITY', label: 'Качество' }] },
];

// Imagen 4: prompt + negative prompt + aspect ratio
const imagen4Fields: AIModel['fields'] = [
  { name: 'prompt', type: 'textarea', label: 'Промпт', required: true, placeholder: 'Опишите изображение...', maxLength: 5000 },
  { name: 'negativePrompt', type: 'textarea', label: 'Негативный промпт', required: false, placeholder: 'Что исключить...', maxLength: 5000 },
  { name: 'aspectRatio', type: 'select', label: 'Соотношение сторон', required: false, options: [{ value: '1:1', label: '1:1' }, { value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '4:3', label: '4:3' }, { value: '3:4', label: '3:4' }] },
];

export const aiModels: AIModel[] = [
  // === VIDEO MODELS (через kie.ai) ===
  {
    id: 'kling-3.0',
    provider: 'Kling',
    name: 'Kling 3.0',
    description: 'Новейшая модель Kling. Pro-режим 1080p, start + end frame, до 15 секунд.',
    tasks: ['text-to-video', 'image-to-video'],
    category: 'video',
    thumbnail: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    tags: ['Текст → Видео', 'Фото → Видео', 'End Frame', 'Pro 1080p'],
    costPerRun: 15,
    fields: kling3Fields,
  },
  {
    id: 'kling-3',
    provider: 'Kling',
    name: 'Kling 2.6',
    description: 'Флагманская модель для генерации видео. Высокое качество, до 10 секунд.',
    tasks: ['text-to-video', 'image-to-video'],
    category: 'video',
    thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    tags: ['Текст → Видео', 'Фото → Видео'],
    costPerRun: 10,
    fields: klingFields,
  },
  {
    id: 'hailuo-02',
    provider: 'MiniMax',
    name: 'Hailuo 02 Pro',
    description: 'Единственная модель с поддержкой конечного кадра (end frame). Отличная детализация.',
    tasks: ['text-to-video', 'image-to-video'],
    category: 'video',
    thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    tags: ['Текст → Видео', 'Фото → Видео', 'End Frame'],
    costPerRun: 12,
    fields: hailuoFields,
  },
  {
    id: 'wan-2.6',
    provider: 'Wan',
    name: 'Wan 2.6',
    description: 'До 15 секунд видео, 1080p разрешение. Длинные промпты до 5000 символов.',
    tasks: ['text-to-video', 'image-to-video'],
    category: 'video',
    thumbnail: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    tags: ['Текст → Видео', 'Фото → Видео'],
    costPerRun: 8,
    fields: wanFields,
  },

  // === IMAGE MODELS (через kie.ai, все проверены) ===
  {
    id: 'nanobanana',
    provider: 'Google',
    name: 'Nano Banana',
    description: 'Быстрая и качественная генерация изображений от Google. Отлично для коммерческого контента.',
    tasks: ['text-to-image'],
    category: 'images',
    thumbnail: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    tags: ['Текст → Фото'],
    costPerRun: 3,
    fields: nanoBananaFields,
  },
  {
    id: 'nanobanana-2',
    provider: 'Google',
    name: 'Nano Banana 2',
    description: 'Gemini 3.1 Flash — быстрая генерация с 4K выходом, точный текст на картинках.',
    tasks: ['text-to-image'],
    category: 'images',
    thumbnail: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    tags: ['Текст → Фото'],
    costPerRun: 3,
    fields: nanoBananaFields,
  },
  {
    id: 'imagen4',
    provider: 'Google',
    name: 'Imagen 4',
    description: 'Фотореализм от Google. Поддержка негативного промпта.',
    tasks: ['text-to-image'],
    category: 'images',
    thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    tags: ['Текст → Фото'],
    costPerRun: 5,
    fields: imagen4Fields,
  },
  {
    id: 'grok-image',
    provider: 'xAI',
    name: 'Grok Imagine',
    description: 'Генерация изображений от xAI. Креативный и необычный стиль.',
    tasks: ['text-to-image'],
    category: 'images',
    thumbnail: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    tags: ['Текст → Фото'],
    costPerRun: 5,
    fields: grokFields,
  },
  {
    id: 'ideogram',
    provider: 'Ideogram',
    name: 'Ideogram V3',
    description: 'Лучшая модель для текста на изображениях. Стили, негативный промпт, скорость рендера.',
    tasks: ['text-to-image'],
    category: 'images',
    thumbnail: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    tags: ['Текст → Фото'],
    costPerRun: 5,
    fields: ideogramFields,
  },

  // === CREATIVE STUDIO (пока через kie.ai image models) ===
  {
    id: 'vibelab-avatar',
    provider: 'VibeLab',
    name: 'VibeLab Avatar',
    description: 'Создайте уникальный AI-аватар для соцсетей и брендинга.',
    tasks: ['avatar'],
    category: 'creative-studio',
    thumbnail: 'linear-gradient(135deg, #7F77DD 0%, #B066CC 100%)',
    tags: ['Аватары'],
    costPerRun: 8,
    fields: [
      { name: 'prompt', type: 'textarea', label: 'Описание аватара', required: true, placeholder: 'Опишите желаемый аватар...', maxLength: 1500 },
      { name: 'image', type: 'image-upload', label: 'Ваше фото (опционально)', required: false },
      { name: 'style', type: 'select', label: 'Стиль', required: true, options: [{ value: '3d', label: '3D' }, { value: 'cartoon', label: 'Мультяшный' }, { value: 'realistic', label: 'Реалистичный' }, { value: 'pixel', label: 'Пиксельный' }] },
    ],
  },
  {
    id: 'vibelab-mascot',
    provider: 'VibeLab',
    name: 'VibeLab Mascot',
    description: 'Генерация маскотов для брендов и проектов.',
    tasks: ['mascot'],
    category: 'creative-studio',
    thumbnail: 'linear-gradient(135deg, #B066CC 0%, #FF6B6B 100%)',
    tags: ['Маскоты'],
    costPerRun: 10,
    fields: [
      { name: 'prompt', type: 'textarea', label: 'Описание маскота', required: true, placeholder: 'Опишите маскота для вашего бренда...', maxLength: 1500 },
      { name: 'image', type: 'image-upload', label: 'Референс', required: false },
      { name: 'style', type: 'select', label: 'Стиль', required: true, options: [{ value: 'flat', label: 'Flat дизайн' }, { value: '3d', label: '3D' }, { value: 'hand-drawn', label: 'Рисованный' }] },
    ],
  },
  {
    id: 'vibelab-carousel',
    provider: 'VibeLab',
    name: 'VibeLab Carousel',
    description: 'Автоматическое создание каруселей для Instagram и Telegram.',
    tasks: ['carousel'],
    category: 'carousels',
    thumbnail: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
    tags: ['Карусель'],
    costPerRun: 7,
    fields: [
      { name: 'prompt', type: 'textarea', label: 'Тема карусели', required: true, placeholder: 'О чём будет карусель? Укажите основные тезисы...', maxLength: 3000 },
      { name: 'slides', type: 'select', label: 'Количество слайдов', required: true, options: [{ value: '5', label: '5 слайдов' }, { value: '7', label: '7 слайдов' }, { value: '10', label: '10 слайдов' }] },
      { name: 'brandColor', type: 'select', label: 'Цветовая схема', required: false, options: [{ value: 'purple', label: 'Фиолетовый' }, { value: 'blue', label: 'Синий' }, { value: 'green', label: 'Зелёный' }, { value: 'orange', label: 'Оранжевый' }] },
    ],
  },
];

export const featuredModels: AIModel[] = [
  aiModels[0], // Kling 3.0
  aiModels[1], // Kling 2.6
  aiModels[2], // Hailuo 02 Pro
];

export const defaultVideoModel: AIModel = aiModels[0]; // Kling 3.0
export const defaultImageModel: AIModel = aiModels[4]; // Nano Banana

export const contentTabModels = (tab: ContentTab): AIModel[] =>
  aiModels.filter((m) => m.category === tab);
