# Multilingual Agent for Telegram

## Giới thiệu

Dự án này là một agent tích hợp với Telegram, cho phép người dùng tương tác với các tác vụ tự động hóa và đổi ngôn ngữ theo ý muốn. Agent hỗ trợ đa ngôn ngữ, giúp nâng cao trải nghiệm người dùng trên nền tảng Telegram.

## Tính năng
- Tích hợp với Telegram Bot API
- Ghi nhớ & tự động phát hiện (heuristic) ngôn ngữ người dùng (bật qua env)
- Phản hồi theo ngôn ngữ đã lưu mà không cần chỉ định lại mỗi lần
- Hỗ trợ tác vụ mẫu (tra cứu thời tiết) và dễ mở rộng thêm agent/workflow

### Tool quản lý/nghiệm ngôn ngữ người dùng
Thành phần chịu trách nhiệm:
- Lưu ngôn ngữ ưu tiên theo user (in-memory Phase 1).
- (Phase 2) Thử phát hiện ngôn ngữ từ nội dung đầu vào nếu chưa có stored và đủ độ dài.
- Chèn system prompt: `Respond ONLY in <lang>.` vào context agent.

Hiện chưa có lệnh / menu đổi ngôn ngữ thủ công; có thể bổ sung trong tương lai (thay vì dòng README cũ “Đổi ngôn ngữ bằng lệnh”). Nếu cần ép đổi, có thể tạm gọi trực tiếp `LanguageService.setLanguage` trong mã.

#### Language Tool (Tool cho Agent)
- Tool ID: `language-tool`.
- Chức năng: đảm bảo hoặc chuyển ngôn ngữ người dùng.
- Input:
   - `userId` (bắt buộc)
   - `targetLang` (tùy chọn) nếu muốn ép chuyển sang mã ngôn ngữ đã hỗ trợ.
   - `sampleText` (tùy chọn) để heuristic phát hiện khi chưa có stored.
- Output: `{ lang, source: stored|detected|default|forced, systemPrompt, supported }`.
- Chiến lược dùng trong prompt agent: Gọi `language-tool` đầu cuộc trò chuyện với `userId` + `sampleText` để lấy systemPrompt và sau đó tuân thủ.

## Cài đặt
1. Clone dự án:
   ```bash
   git clone <repo-url>
   cd multilingual-agent
   ```
2. Cài đặt các phụ thuộc:
   ```bash
   pnpm install
   ```
3. Cấu hình bot Telegram:
   - Tạo bot trên [BotFather](https://t.me/BotFather)
   - Lấy token và thêm vào file cấu hình (ví dụ: `.env`)

## Sử dụng
- Khởi động agent:
  ```bash
  pnpm start
  ```
- Tương tác với bot qua Telegram
// (Chưa hỗ trợ lệnh đổi ngôn ngữ trực tiếp; detection hoặc default)

## Cấu trúc dự án
- `src/mastra/agents/`: Các agent xử lý tác vụ
- `src/mastra/tools/`: Các công cụ hỗ trợ agent
- `src/mastra/workflows/`: Định nghĩa workflow cho các tác vụ

## Biến môi trường quan trọng
Tạo file `.env` (hoặc export trước khi chạy) với các biến sau:

```
TELEGRAM_BOT_TOKEN=your_telegram_token
# Ngôn ngữ mặc định nếu user chưa có ngôn ngữ lưu
DEFAULT_LANG=en
# Danh sách ngôn ngữ hỗ trợ (phân tách bằng dấu phẩy)
SUPPORTED_LANGS=en,vi,es,fr
# Bật/tắt detect ngôn ngữ tự động (Phase 2 mới dùng)
ENABLE_LANG_DETECTION=0
# Độ dài tối thiểu của text để thử detect
LANG_MIN_DETECT_CHARS=8
```

Ghi chú:
- Nếu `DEFAULT_LANG` không nằm trong `SUPPORTED_LANGS` thì sẽ được tự thêm.
- Khi `ENABLE_LANG_DETECTION=0` hệ thống chỉ dùng stored hoặc default.
- `LANG_MIN_DETECT_CHARS` chỉ áp dụng khi bật detection.
 - Detection hiện dùng heuristic regex ký tự đặc trưng (không gọi model). Muốn tắt → đặt ENABLE_LANG_DETECTION=0.

## Scripts hữu ích
```
pnpm dev         # Chạy môi trường phát triển (mastra dev)
pnpm test        # Chạy unit tests (Vitest)
pnpm typecheck   # Kiểm tra kiểu TypeScript
pnpm build && pnpm start  # Build & chạy production
```

Yêu cầu Node: >= 20.9.0 (xem engines trong package.json).

## Đóng góp
Mọi đóng góp đều được hoan nghênh! Vui lòng tạo pull request hoặc liên hệ qua issues.

## Giấy phép
MIT License.
