import { createOpenAI } from "@ai-sdk/openai";

export function getFlyerProvider() {
  const apiKey = process.env.FLYER_API_KEY;
  const baseURL = process.env.FLYER_BASE_URL?.replace(/\/$/, "");

  if (!apiKey) throw new Error("FLYER_API_KEY is not set");
  if (!baseURL) throw new Error("FLYER_BASE_URL is not set");

  // FlyerGPT uses Azure OpenAI path format:
  //   {baseURL}/openai/deployments/{model}/chat/completions?api-version=2024-10-21
  return createOpenAI({
    apiKey,
    baseURL: `${baseURL}/openai`,
    headers: {
      "api-key": apiKey,
    },
    fetch: async (url, options) => {
      // Transform OpenAI-style URL into Azure-style URL with deployment in path
      // and api-version query param
      const urlStr = url.toString();
      const modelMatch = urlStr.match(/\/chat\/completions/);
      if (modelMatch && options?.body) {
        const body = JSON.parse(options.body as string);
        const model = body.model;
        if (model) {
          const azureUrl = `${baseURL}/openai/deployments/${model}/chat/completions?api-version=2024-10-21`;
          // Remove model from body (Azure puts it in path)
          delete body.model;
          // Azure uses max_completion_tokens, not max_tokens
          if (body.max_tokens !== undefined) {
            body.max_completion_tokens = body.max_tokens;
            delete body.max_tokens;
          }
          return fetch(azureUrl, {
            ...options,
            body: JSON.stringify(body),
          });
        }
      }
      return fetch(url, options);
    },
  });
}
