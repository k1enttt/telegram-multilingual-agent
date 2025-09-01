import { LanguageStore } from './language-store';

export interface LanguageConfig {
  defaultLang: string;
  supported: string[];
  enableDetect: boolean;
  minDetectChars: number;
}

export type EnsureLanguageSource = 'stored' | 'detected' | 'default';

export class LanguageService {
  constructor(private store: LanguageStore, private config: LanguageConfig) {}

  listSupported() { return this.config.supported; }
  isSupported(lang: string) { return this.config.supported.includes(lang); }

  async getLanguage(userId: string) { return this.store.get(userId); }

  async setLanguage(userId: string, lang: string) {
    const norm = this.normalize(lang);
    if(!this.isSupported(norm)) throw new Error(`Unsupported language: ${lang}`);
    await this.store.set(userId, norm);
  }

  async ensureLanguage(userId: string, sampleText?: string): Promise<{ lang: string; source: EnsureLanguageSource; }> {
    const stored = await this.store.get(userId);
    if (stored) return { lang: stored, source: 'stored' };

    if (this.config.enableDetect && sampleText && sampleText.length >= this.config.minDetectChars) {
      const detected = await this.detect(sampleText);
      if (detected && this.isSupported(detected)) {
        await this.store.set(userId, detected);
        return { lang: detected, source: 'detected' };
      }
    }
    // fallback
    return { lang: this.config.defaultLang, source: 'default' };
  }

  async detect(_text: string): Promise<string | null> {
    // Phase 1: detection disabled (stub)
    return null;
  }

  private normalize(lang: string) {
    return lang.trim().toLowerCase();
  }
}
