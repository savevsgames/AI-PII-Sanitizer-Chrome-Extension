# Bug Tracking Index

**Last Updated:** 2025-11-11

---

## Active Bugs

### 🔥 Critical (Launch Blockers)

| ID | Severity | Title | Status | Assigned | ETA |
|----|----------|-------|--------|----------|-----|
| [CRITICAL-001](./CRITICAL-001-badge-false-positive.md) | 🔥 CRITICAL | Badge shows green with no profiles | 🔴 OPEN | - | 4-6 hours |

### ⚠️ High Priority

| ID | Severity | Title | Status | Assigned | ETA |
|----|----------|-------|--------|----------|-----|
| P0-REFACTOR-001 | ⚠️ HIGH | documentAnalysis.ts too large (1,072 lines) | 🔴 OPEN | - | 12-16 hours |
| P0-REFACTOR-002 | ⚠️ HIGH | content.ts platform logic scattered (979 lines) | 🔴 OPEN | - | 16-20 hours |

### 🟡 Medium Priority

| ID | Severity | Title | Status | Assigned | ETA |
|----|----------|-------|--------|----------|-----|
| P1-REFACTOR-001 | 🟡 MEDIUM | customRulesUI.ts too large (932 lines) | 🟠 PLANNED | - | 10-12 hours |
| P1-REFACTOR-002 | 🟡 MEDIUM | profileModal.ts too large (906 lines) | 🟠 PLANNED | - | 10-12 hours |
| P1-REFACTOR-003 | 🟡 MEDIUM | promptTemplates.ts too large (893 lines) | 🟠 PLANNED | - | 8-10 hours |
| P1-REFACTOR-004 | 🟡 MEDIUM | authModal.ts too large (850 lines) | 🟠 PLANNED | - | 8-10 hours |
| P1-ARCH-001 | 🟡 MEDIUM | Circular dependency in service worker | 🟠 PLANNED | - | 3-4 hours |

---

## Bug Status Definitions

| Status | Icon | Meaning |
|--------|------|---------|
| OPEN | 🔴 | Bug confirmed, needs fix |
| IN PROGRESS | 🟠 | Currently being worked on |
| TESTING | 🟡 | Fix complete, in testing |
| CLOSED | 🟢 | Fixed and verified |
| PLANNED | 🟠 | Acknowledged, not started |
| WONTFIX | ⚪ | Will not be addressed |

---

## Severity Definitions

| Severity | Icon | Definition | Examples |
|----------|------|------------|----------|
| CRITICAL | 🔥 | Launch blocker, security issue, data loss | Badge false positive, XSS vulnerability |
| HIGH | ⚠️ | Major functionality broken, workaround exists | Platform-specific bugs, upload failures |
| MEDIUM | 🟡 | Feature degraded, not breaking | Code quality issues, performance |
| LOW | ⚪ | Minor issues, cosmetic | UI polish, typos |

---

## Recently Closed Bugs

| ID | Severity | Title | Fixed Date | Fix Duration |
|----|----------|-------|------------|--------------|
| BOSS-008 | 🔥 CRITICAL | Memory leaks in popup components | 2025-11-07 | 8 hours |
| SEC-001 | 🔥 CRITICAL | XSS vulnerabilities in innerHTML usage | 2025-10-15 | 12 hours |
| AUTH-001 | ⚠️ HIGH | Decryption failure banner flashing | 2025-11-06 | 4 hours |

---

## Bug Templates

### Creating a New Bug Report

1. Copy [TEMPLATE-bug-report.md](./TEMPLATE-bug-report.md)
2. Rename to `[SEVERITY]-[ID]-[slug].md`
3. Fill out all sections
4. Add to Active Bugs table above
5. Assign priority and ETA

### Example Bug IDs
- `CRITICAL-001-badge-false-positive.md`
- `HIGH-002-profile-save-fails.md`
- `MEDIUM-003-button-alignment.md`

---

## Triage Process

```
New bug reported
  ↓
Reproduce & confirm
  ↓
Assign severity (CRITICAL/HIGH/MEDIUM/LOW)
  ↓
Estimate effort (hours)
  ↓
Prioritize (P0/P1/P2)
  ↓
Assign to developer
  ↓
Track in this README
  ↓
Fix → Test → Close
```

---

## Contact

- **Report bugs:** GitHub Issues
- **Security issues:** security@promptblocker.com
- **General support:** support@promptblocker.com
