import type { ModelDefinition, ParameterDef } from "../types";

const commonParameters: ParameterDef[] = [
  {
    key: "prompt",
    label: "Промпт",
    description: "Опишите, что должно происходить в видео",
    type: "longtext",
    required: true,
    maxLength: 2000,
    visibility: "basic",
  },
  {
    key: "tier",
    label: "Качество",
    type: "mode",
    required: true,
    defaultValue: "standard",
    visibility: "basic",
    options: [
      { value: "standard", label: "Standard", description: "Базовое качество", default: true },
      { value: "pro", label: "Pro", description: "Высокое качество", badge: "HQ" },
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
    ],
  },
  {
    key: "enableAudio",
    label: "Звук",
    description: "Сгенерировать аудиодорожку (только в Pro)",
    type: "switch",
    required: false,
    defaultValue: false,
    visibility: "basic",
    dependsOn: { key: "tier", equals: "pro" },
  },
];

export const hailuo23: ModelDefinition = {
  id: "hailuo-23",
  slug: "hailuo-23",
  name: "Hailuo 2.3",
  provider: "kie",
  category: "video",
  description:
    "Hailuo 2.3 — видеомодель MiniMax. Длительность 6 секунд. Standard для черновиков, Pro для финального качества с аудио.",
  thumbnail: "/models/hailuo-23.jpg",
  badges: ["NEW"],
  priority: 2,
  modes: [
    {
      id: "t2v",
      label: "Текст в видео",
      description: "Видео из текстового описания (6 секунд)",
      parameters: commonParameters,
    },
    {
      id: "i2v",
      label: "Изображение в видео",
      description: "Анимация исходного кадра (6 секунд)",
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
        ...commonParameters,
      ],
    },
  ],
  pricing: {
    base: 8,
    modifiers: [
      {
        paramKey: "tier",
        table: { standard: 1.0, pro: 1.75 },
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/hailuo/2-3-text-to-video",
  },
  outputs: { type: "video", multiple: false },
};
