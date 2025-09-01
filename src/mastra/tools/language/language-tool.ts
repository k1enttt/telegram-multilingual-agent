import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { InMemoryLanguageStore } from './language-store';
import { LanguageService } from './language-service';
import { loadLanguageConfig } from './language-config';

// Singleton service instance (in-memory for now)
const cfg = loadLanguageConfig();
const languageService = new LanguageService(new InMemoryLanguageStore(cfg.defaultLang), cfg);

/**
 * languageTool
 * Lets the agent ensure or change the user's preferred language.
 * Usage patterns (model instructions should encourage these):
 * 1. At start of a conversation (no targetLang) pass sampleText to auto-detect or fallback.
 * 2. When user explicitly asks to switch language (provide targetLang = ISO code e.g. 'vi', 'es').
 */
export const languageTool = createTool({
  id: 'language-tool',
  description: 'Ensure or switch the user\'s preferred language. Provide targetLang to force a change or sampleText to auto-detect.',
  inputSchema: z.object({
    userId: z.string().describe('Unique user identifier'),
    targetLang: z.string().optional().describe('Desired language code to set (e.g. en, vi, es, fr). Must be supported.'),
    sampleText: z.string().optional().describe('Recent user text for auto-detection if no targetLang provided.'),
  }),
  outputSchema: z.object({
    lang: z.string(),
    source: z.enum(['stored','detected','default','forced']),
    systemPrompt: z.string(),
    supported: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { userId, targetLang, sampleText } = context as { userId: string; targetLang?: string; sampleText?: string };

    if (targetLang) {
      await languageService.setLanguage(userId, targetLang);
      const lang = (await languageService.getLanguage(userId)) || cfg.defaultLang;
      const systemPrompt = `Respond ONLY in ${lang}.`;
      return { lang, source: 'forced' as const, systemPrompt, supported: languageService.listSupported() };
    }

    const ensured = await languageService.ensureLanguage(userId, sampleText);
    const systemPrompt = `Respond ONLY in ${ensured.lang}.`;
    return { ...ensured, systemPrompt, supported: languageService.listSupported() };
  },
});

export { languageService as sharedLanguageService };