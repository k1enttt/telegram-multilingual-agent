export interface LanguageStore {
  get(userId: string): Promise<string | null>;
  set(userId: string, lang: string): Promise<void>;
  clear(userId: string): Promise<void>;
  getOrDefault(userId: string): Promise<string>;
}

export class InMemoryLanguageStore implements LanguageStore {
  private map = new Map<string, string>();
  constructor(private defaultLang: string) {}
  async get(userId: string): Promise<string | null> {
    return this.map.get(userId) || null;
  }
  async set(userId: string, lang: string): Promise<void> {
    this.map.set(userId, lang);
  }
  async clear(userId: string): Promise<void> {
    this.map.delete(userId);
  }
  async getOrDefault(userId: string): Promise<string> {
    return (await this.get(userId)) || this.defaultLang;
  }
}
