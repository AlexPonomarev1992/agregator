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
];

export const wan27: ModelDefinition = {
  id: "wan-27",
  slug: "wan-27",
  name: "Wan 2.7",
  provider: "kie",
  category: "video",
  description:
    "Wan 2.7 — экономичная open-source видеомодель Alibaba, поддерживает 1080p.",
  thumbnail: "/models/wan-27.jpg",
  badges: ["CHEAP"],
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
      description: "Анимация исходного кадра",
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
    base: 6,
    modifiers: [
      {
        paramKey: "resolution",
        table: { "480p": 0.7, "720p": 1.0, "1080p": 1.4 },
      },
      {
        paramKey: "duration",
        table: { "5": 1.0, "10": 2.0 },
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/wan/2-7-text-to-video",
    kieModel: "wan-2-7",
  },
  outputs: { type: "video", multiple: false },
};
