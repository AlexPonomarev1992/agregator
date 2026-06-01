export interface ChatModel {
  id: string
  name: string
  provider: string
  contextWindow: number
  costPer1kTokens: { input: number; output: number }
  description: string
  icon: string
  capabilities: ModelCapabilities
}

export interface ModelCapabilities {
  functionCalling: boolean
  structuredOutputs: boolean
  webAccess: boolean
  thinking: boolean
  vision: boolean
  streaming: boolean
}

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'

export interface ConversationSettings {
  modelId: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  memory: boolean
  webAccess: boolean
  functionCalling: boolean
  structuredOutputs: boolean
  thinking: boolean
  reasoningEffort: ReasoningEffort
  streamResponse: boolean
}

export interface Persona {
  id: string
  name: string
  description: string
  icon: string
  systemPrompt: string
  isBuiltIn: boolean
  tags: string[]
}

export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
  file?: File
}
