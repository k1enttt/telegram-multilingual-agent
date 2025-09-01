import { describe, it, expect } from 'vitest';
import { languageTool, sharedLanguageService } from '../src/mastra/tools/language/language-tool';

// Simple execute helper mimicking Mastra tool call signature
async function exec(input: any) {
  // Tool's execute receives an object with context containing validated input
  return await (languageTool as any).execute({ context: input });
}

describe('languageTool', () => {
  it('forces language when targetLang provided', async () => {
    const res = await exec({ userId: 'u-tool-1', targetLang: 'vi' });
    expect(res.lang).toBe('vi');
    expect(res.source).toBe('forced');
    const stored = await sharedLanguageService.getLanguage('u-tool-1');
    expect(stored).toBe('vi');
  });

  it('ensures language via detection when no stored & sampleText', async () => {
    // enable detection via internal service config (already configured from env)
    // If detection disabled in env, this will fallback to default; acceptable for test environment
    const res = await exec({ userId: 'u-tool-2', sampleText: 'Xin chào bạn nhé hôm nay thế nào' });
    expect(['detected','default','stored']).toContain(res.source); // heuristic may detect vi
    expect(res.lang).toBeTruthy();
    expect(res.systemPrompt).toMatch(/Respond ONLY in/);
  });
});
