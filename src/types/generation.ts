export type GenerationType = 'video' | 'photo' | 'avatar' | 'mascot';

export type GenerationStatus = 'pending' | 'processing' | 'done' | 'failed';

export type GenerationProvider = 'kie' | 'kling' | 'nanobanana';

export interface Generation {
  id: string;
  user_id: string;
  type: GenerationType;
  status: GenerationStatus;
  prompt: string;
  result_url: string | null;
  credits_spent: number;
  provider: GenerationProvider;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// --- Wave 1: Content marketplace types ---

export type ContentTab = 'home' | 'images' | 'video' | 'carousels' | 'creative-studio';

export type TaskCategory = 'video' | 'image' | 'character' | 'content';

export type GenerationTask =
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video'
  | 'lip-sync'
  | 'video-editing'
  | 'text-to-image'
  | 'image-to-image'
  | 'image-editing'
  | 'avatar'
  | 'mascot'
  | 'carousel'
  | 'cinema';

export interface TaskCategoryItem {
  id: TaskCategory;
  label: string;
  tasks: { id: GenerationTask; label: string; icon: string }[];
}

export interface AIModel {
  id: string;
  provider: string;
  name: string;
  description: string;
  tasks: GenerationTask[];
  category: ContentTab;
  thumbnail: string;
  tags: string[];
  costPerRun: number;
  fields: ModelField[];
}

export interface ModelField {
  name: string;
  type: 'textarea' | 'image-upload' | 'video-upload' | 'toggle' | 'select' | 'duration';
  label: string;
  required: boolean;
  placeholder?: string;
  maxLength?: number;
  options?: { value: string; label: string }[];
}
