import type { ModelDefinition, ParameterDef } from "../types";

// Параметры строго по спецификации KIE: POST /api/v1/jobs/createTask,
// model="nano-banana-2", input={ prompt, image_input, aspect_ratio, resolution, output_format }.
const parameters: ParameterDef[] = [
  {
    key: "prompt",
    label: "Промпт",
    type: "longtext",
    required: true,
    maxLength: 20000,
    visibility: "basic",
  },
  {
    key: "imageInput",
    label: "Референсные изображения",
    description: "До 14 изображений (jpeg/png/webp, до 30 МБ)",
    type: "imageUpload",
    required: false,
    multiple: true,
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 30,
    visibility: "advanced",
  },
  {
    key: "aspectRatio",
    label: "Соотношение сторон",
    type: "aspectRatio",
    required: true,
    defaultValue: "auto",
    visibility: "basic",
    options: [
      { value: "auto", label: "Auto", default: true },
      { value: "1:1", label: "1:1" },
      { value: "2:3", label: "2:3" },
      { value: "3:2", label: "3:2" },
      { value: "3:4", label: "3:4" },
      { value: "4:3", label: "4:3" },
      { value: "4:5", label: "4:5" },
      { value: "5:4", label: "5:4" },
      { value: "9:16", label: "9:16" },
      { value: "16:9", label: "16:9" },
      { value: "21:9", label: "21:9" },
      { value: "1:4", label: "1:4" },
      { value: "4:1", label: "4:1" },
      { value: "1:8", label: "1:8" },
      { value: "8:1", label: "8:1" },
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
    key: "outputFormat",
    label: "Формат",
    type: "select",
    required: false,
    defaultValue: "jpg",
    visibility: "advanced",
    options: [
      { value: "jpg", label: "JPG", default: true },
      { value: "png", label: "PNG" },
    ],
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
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/jobs/createTask",
  },
  outputs: { type: "image", multiple: false },
};
