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
    key: "mode",
    label: "Режим",
    type: "mode",
    required: true,
    defaultValue: "std",
    visibility: "basic",
    options: [
      { value: "std", label: "Standard", default: true },
      { value: "pro", label: "Pro", badge: "HQ" },
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
    key: "negativePrompt",
    label: "Негативный промпт",
    type: "longtext",
    required: false,
    maxLength: 2000,
    visibility: "advanced",
  },
  {
    key: "cfgScale",
    label: "CFG Scale",
    description: "Сила следования промпту",
    type: "slider",
    required: false,
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.5,
    visibility: "advanced",
  },
];

export const kling26: ModelDefinition = {
  id: "kling-26",
  slug: "kling-26",
  name: "Kling 2.6",
  provider: "kling",
  category: "video",
  description:
    "Kling 2.6 — стабильная видеомодель, поддерживает финальный кадр (end frame) в режиме I2V.",
  thumbnail: "/models/kling-26.jpg",
  badges: [],
  priority: 2,
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
          key: "endImageUrl",
          label: "Финальный кадр",
          description: "Опционально — кадр, к которому стремится видео",
          type: "imageUpload",
          required: false,
          accept: ["image/jpeg", "image/png", "image/webp"],
          maxSizeMB: 10,
          visibility: "basic",
        },
        ...commonParameters,
      ],
    },
  ],
  pricing: {
    base: 10,
    modifiers: [
      {
        paramKey: "duration",
        table: { "5": 1.0, "10": 2.0 },
      },
      {
        paramKey: "mode",
        table: { std: 1.0, pro: 1.6 },
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/kling/v1/videos/text2video",
    kieModel: "kling-v2-6",
  },
  outputs: { type: "video", multiple: false },
};
