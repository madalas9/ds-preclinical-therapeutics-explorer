import { createOpenAI } from "@ai-sdk/openai";

export function getFlyerProvider() {
  const apiKey = process.env.FLYER_API_KEY;
  const baseURL = process.env.FLYER_BASE_URL?.replace(/\/$/, "");

  if (!apiKey) throw new Error("FLYER_API_KEY is not set");
  if (!baseURL) throw new Error("FLYER_BASE_URL is not set");

  // FlyerGPT uses Azure OpenAI path format:
  //   {baseURL}/openai/deployments/{model}/chat/completions?api-version=...
  return createOpenAI({
    apiKey,
    baseURL: `${baseURL}/openai`,
    headers: {
      "api-key": apiKey,
      "Authorization": `Bearer ${apiKey}`,
      "Ocp-Apim-Subscription-Key": apiKey,
    },
    fetch: async (url, options) => {
      // Transform OpenAI-style URL into Azure-style URL with deployment in path
      const urlStr = url.toString();
      const modelMatch = urlStr.match(/\/chat\/completions/);
      if (modelMatch && options?.body) {
        const body = JSON.parse(options.body as string);
        const model = body.model as string;
        if (model) {
          // Use model-specific api-version
          const apiVersion = model === "gpt-5.5"
            ? "2024-12-01-preview"
            : "2024-10-21";

          const azureUrl = `${baseURL}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

          // Remove model from body (Azure puts it in path)
          delete body.model;

          // Azure uses max_completion_tokens, not max_tokens
          if (body.max_tokens !== undefined) {
            body.max_completion_tokens = body.max_tokens;
            delete body.max_tokens;
          }

          // All three auth headers for APIM compatibility
          const headers = {
            ...(options.headers as Record<string, string>),
            "Content-Type": "application/json",
            "api-key": apiKey,
            "Authorization": `Bearer ${apiKey}`,
            "Ocp-Apim-Subscription-Key": apiKey,
          };

          console.log("[flyer-provider] calling:", {
            path: azureUrl.split("?")[0],
            model: model,
            apiVersion: apiVersion,
            hasMessages: !!(body.messages?.length),
            maxTokens: body.max_completion_tokens,
          });

          const res = await fetch(azureUrl, {
            ...options,
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
