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

// KIE.ai унифицированный endpoint для подавляющего большинства моделей
const KIE_CREATE_TASK_PATH = "/api/v1/jobs/createTask"

/**
 * Хелперы для нормализации входа.
 */
function imageUrls(params: Record<string, unknown>): string[] | undefined {
  if (Array.isArray(params.imageUrls)) return params.imageUrls as string[]
  if (typeof params.imageUrl === "string") return [params.imageUrl]
  return undefined
}

/**
 * Build the kie.ai request body for a given model/mode/parameters.
 *
 * Все модели на KIE используют общий endpoint POST /api/v1/jobs/createTask
 * с телом { model: "<slug>/<mode>", input: { ... } }.
 *
 * Исключения c dedicated endpoint:
 *   - veo-31  → POST /api/v1/veo/generate (flat body)
 *   - suno-v5 → POST /api/v1/generate     (flat body)
 */
function buildKieBody(
  generation: SelectGeneration,
  model: ModelDefinition
): { path: string; body: Record<string, unknown> } {
  const params = (generation.parameters ?? {}) as Record<string, unknown>
  const mode = generation.mode ?? ""
  const slug = model.slug

  // ── Kling 3.0 (text/image-to-video через единый slug + motion-control отдельно)
  if (slug === "kling-3") {
    if (mode === "motion") {
      return {
        path: KIE_CREATE_TASK_PATH,
        body: {
          model: "kling-3.0/motion-control",
          input: {
            input_urls: params.inputUrls ?? (params.imageUrl ? [params.imageUrl] : []),
            video_urls: params.videoUrls ?? [],
            ...(params.prompt ? { prompt: params.prompt } : {}),
            ...(params.mode ? { mode: params.mode } : {}),
            ...(params.characterOrientation
              ? { character_orientation: params.characterOrientation }
              : {}),
            ...(params.backgroundSource
              ? { background_source: params.backgroundSource }
              : {}),
          },
        },
      }
    }

    const imgs = imageUrls(params)
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: "kling-3.0/video",
        input: {
          prompt: params.prompt,
          duration: String(params.duration ?? "5"),
          aspect_ratio: params.aspectRatio ?? "16:9",
          mode: params.mode ?? "std",
          sound: params.enableAudio ?? false,
          multi_shots: params.multiShots ?? false,
          multi_prompt: Array.isArray(params.multiPrompt) ? params.multiPrompt : [],
          kling_elements: Array.isArray(params.klingElements) ? params.klingElements : [],
          ...(imgs ? { image_urls: imgs } : {}),
          ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
          ...(params.cfgScale !== undefined ? { cfg_scale: params.cfgScale } : {}),
        },
      },
    }
  }

  // ── Kling 2.6 (t2v / i2v / motion-control — РАЗНЫЕ slug-и)
  if (slug === "kling-26") {
    if (mode === "motion") {
      return {
        path: KIE_CREATE_TASK_PATH,
        body: {
          model: "kling-2.6/motion-control",
          input: {
            input_urls: params.inputUrls ?? (params.imageUrl ? [params.imageUrl] : []),
            video_urls: params.videoUrls ?? [],
            character_orientation: params.characterOrientation ?? "front",
            mode: params.mode ?? "std",
            ...(params.prompt ? { prompt: params.prompt } : {}),
          },
        },
      }
    }

    const isI2V = mode === "i2v"
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: isI2V ? "kling-2.6/image-to-video" : "kling-2.6/text-to-video",
        input: {
          prompt: params.prompt,
          duration: String(params.duration ?? "5"),
          aspect_ratio: params.aspectRatio ?? "16:9",
          sound: params.enableAudio ?? false,
          ...(isI2V
            ? { image_urls: imageUrls(params) ?? [] }
            : {}),
          ...(params.endImageUrl ? { last_frame_url: params.endImageUrl } : {}),
          ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
          ...(params.cfgScale !== undefined ? { cfg_scale: params.cfgScale } : {}),
          ...(params.mode ? { mode: params.mode } : {}),
        },
      },
    }
  }

  // ── Veo 3.1 — dedicated endpoint, flat body
  if (slug === "veo-31") {
    const imgs = imageUrls(params)
    return {
      path: "/api/v1/veo/generate",
      body: {
        model: params.model ?? "veo3_fast",
        prompt: params.prompt,
        ...(imgs ? { imageUrls: imgs } : {}),
        aspectRatio: params.aspectRatio ?? "16:9",
        enableAudio: params.enableAudio ?? true,
        enableTranslation: params.enableTranslation ?? true,
        ...(params.watermark ? { watermark: params.watermark } : {}),
        ...(params.duration ? { duration: params.duration } : {}),
        ...(params.resolution ? { resolution: params.resolution } : {}),
        generationType:
          mode ||
          (imgs && imgs.length > 1
            ? "FIRST_AND_LAST_FRAMES_2_VIDEO"
            : imgs
            ? "REFERENCE_2_VIDEO"
            : "TEXT_2_VIDEO"),
      },
    }
  }

  // ── Suno V5 — dedicated endpoint, flat body
  if (slug === "suno-v5") {
    const customMode = Boolean(params.customMode ?? params.title ?? params.tags)
    return {
      path: "/api/v1/generate",
      body: {
        model: "V5",
        prompt: params.prompt,
        instrumental: params.instrumental ?? false,
        customMode,
        ...(customMode && params.title ? { title: params.title } : {}),
        ...(customMode && Array.isArray(params.tags)
          ? { style: (params.tags as string[]).join(", ") }
          : params.style
          ? { style: params.style }
          : {}),
        ...(mode === "extend" && params.audioId
          ? { audioId: params.audioId, continueAt: params.continueAt }
          : {}),
      },
    }
  }

  // ── Nano Banana 2 (Google) — единый slug
  if (slug === "nano-banana-2") {
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: "nano-banana-2",
        input: {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio ?? "1:1",
          output_resolution: params.outputResolution ?? "1K",
          number_of_images: Number(params.numberOfImages ?? 1),
          output_format: params.outputFormat ?? "JPEG",
          person_generation: params.personGeneration ?? true,
          ...(imageUrls(params) ? { image_input: imageUrls(params) } : {}),
          ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
        },
      },
    }
  }

  // ── Flux 2 Pro (t2i / i2i)
  if (slug === "flux-2-pro") {
    const isI2I = mode === "i2i"
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: isI2I ? "flux-2/pro-image-to-image" : "flux-2/pro-text-to-image",
        input: {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio ?? "1:1",
          resolution: params.resolution ?? "1K",
          output_format: params.outputFormat ?? "jpeg",
          output_quality: Number(params.outputQuality ?? 80),
          prompt_upsampling: params.promptUpsampling ?? false,
          safety_tolerance: Number(params.safetyTolerance ?? 2),
          ...(isI2I ? { input_urls: imageUrls(params) ?? [] } : {}),
          ...(isI2I && params.strength !== undefined ? { strength: params.strength } : {}),
        },
      },
    }
  }

  // ── ByteDance Seedance 2
  if (slug === "seedance-2") {
    const imgs = imageUrls(params)
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: "bytedance/seedance-2",
        input: {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio ?? "16:9",
          duration: String(params.duration ?? "5"),
          resolution: params.resolution ?? "720p",
          generate_audio: params.generateAudio ?? false,
          ...(imgs && imgs.length > 0 ? { first_frame_url: imgs[0] } : {}),
          ...(params.lastImageUrl ? { last_frame_url: params.lastImageUrl } : {}),
          ...(Array.isArray(params.referenceUrls) && params.referenceUrls.length > 0
            ? { reference_image_urls: params.referenceUrls }
            : {}),
        },
      },
    }
  }

  // ── ElevenLabs TTS
  if (slug === "elevenlabs-tts") {
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: "elevenlabs/text-to-speech-multilingual-v2",
        input: {
          text: params.text,
          voice: params.voiceId ?? params.voice ?? "rachel",
          ...(params.stability !== undefined ? { stability: params.stability } : {}),
          ...(params.similarityBoost !== undefined
            ? { similarity_boost: params.similarityBoost }
            : {}),
          ...(params.style !== undefined ? { style: params.style } : {}),
          ...(params.useSpeakerBoost !== undefined
            ? { use_speaker_boost: params.useSpeakerBoost }
            : {}),
          ...(params.outputFormat ? { output_format: params.outputFormat } : {}),
        },
      },
    }
  }

  // ── Hailuo 2.3 (t2v standard / i2v pro — разные slug-и)
  if (slug === "hailuo-23") {
    const isI2V = mode === "i2v"
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: isI2V
          ? "hailuo/2-3-image-to-video-pro"
          : "hailuo/02-text-to-video-standard",
        input: {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio ?? "16:9",
          ...(isI2V && params.imageUrl ? { image_url: params.imageUrl } : {}),
          ...(isI2V && params.enableAudio !== undefined
            ? { enable_audio: params.enableAudio }
            : {}),
        },
      },
    }
  }

  // ── Wan 2.7 (t2v / i2v)
  if (slug === "wan-27") {
    const isI2V = mode === "i2v"
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: isI2V ? "wan/2-7-image-to-video" : "wan/2-7-text-to-video",
        input: {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio ?? "16:9",
          duration: String(params.duration ?? "5"),
          resolution: params.resolution ?? "720p",
          ...(isI2V && params.imageUrl ? { first_frame_url: params.imageUrl } : {}),
          ...(isI2V && params.lastImageUrl ? { last_frame_url: params.lastImageUrl } : {}),
          ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
        },
      },
    }
  }

  // ── HappyHorse (video-edit)
  if (slug === "happyhorse-10") {
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: "happyhorse/video-edit",
        input: {
          prompt: params.prompt,
          ...(params.duration ? { duration: String(params.duration) } : {}),
          ...(params.aspectRatio ? { aspect_ratio: params.aspectRatio } : {}),
          ...(params.resolution ? { resolution: params.resolution } : {}),
          ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
          ...(Array.isArray(params.referenceUrls) && params.referenceUrls.length > 0
            ? { reference_urls: params.referenceUrls }
            : {}),
          ...(Array.isArray(params.videoUrls) && params.videoUrls.length > 0
            ? { video_urls: params.videoUrls }
            : {}),
        },
      },
    }
  }

  // ── Ideogram v3
  if (slug === "ideogram-v3") {
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: "ideogram/v3-text-to-image",
        input: {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio ?? "1:1",
          rendering_speed: params.renderingQuality ?? params.renderingSpeed ?? "DEFAULT",
          style_type: params.styleType ?? "AUTO",
          num_images: Number(params.numImages ?? 1),
          ...(params.colorPalette ? { color_palette: params.colorPalette } : {}),
          ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
        },
      },
    }
  }

  // ── OpenAI gpt-image-2 (t2i / i2i)
  if (slug === "gpt-image-2") {
    const isI2I = mode === "i2i"
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: isI2I ? "gpt-image-2-image-to-image" : "gpt-image-2-text-to-image",
        input: {
          prompt: params.prompt,
          quality: params.quality ?? "auto",
          size: params.size ?? "1024x1024",
          output_format: params.outputFormat ?? "png",
          background: params.background ?? "auto",
          n: Number(params.n ?? 1),
          ...(params.outputCompression !== undefined
            ? { output_compression: params.outputCompression }
            : {}),
          ...(isI2I ? { input_urls: imageUrls(params) ?? [] } : {}),
        },
      },
    }
  }

  // ── OpenAI gpt-image-1.5 (t2i / i2i)
  if (slug === "gpt-image-15") {
    const isI2I = mode === "i2i"
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: isI2I ? "gpt-image/1.5-image-to-image" : "gpt-image/1.5-text-to-image",
        input: {
          prompt: params.prompt,
          quality: params.quality ?? "auto",
          size: params.size ?? "1024x1024",
          output_format: params.outputFormat ?? "png",
          n: Number(params.n ?? 1),
          ...(params.outputCompression !== undefined
            ? { output_compression: params.outputCompression }
            : {}),
          ...(isI2I ? { input_urls: imageUrls(params) ?? [] } : {}),
        },
      },
    }
  }

  // ── Grok Imagine
  if (slug === "grok-imagine") {
    const slugMap: Record<string, string> = {
      t2i: "grok-imagine/text-to-image",
      i2i: "grok-imagine/image-to-image",
      t2v: "grok-imagine/text-to-video",
      i2v: "grok-imagine/image-to-video",
      upscale: "grok-imagine/upscale",
      extend: "grok-imagine/extend",
    }
    const kieModel = slugMap[mode] ?? "grok-imagine/text-to-image"
    const isImage2X = mode === "i2i" || mode === "i2v" || mode === "upscale" || mode === "extend"
    return {
      path: KIE_CREATE_TASK_PATH,
      body: {
        model: kieModel,
        input: {
          ...(params.prompt ? { prompt: params.prompt } : {}),
          aspect_ratio: params.aspectRatio ?? "1:1",
          ...(params.style ? { style: params.style } : {}),
          ...(params.n !== undefined ? { n: Number(params.n) } : {}),
          ...(isImage2X ? { input_urls: imageUrls(params) ?? [] } : {}),
        },
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
