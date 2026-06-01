import type { ModelDefinition, ParameterDef } from "../types";

const parameters: ParameterDef[] = [
  {
    key: "prompt",
    label: "Промпт",
    type: "longtext",
    required: true,
    maxLength: 2000,
    visibility: "basic",
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
    key: "aspectRatio",
    label: "Соотношение сторон",
    type: "aspectRatio",
    required: true,
    defaultValue: "1:1",
    visibility: "basic",
    options: [
      { value: "1:1", label: "1:1", default: true },
      { value: "9:16", label: "9:16" },
      { value: "16:9", label: "16:9" },
      { value: "3:4", label: "3:4" },
      { value: "4:3", label: "4:3" },
      { value: "2:3", label: "2:3" },
      { value: "3:2", label: "3:2" },
    ],
  },
  {
    key: "outputResolution",
    label: "Разрешение",
    type: "resolution",
    required: true,
    defaultValue: "1K",
    visibility: "basic",
    options: [
      { value: "1K", label: "1K", default: true },
      { value: "2K", label: "2K", badge: "2K" },
      { value: "4K", label: "4K", badge: "4K" },
    ],
  },
  {
    key: "numberOfImages",
    label: "Количество",
    type: "numberOfImages",
    required: true,
    defaultValue: 1,
    visibility: "basic",
    options: [
      { value: "1", label: "1", default: true },
      { value: "2", label: "2" },
      { value: "4", label: "4" },
    ],
  },
  {
    key: "outputFormat",
    label: "Формат",
    type: "select",
    required: false,
    defaultValue: "JPEG",
    visibility: "advanced",
    options: [
      { value: "JPEG", label: "JPEG", default: true },
      { value: "PNG", label: "PNG" },
    ],
  },
  {
    key: "personGeneration",
    label: "Генерация людей",
    description: "Разрешить изображения людей",
    type: "switch",
    required: false,
    defaultValue: true,
    visibility: "advanced",
  },
];

export const nanoBanana2: ModelDefinition = {
  id: "nano-banana-2",
  slug: "nano-banana-2",
  name: "NanoBanana 2 (Imagen)",
  provider: "google",
  category: "image",
  description:
    "Google Imagen через NanoBanana 2 — фотореалистичные изображения с поддержкой 4K и батчевой генерации.",
  thumbnail: "/models/nano-banana-2.png",
  badges: ["POPULAR", "4K"],
  priority: 1,
  modes: [
    {
      id: "t2i",
      label: "Текст в изображение",
      description: "Изображение из текста",
      parameters,
    },
  ],
  pricing: {
    base: 4,
    modifiers: [
      {
        paramKey: "outputResolution",
        table: { "1K": 1.0, "2K": 1.5, "4K": 2.25 },
      },
      {
        paramKey: "numberOfImages",
        table: { "1": 1.0, "2": 2.0, "4": 4.0 },
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/images/google/nanobanana2",
  },
  outputs: { type: "image", multiple: true },
};
