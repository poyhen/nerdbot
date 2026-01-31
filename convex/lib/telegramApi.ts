const BASE_URL = "https://api.telegram.org/bot";

export async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  options?: {
    replyToMessageId?: number;
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  },
): Promise<any> {
  const url = `${BASE_URL}${token}/sendMessage`;

  const body: Record<string, any> = {
    chat_id: chatId,
    text: text,
  };

  if (options?.replyToMessageId) {
    body.reply_parameters = {
      message_id: options.replyToMessageId,
    };
  }

  if (options?.parseMode) {
    body.parse_mode = options.parseMode;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function sendChatAction(
  token: string,
  chatId: number,
  action: "typing" | "upload_document" = "typing",
): Promise<void> {
  const url = `${BASE_URL}${token}/sendChatAction`;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      action,
    }),
  });
}

export async function setWebhook(
  token: string,
  webhookUrl: string,
  secret: string,
): Promise<any> {
  const url = `${BASE_URL}${token}/setWebhook`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message"],
      max_connections: 40,
    }),
  });

  return response.json();
}
