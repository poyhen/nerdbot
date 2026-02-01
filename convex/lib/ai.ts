export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

interface ClaudeAPIResponse {
  content: { text: string }[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

interface OpenAIAPIResponse {
  choices: { message: { content: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

async function callClaude(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ConversationMessage[],
): Promise<AIResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as ClaudeAPIResponse;
  const text = data.content[0]?.text ?? "";
  return {
    text,
    inputTokens: data.usage?.input_tokens,
    outputTokens: data.usage?.output_tokens,
  };
}

const OPENAI_COMPATIBLE_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  moonshot: "https://api.moonshot.ai/v1/chat/completions",
};

async function callOpenAICompatible(
  provider: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ConversationMessage[],
): Promise<AIResponse> {
  const url = OPENAI_COMPATIBLE_ENDPOINTS[provider];
  if (!url) {
    throw new Error(`No endpoint configured for provider: ${provider}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${provider} API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as OpenAIAPIResponse;
  const text = data.choices[0]?.message.content ?? "";
  return {
    text,
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
  };
}

export async function generateResponse(
  provider: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ConversationMessage[],
): Promise<AIResponse> {
  switch (provider) {
    case "claude":
      return callClaude(apiKey, model, systemPrompt, messages);
    case "openai":
    case "moonshot":
      return callOpenAICompatible(provider, apiKey, model, systemPrompt, messages);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
