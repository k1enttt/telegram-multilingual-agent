import { LanguageConfig } from './language-service';

function parseSupported(raw: string, defaultLang: string): string[] {
  const list = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!list.includes(defaultLang)) list.unshift(defaultLang);
  // ensure uniqueness
  return Array.from(new Set(list));
}

export function loadLanguageConfig(env: NodeJS.ProcessEnv = process.env): LanguageConfig {
  const defaultLang = (env.DEFAULT_LANG || 'en').trim().toLowerCase();
  const supportedRaw = env.SUPPORTED_LANGS || `${defaultLang},vi`;
  const supported = parseSupported(supportedRaw, defaultLang);
  const enableDetect = env.ENABLE_LANG_DETECTION === '1';
  const minDetectChars = parseInt(env.LANG_MIN_DETECT_CHARS || '8', 10);
  return { defaultLang, supported, enableDetect, minDetectChars };
}
