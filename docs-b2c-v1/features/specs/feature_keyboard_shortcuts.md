# Feature: Keyboard Shortcuts System

**Status:** 📋 Planned (Future Enhancement)
**Priority:** P2 (Nice-to-Have)
**Estimated Effort:** 3-5 days
**Target Release:** v1.2.0

---

## Overview

A comprehensive keyboard shortcuts system that allows users to quickly trigger actions throughout the extension without using the mouse. Includes a dedicated Shortcuts tab for viewing, customizing, and managing all keyboard shortcuts.

---

## User Stories

1. **Power User Efficiency**
   - As a power user, I want to trigger common actions with keyboard shortcuts so I can work faster without reaching for the mouse.

2. **Discoverability**
   - As a new user, I want to see all available keyboard shortcuts in one place so I can learn them gradually.

3. **Customization**
   - As a user with accessibility needs, I want to customize shortcuts to avoid conflicts with my assistive tools.

4. **Template Quick Access**
   - As a frequent template user, I want to trigger my favorite prompt templates with Ctrl+1-9 shortcuts.

---

## Feature Design

### Shortcuts Tab (New)

Add a new tab to the popup: **Shortcuts** (after Features, before Settings)

**Layout:**
```
┌─────────────────────────────────────────┐
│  🔥 Features  📋 Templates  ⌨️ Shortcuts │
│  ⚙️ Settings  📊 Stats                   │
└─────────────────────────────────────────┘
```

### Shortcuts Tab Content

#### Section 1: Global Shortcuts
**Shortcuts that work anywhere in the browser**

| Action | Default Shortcut | Customizable |
|--------|-----------------|--------------|
| Toggle Extension On/Off | `Ctrl+Shift+P` | ✅ Yes |
| Open Extension Popup | `Ctrl+Shift+O` | ✅ Yes |
| Quick Enable/Disable Protection | `Ctrl+Shift+X` | ✅ Yes |

#### Section 2: Profile Shortcuts
**Quick profile switching (when popup is open)**

| Action | Default Shortcut | Customizable |
|--------|-----------------|--------------|
| Switch to Profile 1 | `Ctrl+1` | ✅ Yes |
| Switch to Profile 2 | `Ctrl+2` | ✅ Yes |
| Switch to Profile 3-9 | `Ctrl+3-9` | ✅ Yes |
| Create New Profile | `Ctrl+N` | ✅ Yes |

#### Section 3: Template Shortcuts
**Quick template access (when popup is open)**

| Action | Default Shortcut | Customizable |
|--------|-----------------|--------------|
| Use Template 1 | `Alt+1` | ✅ Yes |
| Use Template 2 | `Alt+2` | ✅ Yes |
| Use Template 3-9 | `Alt+3-9` | ✅ Yes |
| Open Template Editor | `Alt+T` | ✅ Yes |

#### Section 4: Navigation Shortcuts
**Tab navigation within popup**

| Action | Default Shortcut | Customizable |
|--------|-----------------|--------------|
| Next Tab | `Tab` | ❌ No (standard) |
| Previous Tab | `Shift+Tab` | ❌ No (standard) |
| Jump to Features | `Alt+F` | ✅ Yes |
| Jump to Settings | `Alt+S` | ✅ Yes |
| Jump to Stats | `Alt+D` | ✅ Yes |

---

## UI/UX Design

### Shortcuts Tab Layout

```
┌───────────────────────────────────────────────────┐
│  ⌨️ Keyboard Shortcuts                            │
│                                                    │
│  [Search shortcuts...] [🔄 Reset All to Defaults]│
│                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🌐 Global Shortcuts                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                    │
│  Toggle Protection     [Ctrl+Shift+P]  [✏️ Edit] │
│  Open Popup            [Ctrl+Shift+O]  [✏️ Edit] │
│                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  👤 Profile Shortcuts                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                    │
│  Switch to Profile 1   [Ctrl+1]        [✏️ Edit] │
│  Switch to Profile 2   [Ctrl+2]        [✏️ Edit] │
│  Create New Profile    [Ctrl+N]        [✏️ Edit] │
│                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  📋 Template Shortcuts (PRO)           🔒         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                    │
│  Use Template 1        [Alt+1]         [✏️ Edit] │
│  Use Template 2        [Alt+2]         [✏️ Edit] │
│                                                    │
└───────────────────────────────────────────────────┘
```

### Edit Shortcut Modal

When user clicks "✏️ Edit":

```
┌─────────────────────────────────────────┐
│  Edit Keyboard Shortcut                 │
│                                          │
│  Action: Toggle Protection               │
│                                          │
│  Current: Ctrl+Shift+P                   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Press new shortcut combination...│   │
│  └──────────────────────────────────┘   │
│                                          │
│  ⚠️ Conflicts with: None                │
│                                          │
│  [Cancel]              [Save] [Reset]    │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### Data Model

```typescript
/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  id: string;                    // 'toggle-protection'
  action: string;                // 'Toggle Protection On/Off'
  category: ShortcutCategory;    // 'global' | 'profile' | 'template' | 'navigation'
  defaultShortcut: string;       // 'Ctrl+Shift+P'
  currentShortcut: string;       // User's custom shortcut
  enabled: boolean;              // Can be disabled without removing
  customizable: boolean;         // Can user change it?
  tier: 'free' | 'pro';         // Feature gating
}

export type ShortcutCategory = 'global' | 'profile' | 'template' | 'navigation';

/**
 * Keyboard shortcuts configuration in UserConfig
 */
export interface KeyboardShortcutsConfig {
  enabled: boolean;              // Master toggle for all shortcuts
  shortcuts: KeyboardShortcut[]; // User's shortcuts
}
```

### Storage

**Location:** `chrome.storage.local` under `config.keyboardShortcuts`

```json
{
  "keyboardShortcuts": {
    "enabled": true,
    "shortcuts": [
      {
        "id": "toggle-protection",
        "action": "Toggle Protection On/Off",
        "category": "global",
        "defaultShortcut": "Ctrl+Shift+P",
        "currentShortcut": "Ctrl+Shift+P",
        "enabled": true,
        "customizable": true,
        "tier": "free"
      }
    ]
  }
}
```

### Chrome Commands API

Use Chrome's built-in `chrome.commands` API for global shortcuts:

**manifest.json**
```json
{
  "commands": {
    "toggle-protection": {
      "suggested_key": {
        "default": "Ctrl+Shift+P",
        "mac": "Command+Shift+P"
      },
      "description": "Toggle protection on/off"
    },
    "open-popup": {
      "suggested_key": {
        "default": "Ctrl+Shift+O",
        "mac": "Command+Shift+O"
      },
      "description": "Open extension popup"
    },
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+O",
        "mac": "Command+Shift+O"
      }
    }
  }
}
```

**Background Script Handler**
```typescript
// Listen for command triggers
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'toggle-protection':
      handleToggleProtection();
      break;
    case 'open-popup':
      chrome.action.openPopup();
      break;
  }
});
```

### In-Popup Shortcuts

For shortcuts that work within the popup (profile switching, templates):

```typescript
/**
 * Popup keyboard shortcut handler
 */
document.addEventListener('keydown', (event) => {
  const config = useAppStore.getState().config;

  if (!config?.keyboardShortcuts?.enabled) return;

  const shortcut = getShortcutString(event);
  const action = findShortcutAction(shortcut);

  if (action) {
    event.preventDefault();
    executeShortcutAction(action);
  }
});

function getShortcutString(event: KeyboardEvent): string {
  const modifiers = [];
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey) modifiers.push('Meta');

  return [...modifiers, event.key].join('+');
}
```

---

## Conflict Detection

When user tries to set a shortcut:

```typescript
function detectShortcutConflicts(
  shortcut: string,
  excludeId?: string
): string[] {
  const conflicts: string[] = [];
  const config = useAppStore.getState().config;

  // Check against extension shortcuts
  config?.keyboardShortcuts?.shortcuts.forEach(s => {
    if (s.id !== excludeId && s.currentShortcut === shortcut && s.enabled) {
      conflicts.push(s.action);
    }
  });

  // Check against Chrome reserved shortcuts
  const reserved = ['Ctrl+T', 'Ctrl+W', 'Ctrl+N', 'Ctrl+Shift+N'];
  if (reserved.includes(shortcut)) {
    conflicts.push('Chrome reserved shortcut');
  }

  return conflicts;
}
```

---

## User Preferences

### Settings Integration

Add toggle to Settings tab:

```
┌─────────────────────────────────────────┐
│  ⚡ Keyboard Shortcuts                  │
│                                          │
│  [✓] Enable keyboard shortcuts           │
│                                          │
│  Customize shortcuts in the Shortcuts    │
│  tab.                                    │
│                                          │
│  [Manage Shortcuts →]                    │
└─────────────────────────────────────────┘
```

---

## Accessibility

1. **Screen Reader Support**
   - All shortcuts announced via ARIA labels
   - Focus management when shortcuts execute actions

2. **Conflict Avoidance**
   - Detect conflicts with screen reader shortcuts
   - Warn users about OS-level shortcut conflicts

3. **Visual Feedback**
   - Show toast notification when shortcut executed
   - Highlight affected element briefly

---

## Testing Plan

### Unit Tests
- Shortcut string parsing (`Ctrl+Shift+P`)
- Conflict detection logic
- Shortcut execution routing

### Integration Tests
- Chrome commands registration
- Shortcut persistence in storage
- Reset to defaults functionality

### Manual Testing
- Test all default shortcuts on Windows/Mac/Linux
- Verify no conflicts with browser shortcuts
- Test customization and persistence
- Test PRO tier gating

---

## PRO Features

**FREE Tier:**
- Global shortcuts (toggle, open popup)
- Profile switching shortcuts (Ctrl+1-5, max 5 profiles)
- View shortcuts legend

**PRO Tier:**
- Template shortcuts (Alt+1-9)
- Unlimited profile shortcuts (Ctrl+1-9)
- Custom shortcut creation
- Import/export shortcuts configuration

---

## Migration Strategy

When feature is implemented:

1. Add `keyboardShortcuts` to UserConfig with defaults
2. Existing users get shortcuts enabled by default
3. Add migration in `storage.ts` to initialize shortcuts
4. Show "New Feature" badge on Shortcuts tab

---

## Future Enhancements (v2.0)

1. **Shortcut Profiles**
   - Save different shortcut sets
   - Quick switch between sets (e.g., "Work", "Personal")

2. **Chord Shortcuts**
   - Multi-key sequences (e.g., `Ctrl+K, Ctrl+S`)
   - Vim-like command mode

3. **Context-Aware Shortcuts**
   - Different shortcuts on different websites
   - Page-specific overrides

4. **Shortcut Hints**
   - Show available shortcuts on hover
   - "Command palette" style shortcut search (Ctrl+K)

---

## Implementation Checklist

- [ ] Add `KeyboardShortcut` types to `types.ts`
- [ ] Create `keyboardShortcuts.ts` handler module
- [ ] Add Shortcuts tab to popup navigation
- [ ] Implement shortcuts UI component
- [ ] Add edit shortcut modal
- [ ] Implement conflict detection
- [ ] Add Chrome commands to manifest
- [ ] Implement background command handler
- [ ] Add in-popup keyboard listener
- [ ] Add tests for shortcut system
- [ ] Update user documentation
- [ ] Add "What's New" announcement

---

## Success Metrics

- **Adoption Rate:** 30%+ users enable shortcuts within 30 days
- **Usage Frequency:** 50+ shortcut uses per active user per week
- **Customization Rate:** 10%+ users customize at least one shortcut
- **Satisfaction:** 4.5+ star rating on feature feedback

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Author:** AI + User Collaboration
