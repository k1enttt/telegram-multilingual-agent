import { describe, it, expect } from 'vitest';
import { InMemoryLanguageStore } from '../src/mastra/tools/language/language-store';
import { LanguageService, LanguageConfig } from '../src/mastra/tools/language/language-service';

function makeService(cfg?: Partial<LanguageConfig>) {
  const base: LanguageConfig = {
    defaultLang: 'en',
    supported: ['en','vi'],
    enableDetect: false,
    minDetectChars: 8,
  };
  return new LanguageService(new InMemoryLanguageStore(base.defaultLang), { ...base, ...cfg });
}

describe('LanguageService.ensureLanguage', () => {
  it('returns stored language when present', async () => {
    const svc = makeService();
    await svc.setLanguage('u1','vi');
    const r = await svc.ensureLanguage('u1','hello');
    expect(r.lang).toBe('vi');
    expect(r.source).toBe('stored');
  });

  it('falls back to default when no stored and detection disabled', async () => {
    const svc = makeService({ defaultLang: 'en', enableDetect: false });
    const r = await svc.ensureLanguage('u2','xin chao');
    expect(r.lang).toBe('en');
    expect(r.source).toBe('default');
  });

  it('does not accept unsupported language via setLanguage', async () => {
    const svc = makeService();
    await expect(svc.setLanguage('u3','fr')).rejects.toThrow(/Unsupported/);
  });
});
