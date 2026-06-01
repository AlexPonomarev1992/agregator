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
    key: "quality",
    label: "Качество",
    type: "mode",
    required: true,
    defaultValue: "auto",
    visibility: "basic",
    options: [
      { value: "low", label: "Low", description: "Дешевле" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High", description: "Лучшее качество", badge: "HQ" },
      { value: "auto", label: "Auto", default: true },
    ],
  },
  {
    key: "size",
    label: "Размер",
    type: "select",
    required: true,
    defaultValue: "1024x1024",
    visibility: "basic",
    options: [
      { value: "1024x1024", label: "1024×1024", default: true },
      { value: "1792x1024", label: "1792×1024" },
      { value: "1024x1792", label: "1024×1792" },
      { value: "auto", label: "Auto" },
    ],
  },
  {
    key: "outputFormat",
    label: "Формат",
    type: "select",
    required: true,
    defaultValue: "png",
    visibility: "basic",
    options: [
      { value: "png", label: "PNG", default: true },
      { value: "jpeg", label: "JPEG" },
      { value: "webp", label: "WebP" },
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
  {
    key: "outputCompression",
    label: "Компрессия",
    description: "Уровень сжатия для jpeg/webp",
    type: "slider",
    required: false,
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 80,
    visibility: "advanced",
  },
];

export const gptImage15: ModelDefinition = {
  id: "gpt-image-15",
  slug: "gpt-image-15",
  name: "GPT Image 1.5",
  provider: "openai",
  category: "image",
  description:
    "GPT Image 1.5 — экономичная версия модели OpenAI для повседневной генерации и редактирования.",
  thumbnail: "/models/gpt-image-15.png",
  badges: ["CHEAP"],
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
      description: "Редактирование или стилизация исходного кадра",
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
        paramKey: "quality",
        table: { low: 0.5, medium: 1.0, high: 1.8, auto: 1.0 },
      },
      {
        paramKey: "n",
        table: { "1": 1.0, "2": 2.0, "4": 4.0 },
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/images/gpt-image/1-5-text-to-image",
  },
  outputs: { type: "image", multiple: true },
};
