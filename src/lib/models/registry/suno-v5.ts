import type { ModelDefinition, ParameterDef, SelectOption } from "../types";

const genrePresets: SelectOption[] = [
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "hip-hop", label: "Hip-Hop" },
  { value: "electronic", label: "Electronic" },
  { value: "jazz", label: "Jazz" },
  { value: "classical", label: "Classical" },
  { value: "folk", label: "Folk" },
  { value: "ambient", label: "Ambient" },
];

const generateParameters: ParameterDef[] = [
  {
    key: "prompt",
    label: "Описание трека",
    description: "Стиль, настроение, инструменты",
    type: "longtext",
    required: true,
    maxLength: 2000,
    visibility: "basic",
  },
  {
    key: "tags",
    label: "Жанры / теги",
    type: "tagInput",
    required: false,
    visibility: "basic",
    options: genrePresets,
  },
  {
    key: "instrumental",
    label: "Только инструментал",
    type: "switch",
    required: false,
    defaultValue: false,
    visibility: "basic",
  },
  {
    key: "title",
    label: "Название",
    type: "text",
    required: false,
    maxLength: 100,
    visibility: "advanced",
  },
  {
    key: "makePublic",
    label: "Публичный трек",
    type: "switch",
    required: false,
    defaultValue: false,
    visibility: "advanced",
  },
];

const extendParameters: ParameterDef[] = [
  {
    key: "audioId",
    label: "ID исходного трека",
    type: "text",
    required: true,
    maxLength: 100,
    visibility: "basic",
  },
  {
    key: "prompt",
    label: "Описание продолжения",
    type: "longtext",
    required: true,
    maxLength: 2000,
    visibility: "basic",
  },
  {
    key: "continueAt",
    label: "Продолжить с секунды",
    type: "slider",
    required: true,
    min: 0,
    max: 300,
    step: 1,
    defaultValue: 60,
    visibility: "basic",
  },
];

const lyricsParameters: ParameterDef[] = [
  {
    key: "prompt",
    label: "О чём песня",
    type: "longtext",
    required: true,
    maxLength: 2000,
    visibility: "basic",
  },
];

export const sunoV5: ModelDefinition = {
  id: "suno-v5",
  slug: "suno-v5",
  name: "Suno V5",
  provider: "suno",
  category: "music",
  description:
    "Suno V5 — генерация полноценных треков по описанию: вокал, инструментал, продолжение существующих композиций и написание текстов.",
  thumbnail: "/models/suno-v5.jpg",
  badges: ["POPULAR", "AUDIO"],
  priority: 1,
  modes: [
    {
      id: "generate",
      label: "Новый трек",
      description: "Сгенерировать трек с нуля",
      parameters: generateParameters,
    },
    {
      id: "extend",
      label: "Продлить трек",
      description: "Расширить существующий трек",
      parameters: extendParameters,
    },
    {
      id: "lyrics",
      label: "Только текст",
      description: "Написать текст песни без музыки",
      parameters: lyricsParameters,
    },
  ],
  pricing: {
    base: 8,
    modifiers: [
      // mode-based price override: lyrics resets effectively to 1
      // We expose this as a separate "mode" key the caller passes in.
      {
        paramKey: "mode",
        table: { generate: 1.0, extend: 1.0, lyrics: 0.125 }, // 8 * 0.125 = 1
      },
    ],
  },
  endpoint: {
    provider: "kie",
    path: "/api/v1/suno/generate",
  },
  outputs: { type: "audio", multiple: true },
};
