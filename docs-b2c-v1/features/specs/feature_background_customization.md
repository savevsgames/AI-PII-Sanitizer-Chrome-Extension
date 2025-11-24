# Background Customization Feature

**Status:** ✅ Implemented
**Version:** 1.0
**Last Updated:** 2025-01-07

## Overview

The Background Customization feature allows users to personalize the Prompt Blocker extension popup with beautiful background images and effects. The system includes a curated library of backgrounds, transparency controls, blur effects, and PRO-tier custom uploads.

## Features

### 🎨 Background Library (All Users)
- **6 Free Backgrounds:** Theme-matched defaults and nature scenes
- **8 PRO Backgrounds:** Premium nature and abstract scenes
- **Visual Thumbnails:** Grid layout with preview images
- **One-Click Selection:** Instant background switching
- **Checkmark Indicator:** Shows currently selected background

### 🎚️ Transparency Control (All Users)
- **BG Transparency Slider:** 0-100% range
- **Live Preview:** Changes apply in real-time
- **Persistent Settings:** Saved across sessions
- **Smart Defaults:** Auto-resets with theme selection

### ✨ Blur Effect (All Users)
- **Toggle Switch:** Easy on/off control
- **8px Gaussian Blur:** Smooth, professional blur
- **Performance Optimized:** Only renders when enabled
- **Background-Only:** Blurs image, not content

### 📸 Custom Upload (PRO Only)
- **File Types:** JPEG, PNG, WebP
- **Size Limit:** 500KB max
- **Auto-Compression:** Future feature (currently manual)
- **Instant Preview:** See custom backgrounds immediately

## User Interface

### Location
**Settings Tab → Background Section**

```
Settings
├── 🎨 Theme
│   └── (Theme swatches)
└── Background
    ├── Choose Background (thumbnail grid)
    ├── 📸 Upload Custom Background (PRO)
    ├── BG Transparency (slider, 0-100%)
    └── ✨ Apply Blur Effect (toggle)
```

### Background Library Grid
- **Layout:** Auto-fill grid (80px minimum width)
- **Aspect Ratio:** 16:9
- **Hover Effect:** Border highlight + scale(1.05)
- **Selected State:** Primary color border + shadow
- **Locked State:** 🔒 PRO badge + opacity 0.6

## Technical Architecture

### Files
- **Component:** `src/popup/components/backgroundManager.ts`
- **Styles:** `src/popup/styles/backgrounds.css`
- **HTML:** `src/popup/popup-v2.html` (lines 313-346)
- **Library:** `src/lib/backgrounds.ts`

### Storage Schema

```typescript
// chrome.storage.local

// Background configuration
backgroundConfig: {
  enabled: boolean;
  source: 'library' | 'custom';
  backgroundId?: string;  // e.g., 'default_dark', 'mountains'
  customBackground?: string;  // base64 data URL
  opacity: number;  // 0-100 (legacy, not used)
  blur: boolean;
}

// User selection tracking
userSelectedBackground: boolean;  // true if user manually selected

// Transparency (separate from backgroundConfig)
bgTransparency: number;  // 0-100
```

### CSS Implementation

#### Background Image
```css
body {
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
```

#### Blur Effect (via ::before pseudo-element)
```css
body[data-bg-blur="true"]::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: var(--bg-image);
  background-size: var(--bg-size, cover);
  background-position: var(--bg-position, center);
  filter: var(--bg-blur, blur(8px));
  z-index: -1;
}
```

#### Transparency (via container overlay)
Applied to `.container` element using rgba() alpha channel:
```javascript
container.style.backgroundColor = `rgba(r, g, b, ${opacity / 100})`;
```

## Background Library

### Free Tier Backgrounds (6)

| ID | Name | Type | Description |
|---|---|---|---|
| `default_dark` | Dark Default | Gradient | Dark navy gradient (theme default) |
| `default_light` | Light Default | Gradient | Light blue gradient (theme default) |
| `mountains` | Mountains | Image | Snow-capped mountain peaks |
| `aurora` | Aurora | Image | Northern lights over landscape |
| `trees_and_stars` | Trees & Stars | Image | Forest silhouette under starry sky |
| `blue_sky_clouds` | Blue Sky | Image | Peaceful cloud formations |

### PRO Tier Backgrounds (8)

| ID | Name | Type | Description |
|---|---|---|---|
| `jungle_waterfall` | Jungle Waterfall | Image | Tropical waterfall scene |
| `desert_dunes` | Desert Dunes | Image | Golden sand dunes |
| `ocean_sunset` | Ocean Sunset | Image | Sunset over calm ocean |
| `forest_path` | Forest Path | Image | Sunlit forest trail |
| `abstract_purple` | Abstract Purple | Gradient | Purple/magenta gradient |
| `abstract_teal` | Abstract Teal | Gradient | Teal/cyan gradient |
| `abstract_sunset` | Abstract Sunset | Gradient | Orange/pink gradient |
| `abstract_forest` | Abstract Forest | Gradient | Green/emerald gradient |

## Bidirectional Theme/Background Sync

The system maintains a two-way relationship between classic themes and default backgrounds:

### Background → Theme
When user selects `default_dark` or `default_light` background:
- ✅ Sets matching Classic theme (Dark/Light)
- ✅ Sets transparency to 80% (show subtle background)
- 📍 Location: `backgroundManager.ts:213-237`

### Theme → Background
When user selects Classic Dark or Classic Light theme:
- ✅ Sets matching default background
- ✅ Sets transparency to 100% (hide background completely)
- 📍 Location: `backgroundManager.ts:477-517`, `settingsHandlers.ts:414-417`

### Auto-Theme Switching
When user switches between light/dark themes (non-classic):
- ✅ Automatically updates background to match theme mode
- ✅ Only applies if user hasn't explicitly selected a background
- 📍 Location: `backgroundManager.ts:523-551`

## PRO Feature Gating

### Free Users Can:
- ✅ Select from 6 free backgrounds
- ✅ Adjust BG transparency (0-100%)
- ✅ Apply blur effect
- ❌ Cannot select PRO backgrounds (locked with 🔒 badge)
- ❌ Cannot upload custom backgrounds

### PRO Users Can:
- ✅ All free features
- ✅ Select from all 14 backgrounds (6 free + 8 PRO)
- ✅ Upload custom backgrounds (500KB limit)
- ✅ Future: Crop and compress large images

### Enterprise Users
- Treated as PRO for background features
- Mapping: `tier === 'enterprise' ? 'pro' : tier`
- 📍 Location: `backgroundManager.ts:31`

## Event Flow

### Background Selection
```
User clicks thumbnail
  → handleBackgroundSelect()
    → Mark userSelectedBackground = true
    → Update backgroundConfig
    → saveBackgroundConfig()
      → applyBackground()
        → Set CSS variables (--bg-image, --bg-blur)
        → Apply to body element or ::before
      → Trigger bgTransparencyUpdate event
    → If default background selected:
      → Set matching theme
      → Set transparency to 80%
    → renderBackgroundLibrary() (update checkmarks)
```

### Transparency Adjustment
```
User drags slider
  → oninput: Update display value
  → onchange: Save to chrome.storage.local
    → Dispatch bgTransparencyUpdate event
      → applyBackgroundTransparency()
        → Update .container rgba() opacity
```

### Blur Toggle
```
User toggles switch
  → onchange: saveBackgroundConfig({ blur: checked })
    → applyBackground()
      → If blur: Set data-bg-blur="true" + --bg-blur var
      → If no blur: Remove attribute + direct bg
```

## Performance Considerations

### Blur Optimization
- **Without Blur:** Background applied directly to `body` (single layer)
- **With Blur:** Uses `::before` pseudo-element with `filter: blur(8px)`
- **Trade-off:** Slight performance cost for blur, but keeps content sharp

### Image Sizes
- **Thumbnails:** Small gradients or 80x45px preview images
- **Full Backgrounds:** ~200-350KB JPEGs, optimized for web
- **Custom Uploads:** 500KB limit (manual compression required)

### Storage
- **Library Backgrounds:** URLs only, images loaded from `/assets/backgrounds/`
- **Custom Backgrounds:** base64 data URLs stored in `chrome.storage.local`
- **Size Impact:** ~500KB per custom background

## User Experience

### First-Time Users
1. Extension installs with theme-matched default background
2. Background auto-switches when user changes theme
3. Transparency at 0% (solid container, background hidden)

### Discovering Backgrounds
1. Open Settings tab
2. Scroll to "Background" section
3. See grid of thumbnail previews
4. Click any thumbnail to apply instantly
5. PRO backgrounds show 🔒 badge + upgrade prompt

### Customization Flow
1. Select background from library
2. Adjust transparency slider to taste
3. Optionally enable blur effect
4. Settings persist across sessions

### PRO Upgrade Prompt
When free user clicks locked background:
```
Premium Backgrounds

Unlock all backgrounds and custom uploads.

Click "Upgrade to PRO" in Account Settings to get started.

[OK]
```

## Future Enhancements

### In Development (Q1 2025)
- [ ] **Image Editor & Compression:** Full-featured crop, scale, and compress tool for custom uploads
  - See: `docs/features/feature_image_editor.md`
  - Opens automatically when upload >500KB
  - Zoom, pan, rotate, crop controls
  - Smart compression with quality slider
  - Live file size preview
  - **Status:** Spec complete, ready for implementation

### Planned Features (Future)
- [ ] **Background Categories:** Filter by type (nature, abstract, etc.)
- [ ] **Community Backgrounds:** User-submitted, curated library
- [ ] **Dynamic Backgrounds:** Time-of-day based switching
- [ ] **Animated Backgrounds:** Subtle motion effects (PRO)
- [ ] **Blur Intensity:** Adjustable blur amount (0-20px)
- [ ] **Background Opacity:** Separate from container transparency

### Known Limitations
- Custom uploads >500KB require image editor (coming Q1 2025)
- No batch background management
- No background favorites/collections
- Blur is fixed at 8px (not adjustable)

## Testing Checklist

- [x] Free backgrounds selectable by all users
- [x] PRO backgrounds locked for free users
- [x] Custom upload button hidden for free users
- [x] Transparency slider works (0-100%)
- [x] Blur toggle applies CSS blur to background
- [x] Selected background persists across sessions
- [x] Theme switching auto-updates background
- [x] Background selection sets matching theme + 80% opacity
- [x] Classic theme selection sets background + 100% opacity
- [x] Checkmark shows on correct thumbnail
- [x] Hover effects work on all thumbnails
- [x] Locked backgrounds show upgrade prompt
- [x] Custom upload works for PRO users (file picker)
- [x] Build completes without errors

## Support & Troubleshooting

### Common Issues

**Background not showing:**
- Check transparency slider (must be <100%)
- Verify background is enabled in config
- Check browser console for errors

**Checkmark on wrong thumbnail:**
- Fixed: Async initialization now properly awaited
- Issue was: `loadBackgroundConfig()` not awaited before render

**Blur not working:**
- Ensure checkbox is enabled
- Check `data-bg-blur` attribute on body
- Verify `--bg-blur` CSS variable is set

**Custom upload fails:**
- Check file size (<500KB)
- Verify file type (JPEG, PNG, WebP only)
- Ensure user has PRO tier

## Documentation Updates

This feature requires updates to:
- [x] `feature_background_customization.md` (this file)
- [ ] `FEATURES_AUDIT.md` - Add background customization entry
- [ ] `PRO_FEATURE_GATING_AUDIT.md` - Document PRO backgrounds
- [ ] `docs/user-guide/getting-started.md` - Add background section
- [ ] `STORE_LISTING_FINAL_COPY.md` - Mention customization

## Related Files

### Core Implementation
- `src/popup/components/backgroundManager.ts` - Main logic
- `src/popup/components/settingsHandlers.ts` - Theme integration
- `src/lib/backgrounds.ts` - Background library definitions
- `src/popup/styles/backgrounds.css` - Blur effect CSS
- `src/popup/popup-v2.html` - UI markup

### Assets
- `public/assets/backgrounds/` - Background images
  - `mountains.jpg`
  - `aurora.jpg`
  - `trees_and_stars.jpg`
  - `blue_sky_clouds.jpg`
  - `jungle_waterfall_01.jpg`
  - `desert_dunes.jpg`
  - `ocean_sunset.jpg`
  - `forest_path.jpg`

## Changelog

### v1.0.0 (2025-01-07) - Initial Release
- ✅ Implemented background library (6 free + 8 PRO)
- ✅ Added transparency control (0-100%)
- ✅ Implemented blur effect toggle
- ✅ Added custom upload feature (PRO only)
- ✅ Implemented bidirectional theme/background sync
- ✅ Fixed async initialization bugs (checkmark issues)
- ✅ Moved UI from Account Settings to Settings tab
- ✅ Changed blur control from checkbox to toggle switch
- ✅ Optimized blur rendering with ::before pseudo-element

---

**Implementation Complete:** January 7, 2025
**Feature Status:** Production Ready ✅
