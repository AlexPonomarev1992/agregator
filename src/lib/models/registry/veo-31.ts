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
    label: "Качество",
    type: "mode",
    required: true,
    defaultValue: "veo3_fast",
    visibility: "basic",
    options: [
      { value: "veo3_fast", label: "Fast", description: "Быстро и дешевле", default: true },
      { value: "veo3_quality", label: "Quality", badge: "4K" },
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
    type: "switch",
    required: false,
    defaultValue: true,
    visibility: "basic",
  },
  {
    key: "enableTranslation",
    label: "Перевод промпта",
    description: "Автоматический перевод на английский",
    type: "switch",
    required: false,
    defaultValue: true,
    visibility: "advanced",
  },
  {
    key: "watermark",
    label: "Водяной знак",
    type: "text",
    required: false,
    maxLength: 50,
    visibility: "advanced",
  },
];

export const veo31: ModelDefinition = {
  id: "veo-31",
  slug: "veo-31",
  name: "Veo 3.1",
  provider: "google",
  category: "video",
  description:
    "Google Veo 3.1 — флагманская видеомодель с поддержкой аудио и режимом 4K. Доступны Fast и Quality варианты.",
  thumbnail: "/models/veo-31.webp",
  badges: ["NEW", "4K"],
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
      description: "Анимация исходного кадра",
      parameters: [
        {
          key: "imageUrl",
          label: "Исходное изображение",
          type: "imageUpload",
          required: true,
          accept: ["image/jpeg", "image/png"],
          maxSizeMB: 10,
          visibility: "basic",
        },
        ...commonParameters,
      ],
    },
    {
      id: "r2v",
      label: "Reference → Video",
      description: "Видео на основе референсов",
      parameters: [
        {
          key: "imageUrls",
          label: "Референс-изображения",
          description: "До 2 референсов",
          type: "imageUpload",
          required: true,
          multiple: true,
          accept: ["image/jpeg", "image/png"],
          maxSizeMB: 10,
          visibility: "basic",
        },
        ...commonParameters,
      ],
    },
  ],
  pricing: {
    base: 12,
    modifiers: [
      {
        paramKey: "model",
        table: { veo3_fast: 1.0, veo3_quality: 4.0 },
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/veo/generate",
  },
  outputs: { type: "video", multiple: false },
};
