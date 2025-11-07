/**
 * Image Editor Component
 * Allows users to scale and compress custom background images
 * Simple canvas-based implementation for reliable compression
 */

interface ImageEditorResult {
  success: boolean;
  dataURL?: string;
  size?: number;
  error?: string;
}

let currentImage: HTMLImageElement | null = null;
let onSaveCallback: ((result: ImageEditorResult) => void) | null = null;

/**
 * Open image editor modal
 */
export function openImageEditor(file: File, onSave: (result: ImageEditorResult) => void): void {
  console.log('[Image Editor] Opening editor for:', file.name, `(${(file.size / 1024).toFixed(0)}KB)`);

  onSaveCallback = onSave;

  // Create modal if it doesn't exist
  if (!document.getElementById('imageEditorModal')) {
    createImageEditorModal();
  }

  // Load the image
  loadImage(file);

  // Show modal
  const modal = document.getElementById('imageEditorModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Create image editor modal UI
 */
function createImageEditorModal(): void {
  const modal = document.createElement('div');
  modal.id = 'imageEditorModal';
  modal.className = 'image-editor-modal';
  modal.innerHTML = `
    <div class="image-editor-container">
      <div class="image-editor-header">
        <h3>Compress Background Image</h3>
        <button id="imageEditorClose" class="image-editor-close" title="Close">&times;</button>
      </div>

      <div class="image-editor-content">
        <!-- Image preview area -->
        <div class="image-editor-preview">
          <canvas id="imageEditorCanvas" style="max-width: 100%; max-height: 100%;"></canvas>
        </div>

        <!-- Controls -->
        <div class="image-editor-controls">
          <!-- Scale Controls -->
          <div class="image-editor-section">
            <h4>Image Scale</h4>
            <div style="margin-bottom: 0.5rem;">
              <label style="display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--text-secondary);">
                <span>Scale</span>
                <span id="scaleValue" style="color: var(--text-primary);">100%</span>
              </label>
              <input type="range" id="scaleSlider" min="10" max="100" value="100" style="width: 100%;">
            </div>
            <p style="font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0.5rem 0;">
              Reduce scale to make the image smaller and compress file size.
            </p>
          </div>

          <!-- Compression -->
          <div class="image-editor-section">
            <h4>Compression Quality</h4>
            <div style="margin-bottom: 0.5rem;">
              <label style="display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--text-secondary);">
                <span>Quality</span>
                <span id="qualityValue" style="color: var(--text-primary);">90%</span>
              </label>
              <input type="range" id="qualitySlider" min="10" max="100" value="90" style="width: 100%;">
            </div>
            <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: 0.5rem;">
              <span>File Size:</span>
              <span id="fileSizeDisplay" style="color: var(--text-primary); font-weight: 500;">Calculating...</span>
            </div>
            <button id="autoCompressBtn" class="editor-btn" style="width: 100%; margin-top: 0.5rem;">🎯 Auto-Compress to 500KB</button>
          </div>

          <!-- Info -->
          <div class="image-editor-section">
            <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius-sm); font-size: var(--font-size-xs); color: var(--text-secondary);">
              <p style="margin: 0 0 0.5rem 0;"><strong>Tip:</strong> Lower the scale first for faster compression.</p>
              <p style="margin: 0;">Max file size: 500KB</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="image-editor-footer">
        <button id="imageEditorCancel" class="btn-secondary">Cancel</button>
        <button id="imageEditorSave" class="btn-primary">Save & Apply Background</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Setup event listeners
  setupImageEditorListeners();
}

/**
 * Setup event listeners for image editor controls
 */
function setupImageEditorListeners(): void {
  // Close buttons
  const closeBtn = document.getElementById('imageEditorClose');
  const cancelBtn = document.getElementById('imageEditorCancel');
  const saveBtn = document.getElementById('imageEditorSave');

  if (closeBtn) closeBtn.onclick = closeImageEditor;
  if (cancelBtn) cancelBtn.onclick = closeImageEditor;
  if (saveBtn) saveBtn.onclick = handleSave;

  // Scale slider
  const scaleSlider = document.getElementById('scaleSlider') as HTMLInputElement;
  const scaleValue = document.getElementById('scaleValue');

  if (scaleSlider && scaleValue) {
    scaleSlider.oninput = () => {
      scaleValue.textContent = `${scaleSlider.value}%`;
    };

    scaleSlider.onchange = async () => {
      await renderPreview();
      await updateFileSize();
    };
  }

  // Quality slider
  const qualitySlider = document.getElementById('qualitySlider') as HTMLInputElement;
  const qualityValue = document.getElementById('qualityValue');

  if (qualitySlider && qualityValue) {
    qualitySlider.oninput = () => {
      qualityValue.textContent = `${qualitySlider.value}%`;
    };

    qualitySlider.onchange = async () => {
      await updateFileSize();
    };
  }

  // Auto-compress button
  const autoCompressBtn = document.getElementById('autoCompressBtn');
  if (autoCompressBtn) {
    autoCompressBtn.onclick = handleAutoCompress;
  }

  // Close modal on background click
  const modal = document.getElementById('imageEditorModal');
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeImageEditor();
      }
    };
  }
}

/**
 * Load image from file
 */
function loadImage(file: File): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      renderPreview();
      updateFileSize();
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

/**
 * Render image preview on canvas
 */
async function renderPreview(): Promise<void> {
  if (!currentImage) return;

  const canvas = document.getElementById('imageEditorCanvas') as HTMLCanvasElement;
  if (!canvas) return;

  const scaleSlider = document.getElementById('scaleSlider') as HTMLInputElement;
  const scale = parseInt(scaleSlider?.value || '100') / 100;

  // Calculate scaled dimensions
  const width = Math.floor(currentImage.width * scale);
  const height = Math.floor(currentImage.height * scale);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(currentImage, 0, 0, width, height);
  }
}

/**
 * Update file size display
 */
async function updateFileSize(): Promise<void> {
  const canvas = document.getElementById('imageEditorCanvas') as HTMLCanvasElement;
  if (!canvas) return;

  const qualitySlider = document.getElementById('qualitySlider') as HTMLInputElement;
  const quality = parseInt(qualitySlider?.value || '90') / 100;

  return new Promise<void>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const sizeKB = blob.size / 1024;
          const fileSizeDisplay = document.getElementById('fileSizeDisplay');
          if (fileSizeDisplay) {
            const color = sizeKB <= 500 ? 'var(--color-success)' : 'var(--color-danger)';
            fileSizeDisplay.innerHTML = `<span style="color: ${color};">${sizeKB.toFixed(0)}KB</span>`;
          }
        }
        resolve();
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Handle auto-compress to 500KB
 */
async function handleAutoCompress(): Promise<void> {
  const btn = document.getElementById('autoCompressBtn');
  if (btn) {
    btn.textContent = '⏳ Compressing...';
    btn.setAttribute('disabled', 'true');
  }

  try {
    const result = await findOptimalSettings(500);

    // Update sliders
    const scaleSlider = document.getElementById('scaleSlider') as HTMLInputElement;
    const scaleValue = document.getElementById('scaleValue');
    const qualitySlider = document.getElementById('qualitySlider') as HTMLInputElement;
    const qualityValue = document.getElementById('qualityValue');

    if (scaleSlider && scaleValue) {
      scaleSlider.value = (result.scale * 100).toString();
      scaleValue.textContent = `${Math.round(result.scale * 100)}%`;
    }

    if (qualitySlider && qualityValue) {
      qualitySlider.value = (result.quality * 100).toString();
      qualityValue.textContent = `${Math.round(result.quality * 100)}%`;
    }

    // Re-render with new settings
    await renderPreview();
    await updateFileSize();

    console.log('[Image Editor] Auto-compressed to', (result.size / 1024).toFixed(0), 'KB');
  } catch (error) {
    console.error('[Image Editor] Auto-compress failed:', error);
  } finally {
    if (btn) {
      btn.textContent = '🎯 Auto-Compress to 500KB';
      btn.removeAttribute('disabled');
    }
  }
}

/**
 * Find optimal scale and quality to reach target file size
 */
async function findOptimalSettings(targetKB: number): Promise<{ scale: number; quality: number; size: number }> {
  if (!currentImage) {
    throw new Error('No image loaded');
  }

  const targetBytes = targetKB * 1024;
  let bestResult = { scale: 1, quality: 0.9, size: Infinity };

  // Try different scale values
  for (const scale of [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]) {
    // Binary search for quality at this scale
    let minQuality = 0.1;
    let maxQuality = 1.0;

    for (let i = 0; i < 8; i++) {
      const quality = (minQuality + maxQuality) / 2;
      const result = await compressWithSettings(scale, quality);

      if (Math.abs(result.size - targetBytes) < Math.abs(bestResult.size - targetBytes)) {
        bestResult = { scale, quality, size: result.size };
      }

      if (result.size > targetBytes) {
        maxQuality = quality;
      } else {
        minQuality = quality;
      }
    }

    // If we found a good result, stop
    if (bestResult.size <= targetBytes) {
      break;
    }
  }

  return bestResult;
}

/**
 * Compress image with given settings
 */
function compressWithSettings(scale: number, quality: number): Promise<{ size: number }> {
  if (!currentImage) {
    return Promise.reject(new Error('No image loaded'));
  }

  const canvas = document.createElement('canvas');
  const width = Math.floor(currentImage.width * scale);
  const height = Math.floor(currentImage.height * scale);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Failed to get canvas context'));
  }

  ctx.drawImage(currentImage, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }
        resolve({ size: blob.size });
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Handle save button click
 */
async function handleSave(): Promise<void> {
  if (!onSaveCallback) return;

  const saveBtn = document.getElementById('imageEditorSave');
  if (saveBtn) {
    saveBtn.textContent = 'Saving...';
    saveBtn.setAttribute('disabled', 'true');
  }

  try {
    const canvas = document.getElementById('imageEditorCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas not found');
    }

    const qualitySlider = document.getElementById('qualitySlider') as HTMLInputElement;
    const quality = parseInt(qualitySlider?.value || '90') / 100;

    return new Promise<void>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          const sizeKB = blob.size / 1024;
          if (sizeKB > 500) {
            const confirm = window.confirm(
              `Image is still ${sizeKB.toFixed(0)}KB (max 500KB).\n\n` +
              `Would you like to auto-compress it now?`
            );

            if (confirm) {
              handleAutoCompress().then(() => {
                // Try again after auto-compress
                handleSave();
              });
              if (saveBtn) {
                saveBtn.textContent = 'Save & Apply Background';
                saveBtn.removeAttribute('disabled');
              }
              resolve();
            } else {
              if (saveBtn) {
                saveBtn.textContent = 'Save & Apply Background';
                saveBtn.removeAttribute('disabled');
              }
              resolve();
            }
            return;
          }

          // Convert to data URL
          const reader = new FileReader();
          reader.onload = () => {
            onSaveCallback?.({
              success: true,
              dataURL: reader.result as string,
              size: blob.size,
            });
            closeImageEditor();
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        quality
      );
    });
  } catch (error) {
    console.error('[Image Editor] Save failed:', error);
    onSaveCallback?.({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    if (saveBtn) {
      saveBtn.textContent = 'Save & Apply Background';
      saveBtn.removeAttribute('disabled');
    }
  }
}

/**
 * Close image editor modal
 */
function closeImageEditor(): void {
  const modal = document.getElementById('imageEditorModal');
  if (modal) {
    modal.style.display = 'none';
  }

  // Clear state
  currentImage = null;
  onSaveCallback = null;
}
