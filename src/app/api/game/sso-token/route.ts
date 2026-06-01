import { NextRequest } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * POST/GET /api/game/sso-token
 *
 * Generates a short-lived HMAC-signed SSO token for VibeLab → VibeCode game auth bridge.
 * Token is valid for 60 seconds.
 */
export async function GET(request: NextRequest) {
  return generateSSOToken(request);
}

export async function POST(request: NextRequest) {
  return generateSSOToken(request);
}

async function generateSSOToken(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { userId, session } = authResult;

  const secret = process.env.VIBELAB_SSO_SECRET;
  if (!secret) {
    return apiError("CONFIG_ERROR", "SSO not configured", 500);
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    email: session.email || "",
    name: session.name || "",
    iat: now,
    exp: now + 60, // 60 seconds TTL
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  const token = `${payloadB64}.${signature}`;

  return apiSuccess({ token });
}
