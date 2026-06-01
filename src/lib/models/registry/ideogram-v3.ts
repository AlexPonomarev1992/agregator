import type { ModelDefinition, ParameterDef } from "../types";

const parameters: ParameterDef[] = [
  {
    key: "prompt",
    label: "Промпт",
    description: "Опишите изображение. Ideogram отлично рендерит текст и логотипы.",
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
      { value: "3:4", label: "3:4" },
      { value: "10:16", label: "10:16" },
      { value: "16:10", label: "16:10" },
    ],
  },
  {
    key: "renderingQuality",
    label: "Качество рендера",
    type: "mode",
    required: true,
    defaultValue: "DEFAULT",
    visibility: "basic",
    options: [
      { value: "TURBO", label: "Turbo", description: "Быстрее и дешевле" },
      { value: "DEFAULT", label: "Default", description: "Баланс", default: true },
      { value: "QUALITY", label: "Quality", description: "Лучшее качество", badge: "HQ" },
    ],
  },
  {
    key: "styleType",
    label: "Стиль",
    type: "select",
    required: true,
    defaultValue: "AUTO",
    visibility: "basic",
    options: [
      { value: "AUTO", label: "Auto", default: true },
      { value: "GENERAL", label: "General" },
      { value: "REALISTIC", label: "Realistic" },
      { value: "DESIGN", label: "Design" },
      { value: "ANIME", label: "Anime" },
      { value: "3D_RENDER", label: "3D Render" },
    ],
  },
  {
    key: "numImages",
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
    key: "colorPalette",
    label: "Цветовая палитра",
    description: "Опциональная цветовая схема",
    type: "colorPalette",
    required: false,
    visibility: "advanced",
    options: [
      { value: "AUTUMN", label: "Autumn", description: "#a16207, #fef3c7, #fcd34d" },
      { value: "CANDY", label: "Candy", description: "#fb7185, #fbcfe8, #f0abfc" },
      { value: "COOL", label: "Cool", description: "#0ea5e9, #6366f1, #14b8a6" },
      { value: "DARK", label: "Dark", description: "#0f172a, #334155, #64748b" },
      { value: "EARTH", label: "Earth", description: "#78350f, #a3a380, #d4a373" },
      { value: "NEON", label: "Neon", description: "#22d3ee, #a3e635, #f472b6" },
      { value: "PASTEL", label: "Pastel", description: "#fecaca, #fef3c7, #ddd6fe" },
      { value: "VIBRANT", label: "Vibrant", description: "#ef4444, #f59e0b, #8b5cf6" },
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

export const ideogramV3: ModelDefinition = {
  id: "ideogram-v3",
  slug: "ideogram-v3",
  name: "Ideogram V3",
  provider: "ideogram",
  category: "image",
  description:
    "Ideogram V3 — лучший движок для текста на изображениях: вывески, постеры, логотипы.",
  thumbnail: "/models/ideogram-v3.webp",
  badges: ["POPULAR"],
  priority: 2,
  modes: [
    {
      id: "t2i",
      label: "Текст в изображение",
      description: "Изображение из текста с акцентом на типографику",
      parameters,
    },
  ],
  pricing: {
    base: 5,
    modifiers: [
      {
        paramKey: "renderingQuality",
        table: { TURBO: 0.6, DEFAULT: 1.0, QUALITY: 1.6 },
      },
      {
        paramKey: "numImages",
        table: { "1": 1.0, "2": 2.0, "4": 4.0 },
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/images/ideogram/v3-text-to-image",
  },
  outputs: { type: "image", multiple: true },
};
