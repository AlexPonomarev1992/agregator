import { z } from "zod";

// --- Генерация ---

export const generateVideoSchema = z.object({
  prompt: z.string().min(1, "Промпт обязателен").max(5000),
  modelId: z.string().max(100).optional(),
  templateId: z.string().uuid().nullable().optional(),
  duration: z.union([z.literal(5), z.literal(10), z.literal(15)]).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  resolution: z.string().max(10).optional(),
  sound: z.boolean().optional(),
  mode: z.enum(["std", "pro"]).optional(),
  imageUrl: z.string().optional(),
  endFrameUrl: z.string().optional(),
});
export type GenerateVideoInput = z.infer<typeof generateVideoSchema>;

export const generatePhotoSchema = z.object({
  prompt: z.string().min(1, "Промпт обязателен").max(5000),
  modelId: z.string().max(100).optional(),
  templateId: z.string().uuid().nullable().optional(),
  style: z.string().max(100).optional(),
  aspectRatio: z.string().max(50).optional(),
  resolution: z.string().max(10).optional(),
  negativePrompt: z.string().max(5000).optional(),
  renderingSpeed: z.enum(["TURBO", "BALANCED", "QUALITY"]).optional(),
  imageUrl: z.string().optional(),
});
export type GeneratePhotoInput = z.infer<typeof generatePhotoSchema>;

// --- Проекты (ИИ-ассистент) ---

export const createProjectSchema = z.object({
  name: z.string().min(1, "Название проекта обязательно").max(100),
  description: z.string().max(1000).optional(),
  context: z.string().max(5000).optional(),
  modelId: z.string().max(100).optional(),
  personaId: z.string().max(100).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// --- Профиль ---

const socialLinkSchema = z.object({
  platform: z.string().max(100),
  url: z.string().url().max(500),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// --- Чат ---

const attachmentSchema = z.object({
  type: z.string().max(100),
  url: z.string().url().max(500),
  name: z.string().max(100).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Сообщение не может быть пустым").max(5000),
  modelId: z.string().max(100).optional(),
  systemPrompt: z.string().max(2000).optional(),
  attachments: z.array(attachmentSchema).optional(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// --- Платежи ---

export const initPaymentSchema = z
  .object({
    type: z.enum(["credits", "subscription"]),
    credits: z.number().int().positive().max(10000).optional(),
    plan: z.enum(["monthly", "yearly"]).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "credits") return data.credits !== undefined;
      if (data.type === "subscription") return data.plan !== undefined;
      return true;
    },
    {
      message:
        "Для типа 'credits' требуется поле credits, для 'subscription' — поле plan",
    }
  );
export type InitPaymentInput = z.infer<typeof initPaymentSchema>;

// --- Studio ---

export const studioGenerateSchema = z.object({
  modelSlug: z.string().min(1).max(100),
  mode: z.string().min(1).max(100),
  parameters: z.record(z.unknown()),
  parentGenerationId: z.string().uuid().optional(),
})
export type StudioGenerateInput = z.infer<typeof studioGenerateSchema>

// T-Bank webhook payload validation
export const tbankWebhookSchema = z.object({
  TerminalKey: z.string(),
  OrderId: z.string(),
  Success: z.boolean(),
  Status: z.string(),
  PaymentId: z.union([z.string(), z.number()]),
  ErrorCode: z.string(),
  Amount: z.number(),
  Pan: z.string().optional(),
  Token: z.string(),
});
export type TbankWebhookPayload = z.infer<typeof tbankWebhookSchema>;
