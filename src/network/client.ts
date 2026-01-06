export interface ClientConfig {
  baseUrl: string;
}

export class RiftboundClient {
  constructor(private readonly config: ClientConfig) {}

  async ping(): Promise<string> {
    return `Connected to ${this.config.baseUrl}`;
  }
}
