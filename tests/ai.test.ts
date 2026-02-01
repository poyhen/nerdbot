import { test, expect, describe, afterEach, mock } from "bun:test";
import { generateResponse } from "../convex/lib/ai";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(responseBody: unknown, ok = true, status = 200) {
  const fn = mock(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(responseBody),
      text: () => Promise.resolve(JSON.stringify(responseBody)),
    } as Response),
  );
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

function getCallArgs(fn: ReturnType<typeof mock>): [string, RequestInit] {
  const call = fn.mock.calls[0];
  if (!call) throw new Error("fetch was not called");
  return call as unknown as [string, RequestInit];
}

function getCallBody(fn: ReturnType<typeof mock>) {
  const [, options] = getCallArgs(fn);
  return JSON.parse(options.body as string);
}

describe("generateResponse", () => {
  test("throws on unknown provider", async () => {
    expect(generateResponse("unknown", "key", "model", "prompt", [])).rejects.toThrow(
      "Unknown AI provider: unknown",
    );
  });

  describe("claude provider", () => {
    test("calls Anthropic API with correct URL and headers", async () => {
      const fetchMock = mockFetch({
        content: [{ text: "Hello from Claude" }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      await generateResponse(
        "claude",
        "sk-ant-test",
        "claude-sonnet-4-20250514",
        "Be helpful",
        [{ role: "user", content: "Hi" }],
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = getCallArgs(fetchMock);
      expect(url).toBe("https://api.anthropic.com/v1/messages");
      expect(options.method).toBe("POST");

      const headers = options.headers as Record<string, string>;
      expect(headers["x-api-key"]).toBe("sk-ant-test");
      expect(headers["anthropic-version"]).toBe("2023-06-01");
    });

    test("sends system prompt and messages in request body", async () => {
      const fetchMock = mockFetch({
        content: [{ text: "response" }],
        usage: {},
      });

      await generateResponse("claude", "key", "model", "You are a bot", [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ]);

      const body = getCallBody(fetchMock);
      expect(body.system).toBe("You are a bot");
      expect(body.model).toBe("model");
      expect(body.max_tokens).toBe(1024);
      expect(body.messages).toEqual([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ]);
    });

    test("returns parsed response with token counts", async () => {
      mockFetch({
        content: [{ text: "Hello!" }],
        usage: { input_tokens: 15, output_tokens: 3 },
      });

      const result = await generateResponse("claude", "key", "model", "prompt", [
        { role: "user", content: "Hi" },
      ]);

      expect(result.text).toBe("Hello!");
      expect(result.inputTokens).toBe(15);
      expect(result.outputTokens).toBe(3);
    });

    test("throws on API error", async () => {
      mockFetch({ error: "rate limited" }, false, 429);

      expect(
        generateResponse("claude", "key", "model", "prompt", [
          { role: "user", content: "Hi" },
        ]),
      ).rejects.toThrow("Claude API error: 429");
    });
  });

  describe("moonshot provider", () => {
    test("calls Moonshot API URL", async () => {
      const fetchMock = mockFetch({
        choices: [{ message: { content: "Hello from Kimi" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });

      await generateResponse("moonshot", "msk-test", "kimi-k2-0711-preview", "prompt", [
        { role: "user", content: "Hi" },
      ]);

      const [url] = getCallArgs(fetchMock);
      expect(url).toBe("https://api.moonshot.ai/v1/chat/completions");
    });

    test("sends Bearer auth header", async () => {
      const fetchMock = mockFetch({
        choices: [{ message: { content: "response" } }],
        usage: {},
      });

      await generateResponse("moonshot", "msk-test", "model", "prompt", [
        { role: "user", content: "Hi" },
      ]);

      const [, options] = getCallArgs(fetchMock);
      const headers = options.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer msk-test");
    });

    test("includes system message in messages array", async () => {
      const fetchMock = mockFetch({
        choices: [{ message: { content: "response" } }],
        usage: {},
      });

      await generateResponse("moonshot", "key", "model", "Be nerdbot", [
        { role: "user", content: "Hello" },
      ]);

      const body = getCallBody(fetchMock);
      expect(body.messages[0]).toEqual({ role: "system", content: "Be nerdbot" });
      expect(body.messages[1]).toEqual({ role: "user", content: "Hello" });
    });

    test("returns parsed OpenAI-format response", async () => {
      mockFetch({
        choices: [{ message: { content: "Kimi says hi" } }],
        usage: { prompt_tokens: 20, completion_tokens: 8 },
      });

      const result = await generateResponse("moonshot", "key", "model", "prompt", [
        { role: "user", content: "Hi" },
      ]);

      expect(result.text).toBe("Kimi says hi");
      expect(result.inputTokens).toBe(20);
      expect(result.outputTokens).toBe(8);
    });

    test("throws on API error with provider name", async () => {
      mockFetch({ error: "bad request" }, false, 400);

      expect(
        generateResponse("moonshot", "key", "model", "prompt", [
          { role: "user", content: "Hi" },
        ]),
      ).rejects.toThrow("moonshot API error: 400");
    });
  });

  describe("openai provider", () => {
    test("calls OpenAI API URL", async () => {
      const fetchMock = mockFetch({
        choices: [{ message: { content: "Hello from GPT" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });

      await generateResponse("openai", "sk-test", "gpt-4o", "prompt", [
        { role: "user", content: "Hi" },
      ]);

      const [url] = getCallArgs(fetchMock);
      expect(url).toBe("https://api.openai.com/v1/chat/completions");
    });
  });
});
