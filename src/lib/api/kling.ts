// Kling API client for video/image generation

const KLING_API_KEY = process.env.KLING_API_KEY;
const KLING_API_URL =
  process.env.KLING_API_URL || "https://api.klingai.com";

// --- Types ---

interface KlingTaskResponse {
  taskId: string;
  status: "pending" | "processing" | "done" | "failed";
  resultUrl?: string;
  error?: string;
}

interface KlingCreateOptions {
  duration?: 5 | 10;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  templateId?: string | null;
}

// Mock state to simulate progress across calls
const mockTaskProgress = new Map<string, number>();

/**
 * Создать задачу генерации в Kling API.
 * Если KLING_API_KEY не задан, возвращает мок-ответ для тестирования.
 */
export async function createKlingTask(
  prompt: string,
  type: "video" | "photo",
  options?: KlingCreateOptions
): Promise<KlingTaskResponse> {
  // Mock mode when no API key is configured
  if (!KLING_API_KEY) {
    const mockTaskId = `mock-kling-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    mockTaskProgress.set(mockTaskId, 0);
    console.log(`[Kling Mock] Created task ${mockTaskId} for type=${type}`);
    return {
      taskId: mockTaskId,
      status: "pending",
    };
  }

  // Real API call
  const endpoint =
    type === "video"
      ? `${KLING_API_URL}/v1/videos/generations`
      : `${KLING_API_URL}/v1/images/generations`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KLING_API_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      duration: options?.duration ?? 5,
      aspect_ratio: options?.aspectRatio ?? "16:9",
      template_id: options?.templateId ?? undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Kling API] Create task error:", errorText);
    throw new Error(`Kling API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    taskId: data.data?.task_id ?? data.task_id,
    status: "pending",
  };
}

/**
 * Проверить статус задачи в Kling API.
 * Если KLING_API_KEY не задан, симулирует прогресс (pending→processing→done).
 */
export async function getKlingTaskStatus(
  taskId: string
): Promise<KlingTaskResponse> {
  // Mock mode
  if (!KLING_API_KEY) {
    const callCount = (mockTaskProgress.get(taskId) ?? 0) + 1;
    mockTaskProgress.set(taskId, callCount);

    if (callCount <= 1) {
      return { taskId, status: "pending" };
    }
    if (callCount <= 2) {
      return { taskId, status: "processing" };
    }

    // After 3+ calls, mark as done
    mockTaskProgress.delete(taskId);
    return {
      taskId,
      status: "done",
      resultUrl: `https://mock-cdn.vibelab.ru/generations/${taskId}.mp4`,
    };
  }

  // Real API call
  const response = await fetch(
    `${KLING_API_URL}/v1/tasks/${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${KLING_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Kling API] Status check error:", errorText);
    throw new Error(`Kling API error: ${response.status}`);
  }

  const data = await response.json();
  const taskData = data.data ?? data;

  const statusMap: Record<string, KlingTaskResponse["status"]> = {
    submitted: "pending",
    pending: "pending",
    processing: "processing",
    running: "processing",
    succeed: "done",
    completed: "done",
    failed: "failed",
    error: "failed",
  };

  return {
    taskId,
    status: statusMap[taskData.status] ?? "processing",
    resultUrl: taskData.result_url ?? taskData.output?.video_url,
    error: taskData.error_message,
  };
}
