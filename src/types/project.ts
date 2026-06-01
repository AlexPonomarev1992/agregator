import type { FileAttachment } from './ai';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  context: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  modelId?: string;
  personaId?: string;
}

export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  project_id: string;
  role: ChatMessageRole;
  content: string;
  created_at: string;
  attachments?: FileAttachment[];
  isEdited?: boolean;
}
