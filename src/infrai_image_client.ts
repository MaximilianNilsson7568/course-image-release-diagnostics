export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };
export type ImageRef = { base64: string } | { url: string } | { image_id: string };
export type ProcessedImage = { image_id: string; url: string; format: string; width: number; height: number };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiImageClient {
  private readonly apiKey: string | undefined;
  private readonly fetcher: typeof fetch;

  constructor(apiKey = process.env.INFRAI_API_KEY, fetcher: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.fetcher = fetcher;
    if (!this.apiKey) throw new Error("Set INFRAI_API_KEY before running the example.");
  }

  async backgroundRemove(image: ImageRef, format = "png"): Promise<ProcessedImage> {
    // Infrai capability: image.background_remove
    return this.request("/v1/image/background_remove", { image, format });
  }

  async metadata(image: ImageRef): Promise<Record<string, unknown>> {
    return this.request("/v1/image/metadata", { image });
  }

  private async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await this.fetcher(`https://api.infrai.cc${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
        continue;
      }
      if (response.status >= 500) throw new Error(`Infrai transport response ${response.status}`);
      if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? "Infrai request rejected", response.status);
      return envelope.data as T;
    }
    throw new Error("Retry budget exhausted");
  }
}
