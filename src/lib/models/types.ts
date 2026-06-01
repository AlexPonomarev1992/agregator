/**
 * ModelDefinition types — single source of truth for UI form generation
 * and backend validation across all generation models.
 */

export type ModelCategory = "video" | "image" | "audio" | "music" | "utility";

export type ModelProvider =
  | "kie"
  | "elevenlabs"
  | "suno"
  | "google"
  | "openai"
  | "bytedance"
  | "kling"
  | "flux"
  | "ideogram";

export type ParameterType =
  | "longtext" // textarea for prompts
  | "text" // short text input
  | "select" // dropdown
  | "mode" // radio / pill buttons (std / pro)
  | "slider"
  | "switch"
  | "imageUpload"
  | "audioUpload"
  | "videoUpload"
  | "aspectRatio" // visual aspect ratio icons
  | "duration" // pill buttons with price label
  | "resolution" // pill buttons with quality badge
  | "numberOfImages"
  | "colorPalette" // Ideogram color palette
  | "voicePicker" // ElevenLabs voice selector
  | "tagInput" // Suno tags / genres
  | "dialogueList" // ElevenLabs Dialogue speakers + lines
  | "maskUpload" // Edit / inpaint
  | "number" // numeric field (e.g. seed)
  | "styleSelect";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string; // HD / 4K / 2K etc.
  costModifier?: number; // relative cost multiplier
  default?: boolean;
}

export type FieldVisibility = "basic" | "advanced";

export interface ParameterDependency {
  key: string;
  equals?: unknown;
  notEquals?: unknown;
}

export interface ParameterDef {
  key: string;
  label: string;
  description?: string;
  type: ParameterType;
  required: boolean;
  defaultValue?: unknown;
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  accept?: string[]; // accepted MIME types for uploads
  maxSizeMB?: number;
  multiple?: boolean;
  visibility: FieldVisibility;
  dependsOn?: ParameterDependency;
}

export interface ModeDefinition {
  id: string; // t2v, i2v, motion, edit, remix, ...
  label: string;
  description: string;
  parameters: ParameterDef[];
}

export interface PricingModifier {
  paramKey: string;
  /** Map of parameter value (string) -> multiplier applied to base price. */
  table: Record<string, number>;
}

export interface PricingRule {
  base: number;
  modifiers?: PricingModifier[];
}

export type ModelBadge =
  | "NEW"
  | "POPULAR"
  | "CHEAP"
  | "4K"
  | "AUDIO"
  | "BETA"
  | "HOT";

export interface ModelEndpoint {
  provider: "kie" | "direct";
  path: string;
  kieModel?: string;
}

export interface ModelOutputs {
  type: "video" | "image" | "audio";
  multiple: boolean;
}

export interface ModelDefinition {
  id: string;
  slug: string;
  name: string;
  provider: ModelProvider;
  category: ModelCategory;
  description: string;
  thumbnail?: string;
  badges: ModelBadge[];
  priority: 1 | 2 | 3;
  modes: ModeDefinition[];
  pricing: PricingRule;
  endpoint: ModelEndpoint;
  outputs: ModelOutputs;
  docsUrl?: string;
}
