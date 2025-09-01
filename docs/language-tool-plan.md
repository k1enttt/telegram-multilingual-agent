# Kế hoạch phát triển Language State Tool (đã bỏ lệnh /lang)

## 1. Mục tiêu & Phạm vi
- Lưu và truy xuất ngôn ngữ hiện tại theo user (userId/chatId).
- Tự động chèn ngôn ngữ vào context agent trước khi gọi LLM.
- Không hỗ trợ lệnh đổi ngôn ngữ (/lang) ở giai đoạn này.
- Tùy chọn: tự động detect ngôn ngữ nếu bật cờ cấu hình.
- Kiến trúc mở để thay backend lưu trữ (in-memory -> Redis/DB).

## 2. API (Contract)
### LanguageStore
```ts
interface LanguageStore {
  get(userId: string): Promise<string | null>;
  set(userId: string, lang: string): Promise<void>;
  clear(userId: string): Promise<void>;
  getOrDefault(userId: string): Promise<string>; // dùng DEFAULT_LANG nếu chưa có
}
```
### LanguageService
```ts
class LanguageService {
  constructor(store: LanguageStore, config: LanguageConfig) {}
  getLanguage(userId: string): Promise<string | null>;
  setLanguage(userId: string, lang: string): Promise<void>; // internal / future UI
  ensureLanguage(userId: string, sampleText?: string): Promise<{ lang: string; source: 'stored' | 'detected' | 'default' }>;
  listSupported(): string[];
  isSupported(lang: string): boolean;
  // detect only if ENABLE_LANG_DETECTION=1
  detect(text: string): Promise<string | null>;
}
```
### Config
```ts
interface LanguageConfig {
  defaultLang: string; // DEFAULT_LANG
  supported: string[]; // SUPPORTED_LANGS
  enableDetect: boolean; // ENABLE_LANG_DETECTION
  minDetectChars: number; // ví dụ 8
}
```

## 3. Lưu trữ
- Phase 1: In-memory `Map<string,string>`.
- Phase 2: Adapter (Redis / SQLite / Postgres) qua cùng interface.

## 4. Kiến trúc & Vị trí
```
src/mastra/tools/language/
  language-store.ts        // interface + in-memory impl
  language-service.ts      // logic ensure + detection hook
  language-tool.ts         // (optional) expose cho agent nếu cần như 1 tool
  index.ts                 // re-export
```

## 5. Tích hợp TelegramIntegration
Flow:
1. Nhận message.
2. Gọi `languageService.ensureLanguage(userId, text)`.
3. Nhận `{ lang, source }`.
4. Push system context: `Respond ONLY in <lang>.` (kèm note nếu source=detected?).
5. Gọi agent.stream như hiện tại.

## 6. Chiến lược xác định ngôn ngữ
Priority:
1. Stored
2. Detect (nếu bật, đủ độ dài)
3. Default

## 7. Validation
- Chuẩn hóa: trim, lower-case.
- Regex: `^[a-z]{2,5}(-[A-Z]{2})?$` (ví dụ en, vi, en-US).
- Chỉ nhận giá trị có trong supported.

## 8. Fallback & Edge Cases
- Empty text: bỏ qua detect -> dùng stored hoặc default.
- Text < minDetectChars: bỏ qua detect.
- Detect trả về unsupported: bỏ, dùng default.

## 9. Mở rộng tương lai
- TTL cho entry (inactivity eviction).
- Lịch sử ngôn ngữ (stack 3 gần nhất).
- Event hooks onChange.
- Metrics Prometheus / OpenTelemetry counters.

## 10. Kiểm thử
Unit tests (khi thêm test infra):
- ensureLanguage (stored).
- ensureLanguage (detect -> stored null -> default fallback).
- Unsupported setLanguage -> throw.
- detect skip khi text ngắn.

## 11. Logging / Observability
- Log: setLanguage(userId, lang, source).
- Log detect (lang, confidence?) nếu tích hợp lib ngoài.

## 12. Cấu hình môi trường
```
DEFAULT_LANG=en
SUPPORTED_LANGS=en,vi,es,fr
env ENABLE_LANG_DETECTION=0
LANG_MIN_DETECT_CHARS=8
```
Loader parse -> tạo `LanguageConfig`.

## 13. Lộ trình Triển khai
Phase 1:
- language-store.ts (InMemoryLanguageStore)
- language-service.ts (ensureLanguage without detect if disabled)
- wiring vào TelegramIntegration (system context)
- cập nhật README mục Quản lý ngôn ngữ

Phase 2:
- Optional detect stub (tạm return null)
- Adapter abstraction finalize

Phase 3:
- Persistence adapter (Redis hoặc file-based)
- Metrics + enrich logs

## 14. Ví dụ Sử dụng (pseudo)
```ts
const store = new InMemoryLanguageStore();
const service = new LanguageService(store, config);
const { lang } = await service.ensureLanguage(userId, incomingText);
context.push({ role: 'system', content: `Respond ONLY in ${lang}.` });
```

## 15. Ghi chú
- Không có command đổi ngôn ngữ ở giai đoạn này.
- Phát hiện ngôn ngữ nên có timeout / safe guard nếu dùng model sau này.

-- END --
