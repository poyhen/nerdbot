import { test, expect, afterEach } from "bun:test";
import { requireEnv } from "../../convex/lib/env";

afterEach(() => {
  delete process.env.TEST_ENV_VAR;
});

test("requireEnv returns value when set", () => {
  process.env.TEST_ENV_VAR = "hello";
  expect(requireEnv("TEST_ENV_VAR")).toBe("hello");
});

test("requireEnv throws when variable is missing", () => {
  expect(() => requireEnv("NONEXISTENT_VAR_12345")).toThrow(
    "Missing required environment variable: NONEXISTENT_VAR_12345",
  );
});

test("requireEnv throws when variable is empty string", () => {
  process.env.TEST_ENV_VAR = "";
  expect(() => requireEnv("TEST_ENV_VAR")).toThrow(
    "Missing required environment variable: TEST_ENV_VAR",
  );
});
