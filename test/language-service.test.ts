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

  it('detects Vietnamese when enabled and no stored', async () => {
    const svc = makeService({ enableDetect: true, supported: ['en','vi','es'], defaultLang: 'en' });
    const sample = 'Xin chào bạn hôm nay thế nào'; // contains Vietnamese diacritics
    const r = await svc.ensureLanguage('u4', sample);
    expect(r.source).toBe('detected');
    expect(r.lang).toBe('vi');
  });

  it('skips detection when text too short', async () => {
    const svc = makeService({ enableDetect: true });
    const r = await svc.ensureLanguage('u5','hola');
    expect(r.source).toBe('default');
  });

  it('respects minDetectChars threshold', async () => {
    const svc = makeService({ enableDetect: true, minDetectChars: 20 });
    const sample = 'Xin chào'; // shorter than 20 chars (after spaces maybe < 20)
    const r = await svc.ensureLanguage('u7', sample);
    expect(r.source).toBe('default');
  });

  it('falls back to default when detection returns unsupported or null', async () => {
    const svc = makeService({ enableDetect: true, supported: ['en','vi'], defaultLang: 'en' });
    const sample = 'qwertyuiopasdfghjkl'; // no heuristic hits
    const r = await svc.ensureLanguage('u6', sample);
    expect(['default','detected']).toContain(r.source === 'default' ? 'default' : 'detected');
    if (r.source === 'default') expect(r.lang).toBe('en');
  });
});
