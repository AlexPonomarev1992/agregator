import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api/response";

/**
 * POST /api/game/auth
 *
 * Direct email+password authentication for the game.
 * Validates credentials against VibeLab's Better Auth,
 * then returns an SSO token the game can use.
 *
 * Body: { email: string, password: string }
 * Returns: { data: { token: string, user: { id, email, name } } }
 */
export async function POST(request: NextRequest) {
  const secret = process.env.VIBELAB_SSO_SECRET;
  if (!secret) {
    return apiError("CONFIG_ERROR", "SSO not configured", 500);
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON", 400);
  }

  const { email, password } = body;
  if (!email || !password) {
    return apiError("VALIDATION_ERROR", "Email and password are required", 400);
  }

  try {
    // Authenticate via Better Auth's internal API
    const signInResponse = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!signInResponse?.user) {
      return apiError("UNAUTHORIZED", "Invalid email or password", 401);
    }

    const user = signInResponse.user;

    // Generate SSO token
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      email: user.email || "",
      name: user.name || "",
      iat: now,
      exp: now + 60,
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payloadB64)
      .digest("base64url");

    const token = `${payloadB64}.${signature}`;

    return NextResponse.json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    // Better Auth throws on invalid credentials
    if (message.includes("INVALID") || message.includes("invalid")) {
      return apiError("UNAUTHORIZED", "Invalid email or password", 401);
    }
    console.error("[game/auth] Error:", err);
    return apiError("INTERNAL_ERROR", "Authentication failed", 500);
  }
}
