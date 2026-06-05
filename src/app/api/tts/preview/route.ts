import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-guard"
import { TTS_VOICES } from "@/lib/models/registry/elevenlabs-tts"

const KIE_API_KEY = process.env.KLING_API_KEY ?? process.env.KIE_API_KEY
const KIE_API_URL = "https://api.kie.ai"

// Server-process cache: voiceId → audioUrl
// Persists until redeploy — voice previews never change
const cache = new Map<string, string>()

function pickUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    const t = value.trim()
    return /^https?:\/\//i.test(t) ? t : undefined
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>
    for (const k of ["url", "audioUrl", "audio_url", "originUrl"]) {
      const u = pickUrl(o[k])
      if (u) return u
    }
  }
  return undefined
}

function extractUrl(resultJson: string): string | undefined {
  try {
    const r = JSON.parse(resultJson) as Record<string, unknown>
    const direct = pickUrl(r)
    if (direct) return direct
    for (const key of Object.values(r)) {
      const u = pickUrl(key)
      if (u) return u
    }
  } catch {
    // malformed JSON
  }
  return undefined
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const { voiceId, voiceName } = body as { voiceId?: string; voiceName?: string }
  if (!voiceId) {
    return NextResponse.json({ error: "voiceId required" }, { status: 400 })
  }

  // Return cached URL if available
  const cached = cache.get(voiceId)
  if (cached) return NextResponse.json({ url: cached })

  if (!KIE_API_KEY) {
    return NextResponse.json({ error: "KIE API key not configured" }, { status: 503 })
  }

  // Build Russian preview text
  const voice = TTS_VOICES.find((v) => v.id === voiceId)
  const name = voice?.name ?? voiceName ?? "голос"
  const text = `Привет! Меня зовут ${name}. Рад тебя слышать.`

  // Create KIE TTS task
  let taskId: string
  try {
    const res = await fetch(`${KIE_API_URL}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "elevenlabs/text-to-speech-turbo-2-5",
        input: {
          text,
          voice: voiceId,
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          speed: 1,
          use_speaker_boost: true,
        },
      }),
    })
    const data = (await res.json()) as { code?: number; data?: { taskId?: string } }
    if (!data.data?.taskId) {
      return NextResponse.json({ error: "Failed to create preview task" }, { status: 502 })
    }
    taskId = data.data.taskId
  } catch {
    return NextResponse.json({ error: "KIE API unreachable" }, { status: 502 })
  }

  // Poll for result (max ~30s)
  for (let i = 0; i < 15; i++) {
    await sleep(i < 3 ? 1500 : 2500)
    try {
      const res = await fetch(
        `${KIE_API_URL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
        { headers: { Authorization: `Bearer ${KIE_API_KEY}` }, cache: "no-store" }
      )
      const data = (await res.json()) as {
        code?: number
        data?: { state?: string; resultJson?: string; failMsg?: string }
      }
      const task = data.data
      if (!task) continue

      if (task.state === "success" && task.resultJson) {
        const url = extractUrl(task.resultJson)
        if (url) {
          cache.set(voiceId, url)
          return NextResponse.json({ url })
        }
      }
      if (task.state === "fail") {
        return NextResponse.json({ error: task.failMsg ?? "Preview failed" }, { status: 502 })
      }
    } catch {
      // transient error — retry
    }
  }

  return NextResponse.json({ error: "Preview timeout" }, { status: 504 })
}
