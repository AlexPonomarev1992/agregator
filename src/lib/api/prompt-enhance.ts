/**
 * Prompt enhancement for AI generation models.
 * Translates to English, adds model-specific cinematic/photographic terms.
 * Uses LLM (OpenRouter/Anthropic) for intelligent rewriting.
 * Falls back to rule-based enhancement if no LLM key is available.
 */

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

// Model-specific system prompts for enhancement
const VIDEO_SYSTEM_PROMPTS: Record<string, string> = {
  "kling-3.0": `You are a cinematic prompt engineer for Kling 3.0 video AI.
Rewrite the user's prompt into this structure:
Scene: [environment, lighting, time of day, atmosphere]
Character: [appearance, clothing, key details] (if applicable)
Action: [specific movement anchored to objects, facial expressions]
Camera: [shot type, camera movement, speed — use terms like dolly push, tracking shot, crane, whip-pan, snap focus]
Style: [cinematic style, mood]

Rules:
- Write in English only
- Keep the user's original intent — don't add characters or objects they didn't ask for
- Anchor all body movements to objects (not "waves hands" but "fingers grip the edge of the wooden table")
- Use professional cinematography terms
- Keep it to ONE scene, 2-4 sentences
- Output ONLY the enhanced prompt, no explanations`,

  "kling-3": `You are a cinematic prompt engineer for Kling 2.6 video AI.
Rewrite the user's prompt using this formula: Subject (visual details) + Action (precise movement) + Context (environment, 3-5 elements) + Style (camera, lighting, mood).
Rules:
- English only
- Keep original intent
- Add camera specs: "Shot on virtual anamorphic lens, 24mm"
- Use subtle detail terms: "slight smile forming", "eyes glistening"
- Max 2-4 key ideas per prompt
- Output ONLY the enhanced prompt`,

  "hailuo-02": `You are a prompt engineer for Hailuo/MiniMax 02 video AI.
Rewrite the user's prompt in this format:
[Camera Shot + Motion]. [Subject + Description]. [Action]. [Scene + Description]. [Lighting]. [Style/Mood].

Rules:
- English only, keep original intent
- Use [bracket] syntax for camera commands: [slow dolly in], [tracking shot], [crane up]
- Use ((double parentheses)) for priority elements
- Keep prompts clean and concise — max 6-10 seconds of action
- Max 3 camera commands
- Avoid fast hand movements or sharp head turns
- Output ONLY the enhanced prompt`,

  "wan-2.6": `You are a prompt engineer for Wan 2.6 (Alibaba) video AI.
Rewrite the user's prompt in format: Subject + Action + Environment + Lighting + Style + Camera.

Rules:
- English only, keep original intent
- Use professional cinematography terms (dolly, pan, tilt, crane — NOT "camera moves closer")
- Keep under 800 characters
- Add atmosphere details (weather, lighting, color palette)
- Output ONLY the enhanced prompt`,
};

const PHOTO_SYSTEM_PROMPTS: Record<string, string> = {
  "nanobanana": `You are a prompt engineer for Google Nano Banana image AI.
Rewrite the user's prompt using 7 components:
Subject (who/what, age, appearance) + Action + Environment (location, time, weather) + Camera (angle, lens, depth of field) + Lighting (type, direction, temperature) + Style (photographic/illustrative) + Exclusions (no text, no watermark).

Rules:
- English only, keep original intent
- Write like a creative director's brief, NOT tag soup
- Add real camera/lens references: "shot on Fujifilm XT4, 35mm lens, f/2.8"
- Use positive framing: "empty street" not "no cars"
- Always end with "No text, no words, no letters" unless text is requested
- 30-80 words optimal
- Output ONLY the enhanced prompt`,

  "nanobanana-2": `You are a prompt engineer for Google Nano Banana 2 image AI.
Same rules as Nano Banana — write as a creative director's brief:
Subject + Action + Environment + Camera (real lens specs) + Lighting + Style + Exclusions.
30-80 words. English only. Keep user's intent. Always add "No text, no watermark" at the end.
Output ONLY the enhanced prompt.`,

  "ideogram": `You are a prompt engineer for Ideogram v3 image AI (best for text rendering).
Rewrite the user's prompt as a short creative brief:
[Scene/subject description]
[ONE strong style term — e.g., "Retro screen print", "editorial product photo"]
[If text is needed: "TEXT" in quotes + placement + font style description]

Rules:
- English only, keep original intent
- Any text to render MUST be in quotes, specify: caps/lowercase, position, font style
- Max 7 words for rendered text (split longer text into lines)
- ONE style term, don't mix (not "cinematic watercolor blueprint neon")
- Max 150 words
- Output ONLY the enhanced prompt`,

  "imagen4": `You are a prompt engineer for Google Imagen 4 image AI.
Use the SCULPT framework:
S — Subject (main object/character)
C — Context (where/how it appears)
U — Use (purpose of the image)
L — Look (style/mood)
P — Photographic choices (camera, lens, aperture, depth of field)
T — Technical (aspect ratio, exclusions)

Rules:
- Start with "A photo of..." for photorealism
- English only, keep original intent
- Add technical camera specs: "85mm lens, f/1.8, shallow depth of field"
- Specify lighting: "golden hour", "Rembrandt lighting", "soft window light"
- Remove irrelevant details — clarity over quantity
- Output ONLY the enhanced prompt`,

  "grok-image": `You are a prompt engineer for Grok Imagine (xAI, FLUX architecture).
Rewrite as a scene description in natural language (NOT tag lists):
One sentence describing the scene and subject + one sentence for style/mood/camera.

Rules:
- English only, scene-first approach
- Specific emotions: "nostalgic", "melancholic" not "happy", "cool"
- Specific colors: "electric blue and hot pink" not "colorful"
- Camera references: "shot on Fujifilm XT4" instead of "high quality"
- Max 2-3 main elements, don't overcrowd
- Positive constraints only: "sharp focus" not "no blur"
- Keep short — priority is in the first sentence
- Output ONLY the enhanced prompt`,
};

// Fallback video model key
const DEFAULT_VIDEO_KEY = "kling-3";
const DEFAULT_PHOTO_KEY = "nanobanana";

function getSystemPrompt(modelId: string, type: "video" | "photo"): string {
  if (type === "video") {
    return VIDEO_SYSTEM_PROMPTS[modelId] ?? VIDEO_SYSTEM_PROMPTS[DEFAULT_VIDEO_KEY]!;
  }
  return PHOTO_SYSTEM_PROMPTS[modelId] ?? PHOTO_SYSTEM_PROMPTS[DEFAULT_PHOTO_KEY]!;
}

const REF_IMAGE_ADDENDUM = `

IMPORTANT: The user has attached a REFERENCE IMAGE. Rules:
- Do NOT invent or describe the person's appearance (age, build, hair, skin, clothing) — the model will take it from the reference image
- Use phrases like "the person from the reference image" or just describe the ACTION and SCENE, not the subject's looks
- Focus on: environment, lighting, camera, style, mood, pose/action
- If the user says "this person" or "make them" — they mean the person in the reference image, keep it abstract`;

/**
 * Enhance a user prompt via LLM before sending to generation API.
 * Returns enhanced English prompt optimized for the target model.
 */
export async function enhancePrompt(
  userPrompt: string,
  type: "video" | "photo",
  modelId?: string,
  hasReferenceImage?: boolean
): Promise<string> {
  let systemPrompt = getSystemPrompt(modelId ?? type, type);

  if (hasReferenceImage) {
    systemPrompt += REF_IMAGE_ADDENDUM;
  }

  // Try LLM enhancement
  const enhanced = await callLLM(systemPrompt, userPrompt);
  if (enhanced) return enhanced;

  // Fallback: basic rule-based enhancement
  return fallbackEnhance(userPrompt, type);
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string | null> {
  // Try OpenRouter first (cheapest), then Anthropic
  if (OPENROUTER_KEY) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          console.log(`[prompt-enhance] LLM enhanced: "${userPrompt.slice(0, 40)}..." → "${text.slice(0, 60)}..."`);
          return text;
        }
      }
    } catch (err) {
      console.error("[prompt-enhance] OpenRouter error:", err);
    }
  }

  if (ANTHROPIC_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text?.trim();
        if (text) {
          console.log(`[prompt-enhance] Anthropic enhanced: "${userPrompt.slice(0, 40)}..." → "${text.slice(0, 60)}..."`);
          return text;
        }
      }
    } catch (err) {
      console.error("[prompt-enhance] Anthropic error:", err);
    }
  }

  return null;
}

/** Rule-based fallback when no LLM available */
function fallbackEnhance(prompt: string, type: "video" | "photo"): string {
  // Basic quality suffixes
  const videoSuffix = ", cinematic lighting, smooth camera movement, high quality, detailed";
  const photoSuffix = ", professional photography, sharp focus, natural lighting, high resolution, no text, no watermark";

  return `${prompt.trim()}${type === "video" ? videoSuffix : photoSuffix}`;
}
