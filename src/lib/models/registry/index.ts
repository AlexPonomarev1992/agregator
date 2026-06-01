import type { ModelCategory, ModelDefinition } from "../types";
import { kling3 } from "./kling-3";
import { veo31 } from "./veo-31";
import { nanoBanana2 } from "./nano-banana-2";
import { flux2Pro } from "./flux-2-pro";
import { sunoV5 } from "./suno-v5";
import { elevenlabsTts } from "./elevenlabs-tts";
import { seedance2 } from "./seedance-2";
import { kling26 } from "./kling-26";
import { hailuo23 } from "./hailuo-23";
import { wan27 } from "./wan-27";
import { happyhorse10 } from "./happyhorse-10";
import { ideogramV3 } from "./ideogram-v3";
import { gptImage2 } from "./gpt-image-2";
import { gptImage15 } from "./gpt-image-15";
import { grokImagine } from "./grok-imagine";

export const MODELS: Record<string, ModelDefinition> = {
  "kling-3": kling3,
  "veo-31": veo31,
  "nano-banana-2": nanoBanana2,
  "flux-2-pro": flux2Pro,
  "suno-v5": sunoV5,
  "elevenlabs-tts": elevenlabsTts,
  "seedance-2": seedance2,
  "kling-26": kling26,
  "hailuo-23": hailuo23,
  "wan-27": wan27,
  "happyhorse-10": happyhorse10,
  "ideogram-v3": ideogramV3,
  "gpt-image-2": gptImage2,
  "gpt-image-15": gptImage15,
  "grok-imagine": grokImagine,
};

export function getModel(slug: string): ModelDefinition | undefined {
  return MODELS[slug];
}

export function getAllModels(): ModelDefinition[] {
  return Object.values(MODELS);
}

export function getModelsByCategory(category: ModelCategory): ModelDefinition[] {
  return getAllModels().filter((m) => m.category === category);
}

export function getModelsByPriority(maxPriority: 1 | 2 | 3): ModelDefinition[] {
  return getAllModels().filter((m) => m.priority <= maxPriority);
}
