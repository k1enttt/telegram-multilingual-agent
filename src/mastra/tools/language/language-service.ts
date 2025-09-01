import { LanguageStore } from './language-store';

/**
 * Cấu hình ngôn ngữ vận hành cho hệ thống lưu / phát hiện ngôn ngữ.
 *
 * - defaultLang: Ngôn ngữ mặc định khi chưa có lưu & không detect được.
 * - supported: Danh sách mã ngôn ngữ hợp lệ (ưu tiên theo thứ tự xuất hiện).
 * - enableDetect: Bật / tắt cơ chế detect heuristic.
 * - minDetectChars: Ngưỡng tối thiểu độ dài văn bản để thử detect.
 */

export interface LanguageConfig {
  defaultLang: string;
  supported: string[];
  enableDetect: boolean;
  minDetectChars: number;
}

/**
 * Nguồn xác định ngôn ngữ cuối cùng:
 * - stored: đã có trong store (đã đặt trước đó).
 * - detected: detect heuristic vừa xác định và đã lưu.
 * - default: fallback về ngôn ngữ mặc định.
 */
export type EnsureLanguageSource = 'stored' | 'detected' | 'default';

/**
 * LanguageService chịu trách nhiệm:
 * 1. Quản lý CRUD ngôn ngữ người dùng qua LanguageStore.
 * 2. Đảm bảo lấy được ngôn ngữ (stored / detected / default) qua ensureLanguage.
 * 3. Thực hiện detect heuristic nội bộ nếu được bật.
 */
export class LanguageService {
  constructor(private store: LanguageStore, private config: LanguageConfig) {}

  /** Trả về danh sách ngôn ngữ hỗ trợ. */
  listSupported() { return this.config.supported; }
  /** Kiểm tra mã lang có nằm trong danh sách hỗ trợ hay không. */
  isSupported(lang: string) { return this.config.supported.includes(lang); }

  /** Lấy ngôn ngữ đã lưu (hoặc null nếu chưa tồn tại). */
  async getLanguage(userId: string) { return this.store.get(userId); }

  /**
   * Lưu ngôn ngữ cho user sau khi chuẩn hoá & validate.
   * @throws Error nếu ngôn ngữ không nằm trong supported.
   */
  async setLanguage(userId: string, lang: string) {
    const norm = this.normalize(lang);
    if(!this.isSupported(norm)) throw new Error(`Unsupported language: ${lang}`);
    await this.store.set(userId, norm);
  }

  /**
   * Đảm bảo trả về ngôn ngữ dùng cho phiên hiện tại theo thứ tự ưu tiên:
   * 1. stored (đã lưu)
   * 2. detected (nếu bật detect & sampleText đạt ngưỡng & heuristic match)
   * 3. default (fallback)
   * Đồng thời log JSON structured các sự kiện (detected / detect_miss / fallback_default).
   */
  async ensureLanguage(userId: string, sampleText?: string): Promise<{ lang: string; source: EnsureLanguageSource; }> {
    const stored = await this.store.get(userId);
    if (stored) return { lang: stored, source: 'stored' };

    if (this.config.enableDetect) {
      if (!sampleText || sampleText.length === 0) {
        // skip: no sample
      } else if (sampleText.length < this.config.minDetectChars) {
        // skip: length below threshold
        // console.debug could be used; keep minimal noise
      } else {
        const detected = await this.detect(sampleText);
        if (detected && this.isSupported(detected)) {
          await this.store.set(userId, detected);
          // structured log
          console.log(JSON.stringify({
            component: 'language',
            event: 'detected',
            userId,
            lang: detected,
            source: 'detected'
          }));
          return { lang: detected, source: 'detected' };
        } else {
          console.log(JSON.stringify({
            component: 'language',
            event: 'detect_miss',
            userId,
            reason: detected ? 'unsupported_detected' : 'no_match'
          }));
        }
      }
    }
    // fallback
    console.log(JSON.stringify({
      component: 'language',
      event: 'fallback_default',
      userId,
      defaultLang: this.config.defaultLang
    }));
    return { lang: this.config.defaultLang, source: 'default' };
  }

  /**
   * Heuristic detect ngôn ngữ từ đoạn text:
   * - Dựa trên regex ký tự đặc trưng / từ khoá phổ biến mỗi ngôn ngữ.
   * - Duyệt theo thứ tự mảng supported để ưu tiên.
   * - Trả về mã ngôn ngữ hoặc null nếu không khớp.
   * Lưu ý: nhẹ, không đảm bảo chính xác tuyệt đối; dùng cho bootstrap ban đầu.
   */
  async detect(_text: string): Promise<string | null> {
    // Strategy: check for language-specific diacritics / characters.
    // Order of checks follows supported list priority.
    const text = _text.toLowerCase();
    const hasAny = (r: RegExp) => r.test(text);
    const heuristics: Record<string, RegExp[]> = {
      vi: [
        /[ăâđêôơưàảãạáằắẳẵặầấẩẫậèéẻẽẹềếểễệòóỏõọồốổỗộờớởỡợùúủũụừứửữựìíỉĩịỳýỷỹỵ]/,
        /tieng\s*viet/,
        /việt\s*nam/,
      ],
      es: [/ñ/, /[áéíóúü]/, /\b(el|la|los|las|una|un)\b/],
      fr: [/ç/, /[àâæçéèêëîïôœùûüÿ]/, /\b(le|la|les|une|un|des)\b/],
      en: [/\b(the|and|you|for|with)\b/, /english/],
    };

    // Evaluate supported languages (excluding default fallback heuristics last)
    for (const lang of this.config.supported) {
      const patterns = heuristics[lang];
      if (!patterns) continue;
      if (patterns.some(p => hasAny(p))) return lang;
    }
    return null;
  }

  /** Chuẩn hoá mã ngôn ngữ (trim + lowercase). */
  private normalize(lang: string) {
    return lang.trim().toLowerCase();
  }
}
