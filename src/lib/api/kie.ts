// KIE.ai unified API client — supports Kling, Sora, Runway and other models
// Docs: https://docs.kie.ai/

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const KIE_API_KEY = process.env.KLING_API_KEY;
const KIE_API_URL = "https://api.kie.ai";
const UPLOAD_DIR = "/tmp/vibelab-uploads";
const APP_URL = process.env.BETTER_AUTH_URL || "http://localhost:3005";

// --- Types ---

export interface KieTaskResponse {
  taskId: string;
  status: "pending" | "processing" | "done" | "failed";
  resultUrl?: string;
  progress?: number;
  error?: string;
}

export interface KieCreateOptions {
  duration?: string;
  aspectRatio?: string;
  sound?: boolean;
  style?: string;
  templateId?: string | null;
  imageUrl?: string;
  endFrameUrl?: string;
  negativePrompt?: string;
  resolution?: string;
  renderingSpeed?: string;
  promptOptimizer?: boolean;
  mode?: string;
}

// Map internal model IDs to kie.ai model identifiers
// Verified working 2026-03-26
const MODEL_MAP: Record<string, string> = {
  // Video models
  "kling-3.0": "kling-3.0/video",
  "kling-3": "kling-3.0/video",
  "sora-2": "kling-3.0/video",
  "runway-gen3": "kling-3.0/video",
  // Image models
  "nanobanana": "google/nano-banana",
  "nanobanana-2": "nano-banana-2",
  "ideogram": "ideogram/v3-text-to-image",
  "imagen4": "google/imagen4",
  // Fallbacks
  "video": "kling-3.0/video",
  "photo": "google/nano-banana",
};

/**
 * Convert data URL to a publicly accessible file URL.
 * Saves the file to disk and returns a URL that KIE can fetch.
 */
async function dataUrlToPublicUrl(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith("data:")) return dataUrl; // already a URL

  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL format");

  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const buffer = Buffer.from(match[2], "base64");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileId = crypto.randomUUID();
  const filename = `${fileId}.${ext}`;
  await writeFile(join(UPLOAD_DIR, filename), buffer);

  return `${APP_URL}/api/upload/${filename}`;
}

function getKieModel(modelId: string, type: "video" | "photo"): string {
  return MODEL_MAP[modelId] ?? MODEL_MAP[type] ?? "kling-2.6/text-to-video";
}

/**
 * Create a generation task via kie.ai API.
 * Falls back to mock when API key is not configured.
 */
export async function createKieTask(
  prompt: string,
  type: "video" | "photo",
  modelId?: string,
  options?: KieCreateOptions
): Promise<KieTaskResponse> {
  if (!KIE_API_KEY) {
    console.warn("[KIE] No API key configured, using mock");
    return {
      taskId: `mock-kie-${Date.now()}`,
      status: "pending",
    };
  }

  let model = getKieModel(modelId ?? type, type);

  const input: Record<string, unknown> = {
    prompt,
  };

  // Video-specific params (per-model from KIE docs)
  if (type === "video") {
    const hasStartFrame = !!options?.imageUrl;
    const startFrameUrl = hasStartFrame ? await dataUrlToPublicUrl(options!.imageUrl!) : undefined;

    if (model === "kling-3.0/video") {
      // Kling 3.0: mode, multi_shots required; supports start + end frame via image_urls
      input.duration = options?.duration ?? "5";
      input.aspect_ratio = options?.aspectRatio ?? "16:9";
      input.sound = options?.sound ?? false;
      input.mode = options?.mode ?? "std";
      input.multi_shots = false;
      input.multi_prompt = [];
      if (startFrameUrl) {
        const imageUrls = [startFrameUrl];
        if (options?.endFrameUrl) {
          imageUrls.push(await dataUrlToPublicUrl(options.endFrameUrl));
        }
        input.image_urls = imageUrls;
      }
    } else if (model.includes("kling")) {
      // Kling 2.6: duration, aspect_ratio, sound required
      input.duration = options?.duration ?? "5";
      input.aspect_ratio = options?.aspectRatio ?? "16:9";
      input.sound = options?.sound ?? false;
      if (startFrameUrl) {
        model = "kling-2.6/image-to-video";
        input.image_urls = [startFrameUrl];
      }
    }
  }

  // Image-specific params (per-model from KIE docs)
  if (type === "photo") {
    // Handle reference image for all photo models
    if (options?.imageUrl) {
      const refUrl = await dataUrlToPublicUrl(options.imageUrl);
      input.image_url = refUrl;
      input.image_urls = [refUrl];
    }

    if (model.includes("ideogram")) {
      // Ideogram: style, negative_prompt, image_size, rendering_speed, seed
      if (options?.aspectRatio) input.image_size = options.aspectRatio;
      if (options?.style) input.style = options.style;
      if (options?.negativePrompt) input.negative_prompt = options.negativePrompt;
      if (options?.renderingSpeed) input.rendering_speed = options.renderingSpeed;
    } else if (model.includes("imagen4")) {
      // Imagen 4: aspect_ratio, negative_prompt, seed
      if (options?.aspectRatio) input.aspect_ratio = options.aspectRatio;
      if (options?.negativePrompt) input.negative_prompt = options.negativePrompt;
    } else if (model.includes("grok")) {
      // Grok: aspect_ratio only
      if (options?.aspectRatio) input.aspect_ratio = options.aspectRatio;
    } else {
      // NanoBanana: image_size
      if (options?.aspectRatio) input.image_size = options.aspectRatio;
    }
  }

  const body = {
    model,
    input,
    callBackUrl: undefined as string | undefined,
  };

  console.log(`[KIE] Creating task: model=${model}, type=${type}, payload:`, JSON.stringify(body, null, 2));

  const response = await fetch(`${KIE_API_URL}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KIE_API_KEY}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json();

  if (data.code !== 200 || !data.data?.taskId) {
    console.error("[KIE] Create task error:", data);
    throw new Error(
      `KIE API error: ${data.msg || data.message || `code ${data.code}`}`
    );
  }

  console.log(`[KIE] Task created: ${data.data.taskId}`);

  return {
    taskId: data.data.taskId,
    status: "pending",
  };
}

/**
 * Check task status via kie.ai API.
 */
export async function getKieTaskStatus(
  taskId: string
): Promise<KieTaskResponse> {
  if (!KIE_API_KEY) {
    return { taskId, status: "done", resultUrl: `https://picsum.photos/800/600?t=${taskId}` };
  }

  const response = await fetch(
    `${KIE_API_URL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    {
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (data.code !== 200) {
    console.error("[KIE] Status check error:", data);
    throw new Error(`KIE API error: ${data.msg || `code ${data.code}`}`);
  }

  const task = data.data;
  console.log(`[KIE] Task ${taskId} raw state: "${task.state}", resultJson: ${task.resultJson ? 'present' : 'empty'}`);

  // Map kie.ai states to our internal status
  const stateMap: Record<string, KieTaskResponse["status"]> = {
    waiting: "pending",
    queuing: "pending",
    generating: "processing",
    success: "done",
    fail: "failed",
  };

  const status = stateMap[task.state] ?? "processing";

  // Parse result URL from resultJson
  let resultUrl: string | undefined;
  if (task.resultJson && status === "done") {
    try {
      const result = JSON.parse(task.resultJson);
      // resultJson typically has { resultUrls: [...] }
      resultUrl = result.resultUrls?.[0] ?? result.url ?? result.video_url;
    } catch {
      console.warn("[KIE] Failed to parse resultJson:", task.resultJson);
    }
  }

  return {
    taskId,
    status,
    resultUrl,
    progress: task.progress ?? undefined,
    error: task.failMsg || undefined,
  };
}
