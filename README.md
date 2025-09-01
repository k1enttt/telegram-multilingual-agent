# Multilingual Agent for Telegram

## Giới thiệu

Dự án này là một agent tích hợp với Telegram, cho phép người dùng tương tác với các tác vụ tự động hóa và đổi ngôn ngữ theo ý muốn. Agent hỗ trợ đa ngôn ngữ, giúp nâng cao trải nghiệm người dùng trên nền tảng Telegram.

## Tính năng
- Tích hợp với Telegram Bot API
- Đổi ngôn ngữ giao diện và phản hồi theo yêu cầu người dùng
- Hỗ trợ nhiều tác vụ tự động hóa (ví dụ: tra cứu thời tiết)
- Dễ dàng mở rộng thêm các agent và workflow mới

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

## Đóng góp
Mọi đóng góp đều được hoan nghênh! Vui lòng tạo pull request hoặc liên hệ qua issues.

## Giấy phép
MIT License.
