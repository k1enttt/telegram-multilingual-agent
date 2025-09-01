# Multilingual Agent for Telegram

## Giới thiệu

Dự án này là một agent tích hợp với Telegram, cho phép người dùng tương tác với các tác vụ tự động hóa và đổi ngôn ngữ theo ý muốn. Agent hỗ trợ đa ngôn ngữ, giúp nâng cao trải nghiệm người dùng trên nền tảng Telegram.

## Tính năng
- Tích hợp với Telegram Bot API
- Đổi ngôn ngữ giao diện và phản hồi theo yêu cầu người dùng
- Hỗ trợ nhiều tác vụ tự động hóa (ví dụ: tra cứu thời tiết)
- Dễ dàng mở rộng thêm các agent và workflow mới

### Tool quản lý ngôn ngữ người dùng
Đây là thành phần quan trọng giúp agent ghi nhớ và phản hồi đúng ngôn ngữ mà từng người dùng đã chọn trong mọi phiên làm việc. Tool này lưu trạng thái ngôn ngữ cho từng user, cho phép đổi ngôn ngữ linh hoạt mà không cần truyền lại thông tin qua mỗi prompt. Nhờ đó, trải nghiệm đa ngôn ngữ trở nên nhất quán, cá nhân hóa và dễ mở rộng cho các tác vụ tự động hóa khác.

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
- Đổi ngôn ngữ bằng lệnh hoặc menu bot

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

## Đóng góp
Mọi đóng góp đều được hoan nghênh! Vui lòng tạo pull request hoặc liên hệ qua issues.

## Giấy phép
MIT License.
