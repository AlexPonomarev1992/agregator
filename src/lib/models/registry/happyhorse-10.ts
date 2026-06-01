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
    ],
  },
  {
    key: "resolution",
    label: "Разрешение",
    type: "resolution",
    required: true,
    defaultValue: "1080p",
    visibility: "basic",
    options: [
      { value: "720p", label: "720p" },
      { value: "1080p", label: "1080p", badge: "HD", default: true },
      { value: "4K", label: "4K", badge: "4K" },
    ],
  },
];

export const happyhorse10: ModelDefinition = {
  id: "happyhorse-10",
  slug: "happyhorse-10",
  name: "HappyHorse 1.0",
  provider: "kie",
  category: "video",
  description:
    "HappyHorse 1.0 — новая видеомодель с поддержкой 4K и референсных изображений для I2V.",
  thumbnail: "/models/happyhorse-10.jpg",
  badges: ["NEW", "4K"],
  priority: 3,
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
      description: "Анимация исходного кадра с возможностью добавить референсы",
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
          key: "referenceUrls",
          label: "Референсы",
          description: "До 3 дополнительных изображений-референсов",
          type: "imageUpload",
          required: false,
          accept: ["image/jpeg", "image/png", "image/webp"],
          maxSizeMB: 10,
          multiple: true,
          max: 3,
          visibility: "advanced",
        },
        ...commonParameters,
      ],
    },
  ],
  pricing: {
    base: 12,
    modifiers: [
      {
        paramKey: "resolution",
        table: { "720p": 1.0, "1080p": 1.5, "4K": 2.5 },
      },
      {
        paramKey: "duration",
        table: { "5": 1.0, "10": 2.0 },
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/happyhorse/generate",
  },
  outputs: { type: "video", multiple: false },
};
