import { MockApiClient } from './mock-client';

export type { ApiClient } from './client';
export { MockApiClient } from './mock-client';

export const api = new MockApiClient();

// Shared API utilities
export {
  apiSuccess,
  apiError,
  unauthorized,
  forbidden,
  notFound,
  insufficientCredits,
  subscriptionRequired,
  validationError,
  externalApiError,
} from './response';

export { getAuthSession, requireAuth } from './auth-guard';

export { validateBody } from './validate';

export {
  generateVideoSchema,
  generatePhotoSchema,
  createProjectSchema,
  updateProfileSchema,
  sendMessageSchema,
  initPaymentSchema,
  tbankWebhookSchema,
} from './validation';

export type {
  GenerateVideoInput,
  GeneratePhotoInput,
  CreateProjectInput,
  UpdateProfileInput,
  SendMessageInput,
  InitPaymentInput,
  TbankWebhookPayload,
} from './validation';
