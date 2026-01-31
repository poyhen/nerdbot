export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
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

  const data: any = await response.json();
  return {
    text: data.content[0].text,
    inputTokens: data.usage?.input_tokens,
    outputTokens: data.usage?.output_tokens,
  };
}

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ConversationMessage[],
): Promise<AIResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data: any = await response.json();
  return {
    text: data.choices[0].message.content,
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
      return callOpenAI(apiKey, model, systemPrompt, messages);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
