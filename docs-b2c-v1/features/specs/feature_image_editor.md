# Image Editor & Compression Feature

**Status:** ✅ IMPLEMENTED
**Version:** 1.0.0
**Release Date:** January 7, 2025
**Priority:** ✅ COMPLETE (Enhancement to background customization)

---

## Overview

The Image Editor & Compression feature enables PRO users to crop, scale, and compress custom background images before uploading them. This ensures images fit perfectly within the popup's unique portrait dimensions and stay under the 500KB size limit.

## Problem Statement

Users want to upload custom backgrounds, but face two challenges:

1. **Size Limit:** Images must be under 500KB
2. **Dimension Mismatch:** Popup has unique portrait dimensions (~400x600px)
3. **No Control:** Current implementation rejects large images with generic error

**Current Experience:**
```
User uploads 1993KB image
  ↓
❌ Warning: "Image too large (1993KB). Maximum size is 500KB."
  ↓
User forced to manually resize externally
```

**Desired Experience:**
```
User uploads 1993KB image
  ↓
✨ Image Editor opens automatically
  ↓
User crops/zooms to perfect area
  ↓
Auto-compress to <500KB
  ↓
✅ Save & Apply background
```

---

## Features

### 🎯 Core Capabilities

#### 1. Interactive Image Cropping
- **Zoom In/Out:** Mousewheel or +/- buttons
- **Pan/Move:** Drag to reposition image
- **Crop Selection:** Drag handles to select exact area
- **Rotate:** 90° increments if needed
- **Aspect Ratio Lock:** Optional, suggested ratio matches popup dimensions

#### 2. Smart Compression
- **Quality Slider:** 10-100% JPEG quality
- **Live Preview:** Shows final file size as you adjust
- **Auto-Quality:** Automatically finds optimal quality to hit <500KB target
- **Format Optimization:** Converts PNG to JPEG if needed for smaller size

#### 3. Real-Time Feedback
- **Size Indicator:** "Original: 1993KB → Cropped: 842KB → Compressed: 478KB ✓"
- **Visual Preview:** See exactly what background will look like
- **Dimension Display:** "Selected area: 400x600px (perfect fit!)"
- **Warning States:** Red indicator if still >500KB after compression

---

## User Flow

### Step 1: Upload Trigger
```
User clicks "Upload Custom Background"
  ↓
File picker opens (JPEG, PNG, WebP)
  ↓
User selects image
  ↓
Image size check:
  - If <500KB → Skip editor, apply directly ✅
  - If ≥500KB → Open Image Editor modal
```

### Step 2: Image Editor Modal (Crop Phase)
```
┌─────────────────────────────────────────┐
│  Image Editor - Crop & Scale            │
├─────────────────────────────────────────┤
│                                         │
│   [   Canvas Preview with Image   ]    │
│   [   Draggable crop overlay      ]    │
│                                         │
│  🔍 Zoom:  [-] ████████ [+]            │
│  📐 Rotate: [↶ 90°] [↷ 90°]            │
│  📏 Aspect: [Free] [16:9] [Match Popup]│
│                                         │
│  Original: 1993KB (3000x2000px)        │
│  Selected: 842KB (400x600px)           │
│                                         │
│  [Cancel]            [Next: Compress →]│
└─────────────────────────────────────────┘
```

### Step 3: Compression Phase
```
┌─────────────────────────────────────────┐
│  Image Editor - Compress                │
├─────────────────────────────────────────┤
│                                         │
│   [   Preview of cropped image    ]    │
│                                         │
│  Quality: ████████████░░░ 75%          │
│                                         │
│  Cropped:    842KB                     │
│  Compressed: 478KB ✅                   │
│  Target:     <500KB                    │
│                                         │
│  💡 Tip: Image will auto-compress to   │
│     fit under 500KB if you save now.   │
│                                         │
│  [← Back]              [Save & Apply]  │
└─────────────────────────────────────────┘
```

### Step 4: Save & Apply
```
Image compressed to 478KB
  ↓
Saved to chrome.storage.local as base64
  ↓
Applied as background immediately
  ↓
✅ Success toast: "Custom background applied!"
```

---

## Technical Implementation

### Technology Choice: **Cropper.js**

**Why Cropper.js:**
- ✅ **CSP Compliant** - Uses HTML5 Canvas, no inline scripts or eval()
- ✅ **Full-Featured** - Zoom, crop, rotate, move, scale
- ✅ **Touch-Enabled** - Works on all devices
- ✅ **Aspect Ratio Control** - Can lock to custom ratios
- ✅ **Popular & Maintained** - 13k+ GitHub stars, actively maintained
- ✅ **Lightweight** - ~45KB gzipped
- ✅ **Easy API** - Simple integration

**Library:** https://github.com/fengyuanchen/cropperjs

### Architecture

```typescript
// File: src/popup/components/imageEditor.ts

class ImageEditor {
  private cropper: Cropper;
  private originalFile: File;
  private canvas: HTMLCanvasElement;

  async open(file: File): Promise<string | null> {
    // Step 1: Load image into Cropper.js
    const imageUrl = URL.createObjectURL(file);
    this.cropper = new Cropper(imageElement, {
      aspectRatio: NaN, // Free crop by default
      viewMode: 1,
      guides: true,
      autoCropArea: 0.8,
    });

    // Step 2: Wait for user to crop
    await this.showCropModal();

    // Step 3: Get cropped canvas
    const croppedCanvas = this.cropper.getCroppedCanvas();

    // Step 4: Compress until <500KB
    const compressed = await this.compressToTarget(croppedCanvas, 500);

    // Step 5: Return base64 data URL
    return compressed;
  }

  private async compressToTarget(
    canvas: HTMLCanvasElement,
    targetKB: number
  ): Promise<string> {
    let quality = 0.9;
    let result = canvas.toDataURL('image/jpeg', quality);

    while (this.getBase64Size(result) > targetKB * 1024 && quality > 0.1) {
      quality -= 0.05;
      result = canvas.toDataURL('image/jpeg', quality);
    }

    return result;
  }

  private getBase64Size(base64: string): number {
    const base64Length = base64.length - 'data:image/jpeg;base64,'.length;
    return (base64Length * 3) / 4; // Convert base64 to bytes
  }
}
```

### File Structure

```
src/
├── popup/
│   ├── components/
│   │   ├── imageEditor.ts        (NEW - main editor logic)
│   │   ├── imageEditorModal.ts   (NEW - modal UI component)
│   │   └── backgroundManager.ts  (UPDATED - integrate editor)
│   ├── styles/
│   │   └── image-editor.css      (NEW - editor styling)
│   └── popup-v2.html             (UPDATED - add modal markup)
└── lib/
    └── cropper.min.js            (NEW - Cropper.js library)
```

### Integration with Background Manager

```typescript
// In backgroundManager.ts

async function handleCustomUpload(file: File) {
  console.log('[Background Manager] Processing custom upload:', file.name);

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showWarning('Please upload an image file (JPEG, PNG, or WebP).');
    return;
  }

  // Check file size
  const maxSize = 500 * 1024; // 500KB

  if (file.size > maxSize) {
    // NEW: Open Image Editor instead of rejecting
    const imageEditor = new ImageEditor();
    const compressedBase64 = await imageEditor.open(file);

    if (!compressedBase64) {
      // User cancelled
      return;
    }

    // Save compressed image
    const newConfig: BackgroundConfig = {
      ...currentConfig,
      enabled: true,
      source: 'custom',
      customBackground: compressedBase64,
    };

    await saveBackgroundConfig(newConfig);
    renderBackgroundLibrary();

    console.log('[Background Manager] Custom background uploaded and compressed successfully');
    return;
  }

  // File is already small enough, proceed as before
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target?.result as string;

    const newConfig: BackgroundConfig = {
      ...currentConfig,
      enabled: true,
      source: 'custom',
      customBackground: base64,
    };

    await saveBackgroundConfig(newConfig);
    renderBackgroundLibrary();
  };

  reader.readAsDataURL(file);
}
```

---

## UI/UX Design

### Modal Design Principles

1. **Progressive Disclosure:** Show crop first, then compression
2. **Live Feedback:** Always show current file size
3. **Smart Defaults:** Auto-suggest popup aspect ratio
4. **Escape Hatches:** Easy to cancel or go back
5. **Success States:** Clear confirmation when <500KB achieved

### Responsive Behavior

- **Desktop:** Full-featured editor with all controls
- **Mobile:** Touch-optimized pinch-to-zoom
- **Keyboard:** Arrow keys to nudge crop area

### Accessibility

- **Keyboard Navigation:** Tab through all controls
- **Screen Reader:** Announce size changes and warnings
- **High Contrast:** Controls visible in all themes
- **Focus Indicators:** Clear focus states on all interactive elements

---

## Compression Strategy

### Target: <500KB

**Priority 1: Smart Cropping**
- Most file size reduction comes from cropping unnecessary areas
- Encourage users to select just the area they need

**Priority 2: Quality Adjustment**
- Start at 90% quality
- Reduce by 5% increments until <500KB
- Never go below 10% quality (unusable)

**Priority 3: Format Conversion**
- PNG → JPEG conversion if needed (often 50-70% smaller)
- Preserve transparency by using solid background color

**Priority 4: Dimension Scaling**
- If quality reduction isn't enough, offer to scale dimensions down
- Suggest dimensions that match popup size (~400x600px)

### Algorithm

```typescript
async function compressImage(
  canvas: HTMLCanvasElement,
  targetBytes: number
): Promise<{ dataUrl: string; quality: number }> {
  let quality = 0.9;
  let dataUrl = '';
  let size = Infinity;

  while (size > targetBytes && quality >= 0.1) {
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    size = getBase64Size(dataUrl);

    if (size > targetBytes) {
      quality -= 0.05;
    }
  }

  // If still too large, suggest scaling down
  if (size > targetBytes) {
    const scale = Math.sqrt(targetBytes / size);
    const newWidth = Math.floor(canvas.width * scale);
    const newHeight = Math.floor(canvas.height * scale);

    return {
      dataUrl,
      quality,
      suggestion: `Image still too large. Reduce dimensions to ${newWidth}x${newHeight}?`
    };
  }

  return { dataUrl, quality };
}
```

---

## PRO Feature Gating

### Feature Tier: **PRO Only**

**Why PRO:**
- Custom backgrounds themselves are PRO-only
- Image editor is a value-add for PRO users
- Significant development cost
- Encourages PRO upgrades

**Free User Experience:**
```
Free user clicks locked background
  ↓
"Premium Backgrounds - Upgrade to PRO to unlock:
 • 8 additional backgrounds
 • Custom background upload
 • Image editor & compression"
  ↓
[View PRO Plans]
```

**PRO User Experience:**
```
PRO user uploads 1993KB image
  ↓
Image Editor opens automatically
  ↓
Full access to crop, scale, compress
  ↓
Save & apply instantly
```

---

## Success Metrics

### Key Metrics to Track

1. **Usage Rate:** % of PRO users who upload custom backgrounds
2. **Completion Rate:** % of users who complete editor flow vs. cancel
3. **Average File Size:** Before vs. after compression
4. **Quality Setting:** Most common quality level selected
5. **Time to Complete:** How long users spend in editor

### Success Criteria

- ✅ 90%+ compression success rate (<500KB final size)
- ✅ <30 seconds average time to crop & compress
- ✅ 80%+ user completion rate (not canceling)
- ✅ Zero CSP violations in Chrome
- ✅ Works on all supported browsers

---

## Future Enhancements

### Phase 2 Features (Post-Launch)

- [ ] **Preset Crop Ratios:** Quick buttons for common ratios
- [ ] **Filters & Effects:** Brightness, contrast, blur adjustments
- [ ] **Batch Upload:** Edit multiple images at once
- [ ] **Background Library:** Save multiple custom backgrounds
- [ ] **AI Auto-Crop:** Automatically detect and crop to subject
- [ ] **Undo/Redo:** Multi-level undo for editing actions
- [ ] **Smart Suggestions:** "This area would look great as a background!"

### Advanced Features (Future)

- [ ] **Animated Backgrounds:** GIF/WebM support with frame reduction
- [ ] **Video Backgrounds:** Short looping clips (<5 seconds)
- [ ] **Background Packs:** Curated collections of themed backgrounds
- [ ] **Community Backgrounds:** Share & download from other users
- [ ] **Seasonal Themes:** Auto-switching based on holidays/seasons

---

## Implementation Timeline

### Phase 1: Core Implementation (2-3 days)

**Day 1: Setup & Integration**
- [ ] Install Cropper.js library
- [ ] Create imageEditor.ts component
- [ ] Build modal UI structure
- [ ] Test CSP compliance

**Day 2: Crop Functionality**
- [ ] Implement crop controls (zoom, pan, rotate)
- [ ] Add aspect ratio presets
- [ ] Build live preview
- [ ] Test on various image sizes

**Day 3: Compression & Polish**
- [ ] Implement smart compression algorithm
- [ ] Add quality slider
- [ ] Build size indicator UI
- [ ] Add error handling
- [ ] Test edge cases (tiny images, huge images, weird formats)

### Phase 2: Testing & Refinement (1 day)

**Day 4: Testing**
- [ ] Test with 10+ different images
- [ ] Verify all formats (JPEG, PNG, WebP)
- [ ] Test on different screen sizes
- [ ] Performance testing (load time, memory usage)
- [ ] Accessibility audit

### Phase 3: Documentation (1 day)

**Day 5: Documentation**
- [ ] Update feature docs
- [ ] Add user guide section
- [ ] Create demo video/screenshots
- [ ] Update PRO feature gating docs

**Total Estimated Time:** 5 days

---

## Dependencies

### Required Libraries

1. **Cropper.js** (v1.6.2+)
   - Size: ~45KB gzipped
   - License: MIT
   - Source: https://github.com/fengyuanchen/cropperjs

### Browser Requirements

- **Chrome:** 90+ (HTML5 Canvas support)
- **Edge:** 90+ (Chromium-based)
- **Firefox:** Not supported (extension is Chrome-only)

### Storage Impact

- **Code:** ~50KB additional (imageEditor.ts + Cropper.js)
- **Per Image:** Up to 500KB per custom background
- **Total:** Minimal impact on extension size

---

## Security Considerations

### Content Security Policy (CSP)

**Cropper.js Compliance:**
- ✅ No `eval()` or `unsafe-eval`
- ✅ No inline scripts
- ✅ Uses HTML5 Canvas API only
- ✅ All scripts loaded from extension bundle

**Validation:**
- Verify file type before processing
- Sanitize file names
- Validate image dimensions
- Check for corrupted files

### Privacy

- **Local Processing:** All image editing happens client-side
- **No Upload:** Images never leave the user's machine
- **Storage:** Saved to local chrome.storage.local only
- **No Telemetry:** No tracking of uploaded images

---

## Testing Checklist

### Functionality Tests

- [ ] Upload JPEG < 500KB (should skip editor)
- [ ] Upload JPEG > 500KB (should open editor)
- [ ] Upload PNG > 500KB (should convert to JPEG)
- [ ] Upload WebP > 500KB (should handle correctly)
- [ ] Crop to small area (should reduce file size)
- [ ] Compress with quality slider (should update live)
- [ ] Cancel mid-edit (should not save)
- [ ] Rotate image (should maintain crop)
- [ ] Zoom in/out (should work smoothly)

### Edge Cases

- [ ] Upload 10MB image (should handle gracefully)
- [ ] Upload 100x100px image (should work without cropping)
- [ ] Upload corrupted file (should show error)
- [ ] Upload non-image file (should reject)
- [ ] Network interruption during save (should retry)
- [ ] Multiple rapid uploads (should queue)

### Performance Tests

- [ ] 5MB image loads in <2 seconds
- [ ] Cropping is responsive (<100ms lag)
- [ ] Compression completes in <3 seconds
- [ ] No memory leaks after 10+ edits
- [ ] Works smoothly on low-end devices

### Browser Compatibility

- [ ] Chrome 90+
- [ ] Chrome 120+ (latest)
- [ ] Edge 90+
- [ ] Edge (latest)

---

## Known Limitations

### Current Limitations

1. **File Size:** 500KB max (technical constraint for chrome.storage.local)
2. **Format:** Output is always JPEG (no transparency)
3. **Dimensions:** Recommended max 1920x1080px for performance
4. **Animation:** No support for animated GIFs (yet)

### Won't Fix (By Design)

- No cloud storage for images (privacy)
- No batch editing (simplicity)
- No advanced filters (scope creep)

---

## Support & Troubleshooting

### Common Issues

**Issue: "Image Editor won't open"**
- Check browser console for CSP errors
- Verify Cropper.js loaded correctly
- Clear extension cache and reload

**Issue: "Compressed image still too large"**
- Try cropping to smaller area first
- Reduce quality slider further
- Consider scaling down dimensions

**Issue: "Image quality too low after compression"**
- Start with higher resolution source image
- Crop less area to preserve detail
- Increase quality slider (may exceed 500KB)

---

## References

- **Cropper.js Docs:** https://github.com/fengyuanchen/cropperjs
- **HTML5 Canvas API:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Chrome Extension CSP:** https://developer.chrome.com/docs/extensions/develop/migrate/improve-security
- **Image Compression:** https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL

---

**Feature Status:** ✅ IMPLEMENTED (January 7, 2025)
**Documentation Version:** 1.1
**Last Updated:** January 7, 2025

---

## ✅ IMPLEMENTATION COMPLETE

### What's Implemented

The custom image editor is **fully functional** and production-ready:

- ✅ **Full-screen canvas editor** with dark background overlay
- ✅ **Pan & Zoom controls** - Mouse drag to pan, wheel to zoom (0.1x - 5x)
- ✅ **550×600px crop overlay** - Floating frame matching popup dimensions
- ✅ **Quality control slider** - 10% - 100% with live preview
- ✅ **Auto-compression** - Binary search algorithm to hit 500KB target
- ✅ **File size enforcement** - Blocks save if >500KB
- ✅ **Edit existing backgrounds** - Re-open and modify saved images
- ✅ **Delete functionality** - Remove custom backgrounds
- ✅ **Crop transformation fix** - Accurate CSS-to-canvas coordinate mapping

### Recent Fix: Crop Transformation Issue (January 7, 2025)

**Problem:** Crop calculation used static overlay dimensions (550×600) but CSS scaling (`max-width: 90vw`, `max-height: calc(90vh - 120px)`) caused mismatches on smaller screens.

**Solution:** Now uses actual displayed size from `getBoundingClientRect()`:

```typescript
// Get actual displayed size of overlay (imageEditor.ts:382-394)
const displayedCropWidth = overlayRect.width;
const displayedCropHeight = overlayRect.height;

// Convert crop position and size to canvas pixels
const cropX = cropXDisplay * scaleX;
const cropY = cropYDisplay * scaleY;
const cropWidth = displayedCropWidth * scaleX;
const cropHeight = displayedCropHeight * scaleY;
```

This ensures the crop region accurately reflects whatever size the overlay is displayed at, regardless of screen size or zoom level.

### Files Implemented

- `src/popup/components/imageEditor.ts` (680 lines) - Core editor logic
- `src/popup/components/backgroundManager.ts` (705 lines) - Integration
- `src/popup/styles/imageEditor.css` (295 lines) - Full-screen modal styling
- `src/popup/styles/backgrounds.css` - Gallery thumbnails

### Implementation Differences from Original Spec

**Changed:**
- ❌ **No Cropper.js** - Built custom canvas-based solution instead
- ✅ **Custom Implementation** - Better CSP compliance and control
- ✅ **Binary Search Compression** - More efficient than incremental reduction
- ✅ **getBoundingClientRect()** - More accurate than viewport calculations

**Why Custom Instead of Cropper.js:**
- Greater control over crop behavior and coordinates
- Simpler CSP compliance (no external library)
- Lighter weight (no 45KB dependency)
- Exact control over canvas pixel mapping

---
