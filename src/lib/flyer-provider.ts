import { createOpenAI } from "@ai-sdk/openai";

function toByteString(s: string): string {
  return s
    .replace(/β/g, "beta")
    .replace(/α/g, "alpha")
    .replace(/μ/g, "u")
    .replace(/Δ/g, "delta")
    .replace(/γ/g, "gamma")
    .replace(/κ/g, "kappa")
    .replace(/[^\x00-\xFF]/g, "?");
}

function scanHeadersForUnicode(headers: Record<string, string>): void {
  for (const [name, value] of Object.entries(headers)) {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code > 255) {
        const start = Math.max(0, i - 30);
        const end = Math.min(value.length, i + 30);
        const context = value.slice(start, end);
        console.error("[flyer-provider] BYTESTRING VIOLATION:", {
          header: name,
          charCode: code,
          char: value[i],
          index: i,
          context: context,
        });
      }
    }
  }
}

export function getFlyerProvider() {
  const apiKey = process.env.FLYER_API_KEY;
  const baseURL = process.env.FLYER_BASE_URL?.replace(/\/$/, "");

  if (!apiKey) throw new Error("FLYER_API_KEY is not set");
  if (!baseURL) throw new Error("FLYER_BASE_URL is not set");

  return createOpenAI({
    apiKey,
    baseURL: `${baseURL}/openai`,
    headers: {
      "api-key": apiKey,
      "Authorization": `Bearer ${apiKey}`,
      "Ocp-Apim-Subscription-Key": apiKey,
    },
    fetch: async (url, options) => {
      const urlStr = url.toString();
      const modelMatch = urlStr.match(/\/chat\/completions/);
      if (modelMatch && options?.body) {
        const body = JSON.parse(options.body as string);
        const model = body.model as string;
        if (model) {
          const apiVersion =
            model === "gpt-5.5" ? "2024-12-01-preview" : "2024-10-21";

          const azureUrl = `${baseURL}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

          delete body.model;

          if (body.max_tokens !== undefined) {
            body.max_completion_tokens = body.max_tokens;
            delete body.max_tokens;
          }

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "api-key": apiKey,
            "Authorization": `Bearer ${apiKey}`,
            "Ocp-Apim-Subscription-Key": apiKey,
          };

          scanHeadersForUnicode(headers);

          console.log("[flyer-provider] calling:", {
            path: azureUrl.split("?")[0],
            model: model,
            apiVersion: apiVersion,
            hasMessages: !!(body.messages?.length),
            maxTokens: body.max_completion_tokens,
          });

          const res = await fetch(azureUrl, {
            method: options?.method ?? "POST",
            headers,
            body: JSON.stringify(body),
          });

          console.log("[flyer-provider] response:", {
            status: res.status,
            statusText: res.statusText,
            contentType: res.headers.get("content-type"),
            contentLength: res.headers.get("content-length"),
            model: model,
          });

          return res;
        }
      }
      return fetch(url, options);
    },
  });
}
