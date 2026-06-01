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
    key: "aspectRatio",
    label: "Соотношение сторон",
    type: "aspectRatio",
    required: true,
    defaultValue: "1:1",
    visibility: "basic",
    options: [
      { value: "1:1", label: "1:1", default: true },
      { value: "16:9", label: "16:9" },
      { value: "9:16", label: "9:16" },
      { value: "4:3", label: "4:3" },
    ],
  },
  {
    key: "style",
    label: "Стиль",
    type: "styleSelect",
    required: true,
    defaultValue: "photographic",
    visibility: "basic",
    options: [
      { value: "photographic", label: "Photographic", default: true },
      { value: "digital-art", label: "Digital Art" },
      { value: "anime", label: "Anime" },
      { value: "illustration", label: "Illustration" },
    ],
  },
  {
    key: "n",
    label: "Количество",
    type: "numberOfImages",
    required: true,
    defaultValue: "1",
    visibility: "basic",
    options: [
      { value: "1", label: "1", default: true },
      { value: "2", label: "2" },
      { value: "4", label: "4" },
    ],
  },
];

export const grokImagine: ModelDefinition = {
  id: "grok-imagine",
  slug: "grok-imagine",
  name: "Grok Imagine",
  provider: "kie",
  category: "image",
  description:
    "Grok Imagine — стильная альтернатива от xAI с фокусом на фотореалистике и иллюстрациях.",
  thumbnail: "/models/grok-imagine.webp",
  badges: ["NEW"],
  priority: 3,
  modes: [
    {
      id: "t2i",
      label: "Текст в изображение",
      description: "Изображение из текста",
      parameters: commonParameters,
    },
    {
      id: "i2i",
      label: "Изображение в изображение",
      description: "Стилизация исходного кадра",
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
    base: 5,
    modifiers: [
      {
        paramKey: "n",
        table: { "1": 1.0, "2": 2.0, "4": 4.0 },
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/images/grok/imagine",
  },
  outputs: { type: "image", multiple: true },
};
