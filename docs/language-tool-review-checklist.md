# Phase 1 DoD Checklist (Language Tool)

> File này tổng hợp checklist Definition of Done cho Phase 1 để xác nhận mọi tiêu chí đã hoàn thành trước khi chuyển phase.

- [x] Interfaces defined (LanguageStore, LanguageService)
- [x] In-memory implementation works (set/get/getOrDefault)
- [x] Config loader reads env + defaults
- [x] ensureLanguage returns stored or default (no detection yet)
- [x] Telegram integration injects system context with language
- [x] README documents env variables
- [x] Unit tests for service + store
- [x] TypeScript typecheck passes (`pnpm run typecheck`)
- [x] Tests pass (`pnpm test`)
- [x] Manual run shows system context log containing preferred language

Next: Phase 2 detection (optional) once needed.

## Phase 2 (Detection) Progress
- [x] Detection heuristic implemented (regex-based)
- [x] Detection gated by ENABLE_LANG_DETECTION
- [x] Tests for detection (Vietnamese, short text skip, minDetectChars threshold)
- [x] Logging enrichment for detection events (detected / detect_miss / fallback_default)
