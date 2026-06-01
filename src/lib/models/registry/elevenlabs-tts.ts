import type { ModelDefinition, ParameterDef, SelectOption } from "../types";

const voicePresets: SelectOption[] = [
  { value: "rachel", label: "Rachel", description: "Тёплый женский" },
  { value: "adam", label: "Adam", description: "Глубокий мужской" },
  { value: "bella", label: "Bella", description: "Мягкий женский" },
  { value: "antoni", label: "Antoni", description: "Дружелюбный мужской" },
  { value: "elli", label: "Elli", description: "Молодой женский" },
  { value: "josh", label: "Josh", description: "Уверенный мужской" },
  { value: "arnold", label: "Arnold", description: "Хриплый мужской" },
  { value: "sam", label: "Sam", description: "Нейтральный мужской" },
];

const parameters: ParameterDef[] = [
  {
    key: "text",
    label: "Текст",
    description: "Что озвучить",
    type: "longtext",
    required: true,
    maxLength: 5000,
    visibility: "basic",
  },
  {
    key: "voiceId",
    label: "Голос",
    type: "voicePicker",
    required: true,
    defaultValue: "rachel",
    visibility: "basic",
    options: voicePresets,
  },
  {
    key: "model",
    label: "Модель",
    type: "mode",
    required: true,
    defaultValue: "turbo-2-5",
    visibility: "basic",
    options: [
      { value: "turbo-2-5", label: "Turbo 2.5", description: "Быстро", default: true },
      { value: "multilingual-v2", label: "Multilingual v2", badge: "29 языков" },
    ],
  },
  {
    key: "stability",
    label: "Стабильность",
    type: "slider",
    required: false,
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.5,
    visibility: "advanced",
  },
  {
    key: "similarityBoost",
    label: "Similarity Boost",
    type: "slider",
    required: false,
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.75,
    visibility: "advanced",
  },
  {
    key: "style",
    label: "Стиль",
    type: "slider",
    required: false,
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0,
    visibility: "advanced",
  },
  {
    key: "useSpeakerBoost",
    label: "Speaker Boost",
    type: "switch",
    required: false,
    defaultValue: true,
    visibility: "advanced",
  },
  {
    key: "outputFormat",
    label: "Формат аудио",
    type: "select",
    required: false,
    defaultValue: "mp3_44100_128",
    visibility: "advanced",
    options: [
      { value: "mp3_44100_128", label: "MP3 44.1k / 128 kbps", default: true },
      { value: "mp3_44100_192", label: "MP3 44.1k / 192 kbps" },
      { value: "pcm_16000", label: "PCM 16 kHz" },
      { value: "pcm_44100", label: "PCM 44.1 kHz" },
    ],
  },
];

export const elevenlabsTts: ModelDefinition = {
  id: "elevenlabs-tts",
  slug: "elevenlabs-tts",
  name: "ElevenLabs TTS",
  provider: "elevenlabs",
  category: "audio",
  description:
    "ElevenLabs — реалистичный синтез речи с пресетом голосов. Turbo 2.5 для скорости, Multilingual v2 для поддержки 29 языков.",
  thumbnail: "/models/elevenlabs-tts.jpg",
  badges: ["NEW", "AUDIO"],
  priority: 1,
  modes: [
    {
      id: "tts",
      label: "Текст в речь",
      description: "Озвучить текст выбранным голосом",
      parameters,
    },
  ],
  pricing: {
    base: 2,
    modifiers: [
      {
        paramKey: "model",
        table: { "turbo-2-5": 1.0, "multilingual-v2": 2.0 },
      },
    ],
  },
  endpoint: {
    provider: "direct",
    path: "/api/v1/elevenlabs/tts",
  },
  outputs: { type: "audio", multiple: false },
};
