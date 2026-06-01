/**
 * Environment variable validation utility.
 * Validates required environment variables at import time —
 * the app will throw at startup if any critical variable is missing.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Validate critical env vars — will throw at startup if missing
export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  BETTER_AUTH_SECRET: requireEnv("BETTER_AUTH_SECRET"),
} as const;
