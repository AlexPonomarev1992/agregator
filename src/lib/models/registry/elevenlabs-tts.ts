import type { ModelDefinition, ParameterDef, SelectOption } from "../types";

// Real KIE ElevenLabs voice IDs — preview via:
// https://static.aiquickdraw.com/elevenlabs/voice/<id>.mp3
export const TTS_VOICES: Array<{ id: string; name: string; description: string; gender: 'male' | 'female' | 'character' }> = [
  // Male
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian",    description: "Глубокий, успокаивающий",   gender: "male" },
  { id: "EkK5I93UQWFDigLMpZcX", name: "James",    description: "Хриплый, харизматичный",    gender: "male" },
  { id: "gs0tAILXbY5DNrJrsM6F", name: "Jeff",     description: "Классический, уверенный",  gender: "male" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam",     description: "Энергичный, молодой",       gender: "male" },
  { id: "1SM7GgM6IMuvQlz2BwM3", name: "Mark",     description: "Разговорный, расслабленный",gender: "male" },
  { id: "LruHrtVF6PSyGItzMNHS", name: "Benjamin", description: "Тёплый, успокаивающий",    gender: "male" },
  { id: "DYkrAHD8iwork3YSUBbs", name: "Tom",      description: "Подкасты и книги",          gender: "male" },
  // Female
  { id: "hpp4J3VqNfWAUOO0d1Us", name: "Bella",    description: "Профессиональный, тёплый",  gender: "female" },
  { id: "5l5f8iK3YPeGga21rQIX", name: "Adeline",  description: "Женственный, разговорный",  gender: "female" },
  { id: "BZgkqPqms7Kj9ulSkVzn", name: "Eve",      description: "Живой, энергичный",         gender: "female" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura",    description: "Яркий, с характером",       gender: "female" },
  { id: "wJqPPQ618aTW29mptyoc", name: "Ana Rita", description: "Мягкий, выразительный",    gender: "female" },
  { id: "lcMyyd2HUfFzxdCaC4Ta", name: "Lucy",     description: "Свежий, неформальный",      gender: "female" },
  { id: "Sm1seazb4gs7RSlUVw7c", name: "Anika",    description: "Дружелюбный, анимированный",gender: "female" },
  { id: "1wGbFxmAM3Fgw63G1zZJ", name: "Allison",  description: "Спокойный, медитативный",   gender: "female" },
  // Characters
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum",   description: "Трикстер, хриплый",         gender: "character" },
  { id: "scOwDtmlUjD3prqpp97I", name: "Sam",      description: "Нейтральный агент",          gender: "character" },
  { id: "NNl6r8mD7vthiJatiJt1", name: "Bradford", description: "Выразительный, чёткий",     gender: "character" },
];

export const TTS_VOICE_PREVIEW_URL = (id: string) =>
  `https://static.aiquickdraw.com/elevenlabs/voice/${id}.mp3`;

const voicePresets: SelectOption[] = TTS_VOICES.map((v) => ({
  value: v.id,
  label: v.name,
  description: v.description,
}));

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
    defaultValue: "nPczCjzI2devNBz1zQrb",
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
