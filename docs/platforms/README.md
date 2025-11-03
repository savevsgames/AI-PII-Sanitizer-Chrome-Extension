# Platform Support Documentation

> **Last Updated:** 2025-11-03
> **Maintained By:** Core Team

This directory contains comprehensive platform-specific documentation for all AI services supported by PromptBlocker (formerly AI PII Sanitizer).

---

## Overview

PromptBlocker provides PII protection across multiple AI chat platforms by intercepting requests at the network level, substituting real PII with aliases before transmission, and decoding responses to show real PII to users.

**Current Status:**
- **Tier 1 (MVP - Production):** ChatGPT, Claude, Gemini, Perplexity, Copilot ✅ (98% market coverage)
- **Tier 2 (Post-MVP - High Priority):** DeepSeek (96M users), Meta AI (100M+ users) 🎯
- **Tier 2 (Post-MVP - Lower Priority):** You.com (5.5M users), Poe (1.2M users) 🟡
- **Template for Future Platforms:** PLATFORM_TEMPLATE.md 📋

**Market Share Coverage:**
- Current (5 platforms): ~98% of global AI chatbot market
- Adding DeepSeek + Meta AI: ~99.5% coverage

---

## Documentation Files

### Template

**[PLATFORM_TEMPLATE.md](./PLATFORM_TEMPLATE.md)**
- **Purpose:** Standardized template for documenting new platform integrations
- **Use Case:** Copy this template when adding support for a new AI platform
- **Status:** ✅ Complete (v1.0)
- **Sections:**
  - Platform overview & user base
  - Technical implementation details
  - Code architecture & message passing
  - Testing & validation
  - Platform-specific challenges
  - Maintenance & updates
  - Security considerations
  - Quick reference & troubleshooting

---

### Production Platforms (✅ Complete & Tested)

#### 1. [gemini.md](./gemini.md) - Google Gemini
- **URL:** `*.gemini.google.com`
- **Status:** ✅ Production (v1.0.3)
- **Implementation Date:** 2025-11-02
- **Key Features:**
  - XHR interception (not fetch - unique among platforms)
  - URLSearchParams for batchexecute format parsing
  - Gemini-only gating to avoid breaking ChatGPT/Claude
  - DOM observer for response decoding
- **Technical Highlights:**
  - Uses XMLHttpRequest instead of fetch() (page context injection required)
  - Proprietary Google batchexecute RPC format (form-encoded)
  - URL-encoded `f.req` parameter requires special handling
- **Challenges Overcome:**
  - XHR interception in page context vs isolated world
  - Double-encoding issue fixed with URLSearchParams
  - isProtected flag blocking fixed
- **Test Status:** ✅ Fully tested, working in production

#### 2. ChatGPT (Documented elsewhere)
- **URL:** `*.chatgpt.com`, `*.openai.com`
- **Status:** ✅ Production
- **Implementation:** fetch() interception, JSON messages array
- **Documentation:** See `docs/current/technical_architecture.md`

#### 3. Claude (Documented elsewhere)
- **URL:** `*.claude.ai`, `*.anthropic.com`
- **Status:** ✅ Production
- **Implementation:** fetch() interception, JSON prompt object
- **Documentation:** See `docs/current/technical_architecture.md`

---

### Platforms in Development (🚧 Infrastructure Ready, Testing Pending)

#### 4. [perplexity.md](./perplexity.md) - Perplexity AI
- **URL:** `*.perplexity.ai`
- **Status:** ✅ Production (v1.0.3)
- **Implementation Date:** 2025-11-03
- **Priority:** Medium-High
- **Key Features:**
  - REST API via fetch() (standard interception)
  - Dual-field request format (query_str + dsl_query)
  - SSE streaming responses
- **Technical Highlights:**
  - **CRITICAL FIX:** Must substitute BOTH query_str AND params.dsl_query
  - Two request formats supported (main chat + follow-up)
  - Unique dual-field protection prevents PII leaks
- **Challenges Overcome:**
  - Discovered hidden dsl_query field causing PII leaks
  - Fixed dual-field extraction and substitution
  - Both fields now protected
- **Test Status:** ✅ Fully tested, working in production
- **Response Decoding:** Disabled (same as ChatGPT/Claude/Gemini - by design)

#### 5. [poe.md](./poe.md) - Poe (Quora)
- **URL:** `*.poe.com`
- **Status:** 🚧 Infrastructure Complete, Testing Pending
- **Implementation Date:** 2025-11-02 (infrastructure)
- **Priority:** Medium
- **Key Features:**
  - Multi-model aggregator (ChatGPT, Claude, GPT-4, etc.)
  - Single interface routes to multiple backends
  - Possibly uses GraphQL instead of REST
- **Technical Challenges:**
  - **GraphQL handling unknown** (may need special parsing)
  - Multi-model routing (each bot may behave differently)
  - Need DOM observer for response rendering
- **TODO:**
  - [ ] Test fetch() interception
  - [ ] Determine if GraphQL or REST
  - [ ] Test with multiple bots (ChatGPT, Claude, GPT-4)
  - [ ] Implement PoeObserver
- **Test Target:** Phase 2B (Nov 9-15)

#### 5. [copilot.md](./copilot.md) - Microsoft Copilot
- **URL:** `*.copilot.microsoft.com`
- **Status:** ✅ Production (v1.0.3)
- **Implementation Date:** 2025-11-03
- **Priority:** High
- **Key Features:**
  - WebSocket interception (page context)
  - Streaming event format (send, appendText, partCompleted, done)
  - textProcessor.ts format detection
- **Technical Highlights:**
  - Uses WebSocket instead of fetch() (unique among platforms except Gemini's XHR)
  - WebSocket.prototype.send() interception in page context
  - Async message passing with 5-second timeout
  - Content array format: `[{ type: "text", text: "..." }]`
- **Challenges Overcome:**
  - WebSocket interception in page context vs isolated world
  - Async WebSocket.send() with synchronous API
  - Content array iteration for text extraction/replacement
- **Test Status:** ✅ Fully tested, working in production
- **Response Decoding:** Disabled (same as ChatGPT/Claude/Gemini/Perplexity - by design)

#### 7. [you.md](./you.md) - You.com
- **URL:** `*.you.com`
- **Status:** 🟡 Tier 2 (Post-MVP - Deferred)
- **Testing Date:** 2025-11-03
- **Market Share:** 0.40% (5.5M monthly visits)
- **Priority:** ⚠️ Low (deferred in favor of DeepSeek and Meta AI)
- **Key Characteristics:**
  - ❌ **Uses GET requests with URL parameters** (NOT POST/JSON!)
  - Requires webRequest API (different architecture than all other platforms)
  - AI-powered search engine (similar to Perplexity)
  - Multiple AI modes (Smart, Genius, Create, Research)
- **⚠️ CRITICAL DISCOVERY (2025-11-03):**
  - You.com sends queries via URL parameter (`?q=...`)
  - Our fetch() body interception **CANNOT intercept URL parameters**
  - Requires `chrome.webRequest` API for URL modification
  - **Implementation is 100% feasible** (2-4 hours) but **low ROI** (5.5M users vs DeepSeek 96M users)
- **Recommendation:** Defer to Tier 2 (Post-MVP), implement after DeepSeek and Meta AI
- **See:** `YOU_COM_ANALYSIS.md` for complete technical analysis and implementation plan

---

## Platform Comparison Matrix

### Tier 1: Production Platforms (MVP - 98% Market Coverage)

| Platform | Status | API Type | Request Format | Interception Method | Observer | Market Share |
|----------|--------|----------|----------------|---------------------|----------|--------------|
| **ChatGPT** | ✅ Production | REST | JSON (messages[]) | fetch() | Disabled* | 82.7% |
| **Copilot** | ✅ Production | **WebSocket** | JSON events | **WebSocket.send()** (page context) | Disabled* | 4.5% |
| **Perplexity** | ✅ Production | REST | JSON (dual-field!) | fetch() | Disabled* | 8.2% |
| **Gemini** | ✅ Production | REST (batchexecute) | Form-encoded | **XHR** (page context) | Disabled* | 2.2% |
| **Claude** | ✅ Production | REST | JSON (prompt) | fetch() | Disabled* | 0.9% |

**\*Response Decoding Note:** All production platforms have response decoding **intentionally disabled** (`config.settings.decodeResponses = false`). This is by design to verify substitution is working. Infrastructure is in place and ready for unified UX implementation across all platforms later.

**Total Coverage:** ~98% of global AI chatbot market

---

### Tier 2: Post-MVP Platforms (Next Priority)

| Platform | Status | Users | API Type (Est.) | Estimated Effort | Priority |
|----------|--------|-------|-----------------|------------------|----------|
| **DeepSeek** | 🎯 Next | 96M monthly | POST/JSON (likely) | 2-4 hours | ⭐⭐⭐⭐⭐ HIGH |
| **Meta AI** | 🎯 Next | 100M+ | POST/GraphQL (likely) | 4-6 hours | ⭐⭐⭐⭐ HIGH |
| **You.com** | 🟡 Later | 5.5M | **GET/URL params** | 2-4 hours (webRequest) | ⭐ LOW |
| **Poe** | 🟡 Later | 1.2M | POST/JSON (likely) | 3-5 hours | ⭐⭐ MEDIUM |

---

## Technical Implementation Patterns

### Pattern 1: Standard REST API (ChatGPT, Claude, You.com)
```
User Input → fetch() intercepted → JSON.parse → Substitute PII → JSON.stringify → API
              ↓
         Response → DOM rendered → Observer decodes → User sees real PII
```

**Files Involved:**
- `src/content/inject.js` - fetch() wrapper
- `src/background/serviceWorker.ts` - JSON substitution
- `src/observers/[platform]-observer.ts` - DOM observation

**Complexity:** Low-Medium

---

### Pattern 2: Proprietary Format (Gemini)
```
User Input → XHR.send() intercepted → URLSearchParams.parse → Extract f.req →
             Substitute PII → URLSearchParams.set → Reconstruct → API
              ↓
         Response → DOM rendered → Observer decodes → User sees real PII
```

**Files Involved:**
- `src/content/inject.js` - XHR wrapper (page context)
- `src/background/serviceWorker.ts` - URLSearchParams handling
- `src/observers/gemini-observer.ts` - DOM observation

**Complexity:** High (page context injection, form encoding)

---

### Pattern 3: WebSocket/Real-time (Perplexity - Planned)
```
User Input → Socket.IO emit() intercepted → JSON.parse → Substitute PII → emit()
              ↓
         WebSocket message → DOM rendered → Observer decodes → User sees real PII
```

**Files Involved:**
- `src/content/inject.js` - Socket.IO wrapper (TODO)
- `src/background/serviceWorker.ts` - JSON substitution
- `src/observers/perplexity-observer.ts` - DOM observation (TODO)

**Complexity:** High (WebSocket interception, real-time streaming)

---

### Pattern 4: GraphQL (Poe - If Applicable)
```
User Input → fetch() intercepted → Parse GraphQL → Navigate to variables.input.message →
             Substitute PII → Reconstruct → API
              ↓
         Response → DOM rendered → Observer decodes → User sees real PII
```

**Files Involved:**
- `src/content/inject.js` - fetch() wrapper
- `src/background/serviceWorker.ts` - GraphQL variable substitution
- `src/observers/poe-observer.ts` - DOM observation (TODO)

**Complexity:** Medium-High (nested GraphQL variables)

---

### Pattern 5: Nested JSON (Copilot)
```
User Input → fetch() intercepted → JSON.parse → Navigate to arguments[0].message.text →
             Substitute PII → Reconstruct nested JSON → API
              ↓
         Response (Adaptive Cards) → DOM rendered → Observer decodes (parse cards) →
         User sees real PII
```

**Files Involved:**
- `src/content/inject.js` - fetch() wrapper
- `src/background/serviceWorker.ts` - Nested JSON handling
- `src/observers/copilot-observer.ts` - DOM + Adaptive Card observation (TODO)

**Complexity:** Medium-High (deep nesting, Adaptive Cards)

---

## Common Implementation Checklist

When adding a new platform or maintaining an existing one:

### 1. Infrastructure Setup
- [ ] Add hostname to `manifest.json` host_permissions
- [ ] Add URL pattern to `inject.js` aiDomains array
- [ ] Add service detection in `serviceWorker.ts` detectService()
- [ ] Add AIService type in `types.ts`
- [ ] Add stats tracking in `storage.ts` and `statsRenderer.ts`
- [ ] Add platform icon in `statsRenderer.ts` SERVICE_ICONS

### 2. Request Interception
- [ ] Determine API type (REST/WebSocket/GraphQL/Other)
- [ ] Implement interception (fetch/XHR/Socket.IO)
- [ ] Research request format (DevTools Network tab)
- [ ] Implement request body substitution
- [ ] Test with real PII

### 3. Response Handling
- [ ] Research response format (DevTools Network tab)
- [ ] Research DOM structure (DevTools Elements tab)
- [ ] Implement observer (if needed)
- [ ] Implement response decoding
- [ ] Test with real PII

### 4. Testing & Validation
- [ ] Manual testing with test PII
- [ ] Network tab verification (aliases sent to API)
- [ ] DOM verification (real PII shown to user)
- [ ] Stats verification (increment after substitution)
- [ ] Edge case testing (streaming, errors, etc.)

### 5. Documentation
- [ ] Copy PLATFORM_TEMPLATE.md to new file
- [ ] Fill in all sections with actual findings
- [ ] Document challenges and solutions
- [ ] Add troubleshooting guide
- [ ] Update this README.md

### 6. Production Release
- [ ] Full test suite passing
- [ ] Performance benchmarks met (<50ms latency)
- [ ] Security audit passed
- [ ] User acceptance testing
- [ ] Update ROADMAP.md and CHANGELOG.md

---

## Testing Timeline (Phase 2B)

**Target Dates:** Nov 9-15, 2025

| Platform | Day | Priority | Estimated Time | Notes |
|----------|-----|----------|----------------|-------|
| Perplexity | Day 1-2 | High | 4-6 hours | WebSocket research + implementation |
| Poe | Day 2-3 | Medium | 3-4 hours | GraphQL investigation + multi-bot testing |
| Copilot | Day 3-4 | High | 4-6 hours | Endpoint filtering + nested JSON + Adaptive Cards |
| You.com | Day 4-5 | Medium | 2-3 hours | Dual interface testing + AI modes |
| **Total** | 5 days | - | **13-19 hours** | Includes documentation updates |

**Success Criteria for Each Platform:**
1. ✅ Request interception working (verified in Network tab)
2. ✅ PII substitution working (aliases sent to API)
3. ✅ Response decoding working (real PII shown to user)
4. ✅ Stats incrementing correctly (byService counter)
5. ✅ No errors in console
6. ✅ Performance acceptable (<50ms latency)

---

## Maintenance & Future Updates

### Regular Maintenance Tasks

**Monthly:**
- [ ] Check all platforms still working (smoke test)
- [ ] Review user reports for platform-specific issues
- [ ] Check for API endpoint changes (monitor 404s)

**Quarterly:**
- [ ] Full test suite for all platforms
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] Update documentation with any changes

**When Platform Updates:**
1. Monitor console errors
2. Check Network tab for endpoint changes
3. Verify request/response formats
4. Update interception code if needed
5. Update documentation
6. Increment version history

### Adding New Platforms

**Process:**
1. Copy `PLATFORM_TEMPLATE.md` to new file (e.g., `new-platform.md`)
2. Research platform (API type, endpoints, auth)
3. Follow infrastructure setup checklist above
4. Implement interception + observer
5. Test thoroughly
6. Document findings in platform file
7. Update this README.md
8. Update ROADMAP.md

**Estimated Time Per New Platform:**
- Simple (REST + fetch): 4-6 hours
- Medium (GraphQL or WebSocket): 6-10 hours
- Complex (proprietary format or XHR): 10-15 hours

---

## Related Documentation

### Core Architecture
- `docs/current/technical_architecture.md` - Overall system architecture
- `docs/current/adding_ai_services.md` - Generic platform integration guide
- `docs/development/final-dev-phase.md` - Implementation details

### Testing & QA
- `PLATFORM_TESTING_PLAN.md` - Phase 2B testing strategy
- `docs/testing/TESTING.md` - Comprehensive testing guide
- `docs/testing/Phase_1_Testing.md` - Phase 1 test results

### Planning & Roadmap
- `ROADMAP.md` - Product roadmap and status
- `docs/current/launch_roadmap.md` - Launch strategy
- `docs/gemini-support/GEMINI_XHR_INTERCEPTION_PLAN.md` - Gemini implementation plan

---

## Quick Reference

### File Locations

**Documentation:**
```
docs/platforms/
├── README.md (this file)
├── PLATFORM_TEMPLATE.md (template for new platforms)
├── gemini.md (✅ production)
├── perplexity.md (🚧 testing pending)
├── poe.md (🚧 testing pending)
├── copilot.md (🚧 testing pending)
└── you.md (🚧 testing pending)
```

**Implementation Code:**
```
src/
├── content/
│   ├── inject.js (fetch/XHR interception)
│   └── content.ts (content script + message relay)
├── background/
│   └── serviceWorker.ts (service detection + substitution)
├── observers/
│   ├── gemini-observer.ts (✅ implemented)
│   ├── perplexity-observer.ts (⏳ TODO)
│   ├── poe-observer.ts (⏳ TODO)
│   ├── copilot-observer.ts (⏳ TODO)
│   └── you-observer.ts (⏳ TODO)
├── lib/
│   ├── aliasEngine.ts (core substitution logic)
│   ├── types.ts (AIService type definitions)
│   └── storage.ts (stats tracking)
└── manifest.json (permissions)
```

### Key Metrics

**Production Platforms:**
- **5 platforms:** ChatGPT, Claude, Gemini, Perplexity, Copilot
- **Status:** ✅ Fully tested and working
- **Test Coverage:** 100%

**In Development:**
- **2 platforms:** Poe, You.com
- **Status:** 🚧 Infrastructure complete, testing pending
- **Test Coverage:** 0% (untested)

**Total:**
- **7 platforms** supported (infrastructure)
- **5 production** + **2 pending testing**
- **Target:** All 7 platforms tested by Nov 15, 2025

---

## Contact & Support

**For Documentation Questions:**
- Review this README first
- Check individual platform documentation
- See `docs/current/adding_ai_services.md` for generic guidance

**For Implementation Questions:**
- Check `docs/current/technical_architecture.md`
- Review existing working implementation (Gemini, ChatGPT, Claude)
- See `docs/development/final-dev-phase.md`

**For Testing Questions:**
- See `PLATFORM_TESTING_PLAN.md`
- Review `docs/testing/TESTING.md`

**For Bugs/Issues:**
- Create GitHub issue with platform tag
- Include console logs and Network tab screenshots
- Follow bug report template

---

**Last Updated:** 2025-11-02
**Next Review:** After Phase 2B testing (Nov 15, 2025)
**Maintained By:** Core Team
