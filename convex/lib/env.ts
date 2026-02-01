export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export type ThinkingMode = "disabled" | "enabled" | "auto";

export function readOptionalThinkingEnv(name: string): ThinkingMode | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "disabled" || normalized === "enabled" || normalized === "auto") {
    return normalized;
  }

  throw new Error(
    `Invalid value for environment variable: ${name}. Expected disabled, enabled, or auto.`,
  );
}
