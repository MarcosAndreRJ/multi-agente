import { config } from "../config.js";

interface OllamaResponse {
  response: string;
}

export class OllamaClient {
  async generate(system: string, prompt: string, onChunk?: (chunk: string) => void, model?: string): Promise<string> {
    const response = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || config.ollamaModel,
        system,
        prompt,
        stream: !!onChunk
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    if (!onChunk) {
      const data = (await response.json()) as OllamaResponse;
      return data.response?.trim() ?? "";
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as OllamaResponse;
          if (parsed.response) {
            fullText += parsed.response;
            onChunk(parsed.response);
          }
        } catch (e) {}
      }
    }
    return fullText.trim();
  }
}
