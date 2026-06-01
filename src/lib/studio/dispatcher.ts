import type { ModelDefinition } from "@/lib/models/types"
import type { SelectGeneration } from "@/lib/db/schema"
import { updateGenerationStatus } from "@/lib/db/queries/studio"
import { logGenerationError } from "@/lib/db/queries/generation-errors"
import { refundCredits } from "@/lib/studio/credits"
import { notify } from "@/lib/services/notify"
import { GENERATION_ERROR_CODES, getErrorMessage } from "@/lib/studio/generation-error-codes"

const KIE_API_KEY = process.env.KLING_API_KEY ?? process.env.KIE_API_KEY
const KIE_API_URL = "https://api.kie.ai"

interface KieCreateResponse {
  code: number
  msg?: string
  message?: string
  data?: { taskId?: string }
}

/**
 * Build the kie.ai request body for a given model/mode/parameters.
 */
function buildKieBody(
  generation: SelectGeneration,
  model: ModelDefinition
): { path: string; body: Record<string, unknown> } {
  const params = (generation.parameters ?? {}) as Record<string, unknown>
  const mode = generation.mode ?? ""
  const slug = model.slug

  if (slug === "kling-3") {
    let path = "/api/v1/kling/v1/videos/text2video"
    if (mode === "i2v") path = "/api/v1/kling/v1/videos/image2video"
    if (mode === "motion") path = "/api/v1/kling/v1/videos/motion-control"

    return {
      path,
      body: {
        model: "kling-v3",
        prompt: params.prompt,
        mode: params.mode ?? "std",
        duration: params.duration ?? "5",
        aspect_ratio: params.aspectRatio ?? "16:9",
        sound: params.enableAudio ?? false,
        multi_shots: false,
        multi_prompt: [],
        ...(params.imageUrl ? { image_urls: [params.imageUrl] } : {}),
        ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
        ...(params.cfgScale !== undefined ? { cfg_scale: params.cfgScale } : {}),
      },
    }
  }

  if (slug === "veo-31") {
    const imageUrls = params.imageUrl
      ? [params.imageUrl]
      : Array.isArray(params.imageUrls)
      ? params.imageUrls
      : undefined

    return {
      path: "/api/v1/veo/generate",
      body: {
        model: params.model ?? "veo3_fast",
        prompt: params.prompt,
        ...(imageUrls ? { imageUrls } : {}),
        aspectRatio: params.aspectRatio ?? "16:9",
        enableAudio: params.enableAudio ?? true,
        enableTranslation: params.enableTranslation ?? true,
        ...(params.watermark ? { watermark: params.watermark } : {}),
        generationType: mode,
      },
    }
  }

  if (slug === "nano-banana-2") {
    return {
      path: "/api/v1/images/google/nanobanana2",
      body: {
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio ?? "1:1",
        output_resolution: params.outputResolution ?? "1K",
        number_of_images: params.numberOfImages ?? 1,
        output_format: params.outputFormat ?? "JPEG",
        person_generation: params.personGeneration ?? true,
        ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
      },
    }
  }

  if (slug === "flux-2-pro") {
    const path =
      mode === "i2i"
        ? "/api/v1/images/flux2/pro-image-to-image"
        : "/api/v1/images/flux2/pro-text-to-image"

    return {
      path,
      body: {
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio ?? "1:1",
        output_format: params.outputFormat ?? "jpeg",
        output_quality: params.outputQuality ?? 80,
        prompt_upsampling: params.promptUpsampling ?? false,
        safety_tolerance: params.safetyTolerance ?? 2,
        ...(mode === "i2i" && params.imageUrl ? { image_url: params.imageUrl } : {}),
        ...(mode === "i2i" && params.strength !== undefined ? { strength: params.strength } : {}),
      },
    }
  }

  if (slug === "seedance-2") {
    return {
      path: "/api/v1/bytedance/seedance/generate",
      body: {
        model: params.model ?? "seedance-2-0",
        prompt: params.prompt,
        duration: params.duration ?? "5",
        aspect_ratio: params.aspectRatio ?? "16:9",
        resolution: params.resolution ?? "720p",
        generate_audio: params.generateAudio ?? false,
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
        ...(params.lastImageUrl ? { last_image_url: params.lastImageUrl } : {}),
      },
    }
  }

  if (slug === "suno-v5") {
    return {
      path: "/api/v1/suno/generate",
      body: {
        prompt: params.prompt,
        ...(Array.isArray(params.tags) ? { tags: params.tags } : {}),
        instrumental: params.instrumental ?? false,
        ...(params.title ? { title: params.title } : {}),
        make_public: params.makePublic ?? false,
        ...(mode === "extend"
          ? { audio_id: params.audioId, continue_at: params.continueAt }
          : {}),
        mode,
      },
    }
  }

  if (slug === "elevenlabs-tts") {
    return {
      path: "/api/v1/elevenlabs/tts",
      body: {
        text: params.text,
        voice_id: params.voiceId ?? "rachel",
        model_id: params.model ?? "turbo-2-5",
        voice_settings: {
          stability: params.stability ?? 0.5,
          similarity_boost: params.similarityBoost ?? 0.75,
          style: params.style ?? 0,
          use_speaker_boost: params.useSpeakerBoost ?? true,
        },
        output_format: params.outputFormat ?? "mp3_44100_128",
      },
    }
  }

  if (slug === "kling-26") {
    const path =
      mode === "i2v"
        ? "/api/v1/kling/v1/videos/image2video"
        : "/api/v1/kling/v1/videos/text2video"

    return {
      path,
      body: {
        model: "kling-v2-6",
        prompt: params.prompt,
        mode: params.mode ?? "std",
        duration: params.duration ?? "5",
        aspect_ratio: params.aspectRatio ?? "16:9",
        ...(params.imageUrl ? { image_urls: [params.imageUrl] } : {}),
        ...(params.endImageUrl ? { end_image_url: params.endImageUrl } : {}),
        ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
        ...(params.cfgScale !== undefined ? { cfg_scale: params.cfgScale } : {}),
      },
    }
  }

  if (slug === "hailuo-23") {
    const path =
      mode === "i2v"
        ? "/api/v1/hailuo/2-3-image-to-video"
        : "/api/v1/hailuo/2-3-text-to-video"

    return {
      path,
      body: {
        prompt: params.prompt,
        tier: params.tier ?? "standard",
        aspect_ratio: params.aspectRatio ?? "16:9",
        duration: 6,
        ...(params.tier === "pro" && params.enableAudio !== undefined
          ? { enable_audio: params.enableAudio }
          : {}),
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
      },
    }
  }

  if (slug === "wan-27") {
    const path =
      mode === "i2v"
        ? "/api/v1/wan/2-7-image-to-video"
        : "/api/v1/wan/2-7-text-to-video"

    return {
      path,
      body: {
        model: "wan-2-7",
        prompt: params.prompt,
        duration: params.duration ?? "5",
        resolution: params.resolution ?? "720p",
        aspect_ratio: params.aspectRatio ?? "16:9",
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
        ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
      },
    }
  }

  if (slug === "happyhorse-10") {
    return {
      path: "/api/v1/happyhorse/generate",
      body: {
        prompt: params.prompt,
        duration: params.duration ?? "5",
        aspect_ratio: params.aspectRatio ?? "16:9",
        resolution: params.resolution ?? "1080p",
        mode,
        ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
        ...(Array.isArray(params.referenceUrls) && params.referenceUrls.length > 0
          ? { reference_urls: params.referenceUrls }
          : {}),
      },
    }
  }

  if (slug === "ideogram-v3") {
    return {
      path: "/api/v1/images/ideogram/v3-text-to-image",
      body: {
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio ?? "1:1",
        rendering_quality: params.renderingQuality ?? "DEFAULT",
        style_type: params.styleType ?? "AUTO",
        num_images: Number(params.numImages ?? 1),
        ...(params.colorPalette ? { color_palette: params.colorPalette } : {}),
        ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
      },
    }
  }

  if (slug === "gpt-image-2") {
    const path =
      mode === "i2i"
        ? "/api/v1/images/gpt/gpt-image-2-image-to-image"
        : "/api/v1/images/gpt/gpt-image-2-text-to-image"

    return {
      path,
      body: {
        prompt: params.prompt,
        quality: params.quality ?? "auto",
        size: params.size ?? "1024x1024",
        output_format: params.outputFormat ?? "png",
        background: params.background ?? "auto",
        n: Number(params.n ?? 1),
        ...(params.outputCompression !== undefined
          ? { output_compression: params.outputCompression }
          : {}),
        ...(mode === "i2i" && params.imageUrl ? { image_url: params.imageUrl } : {}),
      },
    }
  }

  if (slug === "gpt-image-15") {
    const path =
      mode === "i2i"
        ? "/api/v1/images/gpt-image/1-5-image-to-image"
        : "/api/v1/images/gpt-image/1-5-text-to-image"

    return {
      path,
      body: {
        prompt: params.prompt,
        quality: params.quality ?? "auto",
        size: params.size ?? "1024x1024",
        output_format: params.outputFormat ?? "png",
        n: Number(params.n ?? 1),
        ...(params.outputCompression !== undefined
          ? { output_compression: params.outputCompression }
          : {}),
        ...(mode === "i2i" && params.imageUrl ? { image_url: params.imageUrl } : {}),
      },
    }
  }

  if (slug === "grok-imagine") {
    return {
      path: "/api/v1/images/grok/imagine",
      body: {
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio ?? "1:1",
        style: params.style ?? "photographic",
        n: Number(params.n ?? 1),
        mode,
        ...(mode === "i2i" && params.imageUrl ? { image_url: params.imageUrl } : {}),
      },
    }
  }

  // Fallback: use model.endpoint.path and pass raw params
  return {
    path: model.endpoint.path,
    body: { ...params },
  }
}

/**
 * Dispatch a generation to the external provider.
 * Called fire-and-forget after INSERT in the generate route.
 * Updates generation status and refunds credits on failure.
 */
export async function dispatchToProvider(
  generation: SelectGeneration,
  model: ModelDefinition
): Promise<void> {
  const provider = model.endpoint.provider

  try {
    if (provider === "kie") {
      await dispatchToKie(generation, model)
    } else {
      await dispatchToKie(generation, model)
    }
  } catch (error) {
    console.error(`[dispatcher] Dispatch failed for generation ${generation.id}:`, error)

    const rawMessage = error instanceof Error ? error.message : "Unknown dispatch error"

    // Определяем код ошибки по сообщению
    let errorCode = GENERATION_ERROR_CODES.DISPATCH_FAILED
    if (rawMessage.includes("API key") || rawMessage.includes("API_KEY")) {
      errorCode = GENERATION_ERROR_CODES.API_KEY_MISSING
    } else if (rawMessage.includes("400")) {
      errorCode = GENERATION_ERROR_CODES.INVALID_REQUEST
    } else if (rawMessage.includes("429")) {
      errorCode = GENERATION_ERROR_CODES.RATE_LIMITED
    } else if (rawMessage.includes("5")) {
      errorCode = GENERATION_ERROR_CODES.PROVIDER_UNAVAILABLE
    }

    const errorMessage = getErrorMessage(errorCode)

    // Пишем в журнал ошибок
    await logGenerationError({
      generationId: generation.id,
      userId: generation.userId,
      stage: "dispatch",
      errorCode,
      errorMessage: `${errorMessage} | raw: ${rawMessage}`,
      rawResponse: { message: rawMessage },
    })

    try {
      await updateGenerationStatus(generation.id, {
        status: "failed",
        errorCode,
        errorMessage,
      })
    } catch (updateErr) {
      console.error("[dispatcher] Failed to update generation status:", updateErr)
    }

    await refundCredits(
      generation.userId,
      generation.costCredits,
      `Refund: dispatch failed for generation ${generation.id}`
    )

    notify.generationDone(
      generation.userId,
      "video",
      `Generation ${generation.id} failed: ${errorMessage}`,
      generation.id
    )
  }
}

async function dispatchToKie(
  generation: SelectGeneration,
  model: ModelDefinition
): Promise<void> {
  if (!KIE_API_KEY) {
    // Mock mode for development
    console.warn(`[dispatcher] No KIE_API_KEY — mocking dispatch for generation ${generation.id}`)
    await updateGenerationStatus(generation.id, {
      status: "running",
      kieTaskId: `mock-${generation.id}`,
    })
    return
  }

  const { path, body } = buildKieBody(generation, model)
  const url = `${KIE_API_URL}${path}`

  console.log(`[dispatcher] POST ${url} for generation ${generation.id}`)

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KIE_API_KEY}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  const data: KieCreateResponse = await response.json()

  if (data.code !== 200 || !data.data?.taskId) {
    // Логируем сырой ответ провайдера для диагностики
    await logGenerationError({
      generationId: generation.id,
      userId: generation.userId,
      stage: "provider",
      errorCode: response.status === 429
        ? GENERATION_ERROR_CODES.RATE_LIMITED
        : response.status >= 500
        ? GENERATION_ERROR_CODES.PROVIDER_UNAVAILABLE
        : GENERATION_ERROR_CODES.PROVIDER_REJECTED,
      errorMessage: data.msg ?? data.message ?? `KIE HTTP ${response.status}`,
      rawResponse: data as unknown as Record<string, unknown>,
      providerHttpStatus: String(response.status),
    })
    throw new Error(`KIE API error: ${data.msg ?? data.message ?? `code ${data.code}`}`)
  }

  const taskId = data.data.taskId
  console.log(`[dispatcher] KIE task created: ${taskId} for generation ${generation.id}`)

  await updateGenerationStatus(generation.id, {
    status: "running",
    kieTaskId: taskId,
  })
}
