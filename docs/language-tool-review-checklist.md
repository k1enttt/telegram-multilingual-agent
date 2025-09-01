# Phase 1 DoD Checklist (Language Tool)

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
