# Language Tool Agile TODO

> File này đóng vai trò bảng điều phối Agile: liệt kê user stories, tasks, trạng thái, tiêu chí nghiệm thu và tiến độ theo phase.

## Epic
As a multilingual Telegram agent, I need to remember each user's preferred language so that all responses are consistent without explicit commands.

## High-Level Phases
1. Phase 1 (Core state + injection) – MVP
2. Phase 2 (Detection hook & refinement)
3. Phase 3 (Persistence adapter)
4. Phase 4 (Observability & hardening)
5. Phase 5 (Optional enhancements)

---
## User Stories & Tasks

### Phase 1 – Core (Sprint 1)
Goal: In-memory storage + ensureLanguage + Telegram integration.

| ID | Story / Task | Description | Acceptance Criteria | Est | Status |
|----|--------------|-------------|----------------------|-----|--------|
| P1-S1 | Story: Store language per user | As a user my language is remembered | get/set returns same value in session | 2 | DONE |
| P1-T1 | Define interfaces | LanguageStore, LanguageService interfaces | Interfaces compiled w/o errors | 1 | DONE |
| P1-T2 | InMemoryLanguageStore impl | Simple Map backend | Unit test: set/get | 1 | DONE |
| P1-T3 | Config loader | Read env DEFAULT_LANG, SUPPORTED_LANGS, ENABLE_LANG_DETECTION | Missing env -> use defaults; logs config | 1 | DONE |
| P1-T4 | LanguageService.ensureLanguage | stored -> fallback default (no detect yet) | Returns source 'stored' or 'default' | 2 | DONE |
| P1-T5 | Integrate into TelegramIntegration | Add system context with preferred lang | Logs show injected lang, replies unaffected otherwise | 2 | DONE |
| P1-T6 | Update README & plan docs | Add description of language tool & env | README section present | 1 | DONE |
| P1-T7 | Minimal tests (if test infra) | Basic unit tests for service logic | All tests pass | 2 | DONE |
| P1-R1 | Review / DoD checklist | Code lint, type check, manual message test | All criteria satisfied | 1 | DONE |

Definition of Done (Phase 1)
- TypeScript builds cleanly
- Manual Telegram message shows language system context in logs
- Changing DEFAULT_LANG changes new-user behavior
- Docs updated

Verification Steps
1. Start bot with DEFAULT_LANG=vi -> new user conversation -> system context includes vi.
2. Set value via service.setLanguage(user, 'en') -> next ensureLanguage returns 'en' (stored).

### Phase 2 – Detection Hook (Sprint 2)
Goal: Optional automatic detection stub + toggle.

| ID | Task | Description | Acceptance Criteria | Est | Status |
|----|------|-------------|----------------------|-----|--------|
| P2-T1 | Add detect() placeholder | Return null if disabled or short text | ensureLanguage never returns source 'detected' unless enabled | 1 | DONE |
| P2-T2 | Enable detection path | If enabled & no stored & length>=minDetectChars -> mock detect | Source = 'detected' when path triggered | 2 | DONE |
| P2-T3 | Config param minDetectChars | env LANG_MIN_DETECT_CHARS | Behavior changes with env tweak | 1 | DONE |
| P2-T4 | Tests for detection logic | Cover short text, disabled, enabled | All pass | 2 | DONE |
| P2-R1 | Review & refine logging | Adds detection source log line | Logs contain 'lang-detected' entries | 1 | DONE |

Definition of Done (Phase 2)
- Detection path gated by env
- No regressions to Phase 1

Verification Steps
1. ENABLE_LANG_DETECTION=1, send long non-English text -> ensureLanguage returns 'detected'.
2. Reduce length below threshold -> default used.

### Phase 3 – Persistence Adapter (Sprint 3)
Goal: Pluggable storage (e.g., Redis or file) while preserving interface.

| ID | Task | Description | Acceptance Criteria | Est | Status |
|----|------|-------------|----------------------|-----|--------|
| P3-T1 | Define adapter interface extension | Possibly reuse LanguageStore | InMemory + Redis share same contract | 1 | TODO |
| P3-T2 | Redis adapter (optional) | Implement CRUD using ioredis (or similar) | Integration test (mock) passes | 3 | TODO |
| P3-T3 | Adapter selection factory | Choose store based on env LANGUAGE_STORE=memory|redis | Correct instance returned | 1 | TODO |
| P3-T4 | Graceful fallback | If Redis unreachable -> fallback memory + warn | Warning log + continues | 2 | TODO |
| P3-T5 | Update docs | Add persistence instructions | README docs updated | 1 | TODO |

Definition of Done (Phase 3)
- Hot swap store via env
- Fallback path functional

Verification Steps
1. LANGUAGE_STORE=redis but service down -> fallback memory + log.
2. Redis up -> data persists across restarts.

### Phase 4 – Observability & Hardening (Sprint 4)

| ID | Task | Description | Acceptance Criteria | Est | Status |
|----|------|-------------|----------------------|-----|--------|
| P4-T1 | Structured logging | Add context keys (userId, lang, source) | Logs json or consistent format | 1 | TODO |
| P4-T2 | Metrics counters | language_set_total, language_detect_total | Metrics endpoint shows counters | 2 | TODO |
| P4-T3 | Error handling audit | Safeguard invalid lang inputs | Invalid inputs rejected & logged | 1 | TODO |
| P4-T4 | Race condition review | Ensure atomic set operations ok | No inconsistent states in tests | 2 | TODO |
| P4-T5 | Docs observability | Add monitoring guide | Docs section added | 1 | TODO |

Definition of Done (Phase 4)
- Clear logs, metrics accessible, robust error paths.

Verification Steps
1. Trigger multiple sets -> counter increments.
2. Pass invalid code -> rejection + log.

### Phase 5 – Optional Enhancements (Backlog)
- TTL expiry for inactive entries
- Multi-language history tracking
- onChange event hooks -> analytics
- Confidence score surfacing (detection)
- Language override via UI (future command / settings panel)

---
## Backlog (Unscheduled)
| Idea | Notes |
|------|-------|
| Multi-tenant key scoping | Prefix with tenantId: to isolate environments |
| Group chat mode | Per-chat vs per-user logic toggle |
| Persisted language audit trail | Compliance / analytics |

---
## Risk & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| Detection inaccurate | Wrong language responses | Make detection opt-in & easily disabled |
| Redis outages | Loss of state persistence | Fallback to in-memory with warning |
| Large supported set | Validation overhead | Keep explicit SUPPORTED_LANGS list |

---
## Summary Dashboard (Manual Tracking)
- Phase 1 Progress: 9/9
- Phase 2 Progress: 0/6
- Phase 3 Progress: 0/5
- Phase 4 Progress: 0/5

(Manually update counts as tasks move to DONE.)
