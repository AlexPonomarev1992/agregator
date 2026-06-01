// NanoBanana API client for photo/avatar/mascot generation

const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;
const NANOBANANA_API_URL =
  process.env.NANOBANANA_API_URL || "https://api.nanobanana.com";

// --- Types ---

interface NanoBananaTaskResponse {
  taskId: string;
  status: "pending" | "processing" | "done" | "failed";
  resultUrl?: string;
  error?: string;
}

interface NanoBananaCreateOptions {
  style?: string;
  templateId?: string | null;
}

// Mock state to simulate progress across calls
const mockTaskProgress = new Map<string, number>();

/**
 * Создать задачу генерации в NanoBanana API.
 * Если NANOBANANA_API_KEY не задан, возвращает мок-ответ для тестирования.
 */
export async function createNanoBananaTask(
  prompt: string,
  type: "photo" | "avatar" | "mascot",
  options?: NanoBananaCreateOptions
): Promise<NanoBananaTaskResponse> {
  // Mock mode when no API key is configured
  if (!NANOBANANA_API_KEY) {
    const mockTaskId = `mock-nb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    mockTaskProgress.set(mockTaskId, 0);
    console.log(
      `[NanoBanana Mock] Created task ${mockTaskId} for type=${type}`
    );
    return {
      taskId: mockTaskId,
      status: "pending",
    };
  }

  // Real API call
  const response = await fetch(`${NANOBANANA_API_URL}/v1/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NANOBANANA_API_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      type,
      style: options?.style,
      template_id: options?.templateId ?? undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[NanoBanana API] Create task error:", errorText);
    throw new Error(`NanoBanana API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    taskId: data.task_id ?? data.id,
    status: "pending",
  };
}

/**
 * Проверить статус задачи в NanoBanana API.
 * Если NANOBANANA_API_KEY не задан, симулирует прогресс (pending→processing→done).
 */
export async function getNanoBananaTaskStatus(
  taskId: string
): Promise<NanoBananaTaskResponse> {
  // Mock mode
  if (!NANOBANANA_API_KEY) {
    const callCount = (mockTaskProgress.get(taskId) ?? 0) + 1;
    mockTaskProgress.set(taskId, callCount);

    if (callCount <= 1) {
      return { taskId, status: "pending" };
    }
    if (callCount <= 2) {
      return { taskId, status: "processing" };
    }

    // After 3+ calls, mark as done with mock image URL
    mockTaskProgress.delete(taskId);
    return {
      taskId,
      status: "done",
      resultUrl: `https://mock-cdn.vibelab.ru/generations/${taskId}.png`,
    };
  }

  // Real API call
  const response = await fetch(
    `${NANOBANANA_API_URL}/v1/tasks/${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${NANOBANANA_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[NanoBanana API] Status check error:", errorText);
    throw new Error(`NanoBanana API error: ${response.status}`);
  }

  const data = await response.json();

  const statusMap: Record<string, NanoBananaTaskResponse["status"]> = {
    pending: "pending",
    queued: "pending",
    processing: "processing",
    running: "processing",
    completed: "done",
    success: "done",
    failed: "failed",
    error: "failed",
  };

  return {
    taskId,
    status: statusMap[data.status] ?? "processing",
    resultUrl: data.result_url ?? data.output?.image_url,
    error: data.error_message,
  };
}
