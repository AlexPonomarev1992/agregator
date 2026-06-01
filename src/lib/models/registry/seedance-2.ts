import type { ModelDefinition, ParameterDef } from "../types";

const commonParameters: ParameterDef[] = [
  {
    key: "prompt",
    label: "Промпт",
    type: "longtext",
    required: true,
    maxLength: 2000,
    visibility: "basic",
  },
  {
    key: "model",
    label: "Версия",
    type: "mode",
    required: true,
    defaultValue: "seedance-2-0",
    visibility: "basic",
    options: [
      { value: "seedance-2-0", label: "Seedance 2.0", description: "Полное качество", default: true },
      { value: "seedance-2-0-fast", label: "Fast", description: "Быстрее и дешевле" },
    ],
  },
  {
    key: "duration",
    label: "Длительность",
    type: "duration",
    required: true,
    defaultValue: "5",
    visibility: "basic",
    options: [
      { value: "4", label: "4 сек" },
      { value: "5", label: "5 сек", default: true },
      { value: "10", label: "10 сек" },
    ],
  },
  {
    key: "aspectRatio",
    label: "Соотношение сторон",
    type: "aspectRatio",
    required: true,
    defaultValue: "16:9",
    visibility: "basic",
    options: [
      { value: "16:9", label: "16:9", default: true },
      { value: "9:16", label: "9:16" },
      { value: "1:1", label: "1:1" },
      { value: "4:3", label: "4:3" },
      { value: "3:4", label: "3:4" },
    ],
  },
  {
    key: "resolution",
    label: "Разрешение",
    type: "resolution",
    required: true,
    defaultValue: "720p",
    visibility: "basic",
    options: [
      { value: "480p", label: "480p" },
      { value: "720p", label: "720p", default: true },
      { value: "1080p", label: "1080p", badge: "HD" },
      { value: "2K", label: "2K", badge: "2K" },
    ],
  },
  {
    key: "generateAudio",
    label: "Звук",
    type: "switch",
    required: false,
    defaultValue: false,
    visibility: "basic",
  },
];

export const seedance2: ModelDefinition = {
  id: "seedance-2",
  slug: "seedance-2",
  name: "Seedance 2.0",
  provider: "bytedance",
  category: "video",
  description:
    "ByteDance Seedance 2.0 — динамичные видео с возможностью выбора разрешения до 2K. Версия Fast — ускоренный режим для черновиков.",
  thumbnail: "/models/seedance-2.jpg",
  badges: ["NEW", "HOT"],
  priority: 1,
  modes: [
    {
      id: "t2v",
      label: "Текст в видео",
      description: "Видео из текстового описания",
      parameters: commonParameters,
    },
    {
      id: "i2v",
      label: "Изображение в видео",
      description: "Анимация исходного кадра с опциональным финальным кадром",
      parameters: [
        {
          key: "imageUrl",
          label: "Исходное изображение",
          type: "imageUpload",
          required: true,
          accept: ["image/jpeg", "image/png", "image/webp"],
          maxSizeMB: 10,
          visibility: "basic",
        },
        {
          key: "lastImageUrl",
          label: "Финальный кадр",
          description: "Опционально — кадр, к которому стремится видео",
          type: "imageUpload",
          required: false,
          accept: ["image/jpeg", "image/png", "image/webp"],
          maxSizeMB: 10,
          visibility: "advanced",
        },
        ...commonParameters,
      ],
    },
  ],
  pricing: {
    base: 10,
    modifiers: [
      {
        paramKey: "resolution",
        table: { "480p": 0.7, "720p": 1.0, "1080p": 1.4, "2K": 2.0 },
      },
      {
        paramKey: "duration",
        table: { "4": 0.8, "5": 1.0, "10": 2.0 },
      },
      {
        paramKey: "model",
        table: { "seedance-2-0": 1.0, "seedance-2-0-fast": 0.6 },
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/bytedance/seedance/generate",
  },
  outputs: { type: "video", multiple: false },
};
