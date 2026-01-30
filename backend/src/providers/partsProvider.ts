import { PartPayload } from '../types/dto';
import { env } from '../config/env';

export interface PartsProvider {
  name: string;
  isConfigured(): boolean;
  fetchParts(): Promise<PartPayload[]>;
}

class PlaceholderPartsProvider implements PartsProvider {
  name = 'placeholder';

  isConfigured() {
    return Boolean(env.externalPartsProvider);
  }

  async fetchParts(): Promise<PartPayload[]> {
    if (!this.isConfigured()) {
      return [];
    }

    // Espaço reservado para integrar APIs externas reais.
    return [];
  }
}

export const partsProvider = new PlaceholderPartsProvider();
