/**
 * Image Editor Component
 * Full-screen modal with pan, zoom, and crop functionality
 * Allows users to scale and compress custom background images
 */

interface ImageEditorResult {
  success: boolean;
  dataURL?: string;
  size?: number;
  error?: string;
  deleted?: boolean;
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
}

let currentImage: HTMLImageElement | null = null;
let onSaveCallback: ((result: ImageEditorResult) => void) | null = null;
let isEditingExisting: boolean = false; // Track if editing existing custom background
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let viewState: ViewState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
};

// Crop area (matches extension popup dimensions: 550×600)
const cropArea = {
  width: 550,
  height: 600,
};

/**
 * Open image editor modal
 */
export function openImageEditor(fileOrDataURL: File | string, onSave: (result: ImageEditorResult) => void): void {
  const isFile = fileOrDataURL instanceof File;
  isEditingExisting = !isFile; // If not a file, we're editing existing background
  console.log('[Image Editor] Opening editor for:', isFile ? fileOrDataURL.name : 'existing image');

  onSaveCallback = onSave;

  // Create modal if it doesn't exist
  if (!document.getElementById('imageEditorModal')) {
    createImageEditorModal();
  } else {
    // Re-get canvas reference if modal already exists
    canvas = document.getElementById('imageEditorCanvas') as HTMLCanvasElement;
    if (canvas) {
      ctx = canvas.getContext('2d');
    }
  }

  // Load the image
  if (isFile) {
    loadImage(fileOrDataURL);
  } else {
    loadImageFromDataURL(fileOrDataURL);
  }

  // Show modal
  const modal = document.getElementById('imageEditorModal');
  if (modal) {
    modal.style.display = 'flex';
  }

  // Show/hide delete button based on whether editing existing background
  const deleteBtn = document.getElementById('imageEditorDelete');
  if (deleteBtn) {
    deleteBtn.style.display = isEditingExisting ? 'block' : 'none';
  }
}

/**
 * Create image editor modal UI
 */
function createImageEditorModal(): void {
  const modal = document.createElement('div');
  modal.id = 'imageEditorModal';
  modal.className = 'image-editor-modal-fullscreen';
  modal.innerHTML = `
    <div class="image-editor-overlay">
      <!-- Close Button (Top Right) -->
      <button id="imageEditorClose" class="image-editor-close-btn" title="Close">✕</button>

      <!-- Main Canvas Area (Full Screen) -->
      <div class="image-editor-canvas-container">
        <canvas id="imageEditorCanvas"></canvas>

        <!-- Floating Crop Overlay (550:600 ratio) -->
        <div id="cropOverlay" class="crop-overlay-floating">
          <div class="crop-border-floating"></div>
          <div class="crop-label-floating">Extension Size: 550×600px</div>
        </div>
      </div>

      <!-- Bottom Toolbar -->
      <div class="image-editor-toolbar">
        <!-- Left: Zoom Controls -->
        <div class="toolbar-section">
          <button id="zoomOut" class="toolbar-btn" title="Zoom Out">🔍−</button>
          <button id="zoomReset" class="toolbar-btn" title="Reset (100%)">100%</button>
          <button id="zoomIn" class="toolbar-btn" title="Zoom In">🔍+</button>
          <span id="zoomDisplay" class="toolbar-info">100%</span>
        </div>

        <!-- Center: Quality & Size -->
        <div class="toolbar-section toolbar-section-center">
          <label class="toolbar-label">
            Quality: <span id="qualityValue" class="toolbar-value">90%</span>
          </label>
          <input type="range" id="qualitySlider" min="10" max="100" value="90" class="toolbar-slider">
          <span class="toolbar-divider">|</span>
          <span class="toolbar-label">Size: <span id="fileSizeDisplay" class="toolbar-value">...</span></span>
        </div>

        <!-- Right: Action Buttons -->
        <div class="toolbar-section toolbar-section-right">
          <button id="autoCompressBtn" class="toolbar-btn toolbar-btn-secondary">🎯 Compress</button>
          <button id="imageEditorDelete" class="toolbar-btn toolbar-btn-danger" style="display: none;">🗑️ Delete</button>
          <button id="imageEditorSave" class="toolbar-btn toolbar-btn-primary">✓ Save</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Get canvas
  canvas = document.getElementById('imageEditorCanvas') as HTMLCanvasElement;
  if (canvas) {
    ctx = canvas.getContext('2d');
    setupCanvasListeners();
  }

  // Setup event listeners
  setupImageEditorListeners();
}

/**
 * Setup canvas mouse listeners for pan/drag
 */
function setupCanvasListeners(): void {
  if (!canvas) return;

  canvas.addEventListener('mousedown', (e) => {
    viewState.isDragging = true;
    viewState.dragStartX = e.clientX - viewState.offsetX;
    viewState.dragStartY = e.clientY - viewState.offsetY;
    canvas!.style.cursor = 'grabbing';
  });

  canvas.addEventListener('mousemove', (e) => {
    if (viewState.isDragging) {
      viewState.offsetX = e.clientX - viewState.dragStartX;
      viewState.offsetY = e.clientY - viewState.dragStartY;
      renderCanvas();
    }
  });

  canvas.addEventListener('mouseup', () => {
    viewState.isDragging = false;
    canvas!.style.cursor = 'grab';
  });

  canvas.addEventListener('mouseleave', () => {
    viewState.isDragging = false;
    canvas!.style.cursor = 'grab';
  });

  // Mouse wheel zoom
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    viewState.scale = Math.max(0.1, Math.min(5, viewState.scale + delta));
    updateZoomDisplay();
    renderCanvas();
  });
}

/**
 * Setup event listeners for controls
 */
function setupImageEditorListeners(): void {
  // Close button
  const closeBtn = document.getElementById('imageEditorClose');
  if (closeBtn) closeBtn.onclick = closeImageEditor;

  // Zoom controls
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomResetBtn = document.getElementById('zoomReset');

  if (zoomInBtn) zoomInBtn.onclick = () => handleZoom(0.2);
  if (zoomOutBtn) zoomOutBtn.onclick = () => handleZoom(-0.2);
  if (zoomResetBtn) zoomResetBtn.onclick = resetView;

  // Quality slider
  const qualitySlider = document.getElementById('qualitySlider') as HTMLInputElement;
  const qualityValue = document.getElementById('qualityValue');

  if (qualitySlider && qualityValue) {
    qualitySlider.oninput = () => {
      qualityValue.textContent = `${qualitySlider.value}%`;
    };

    qualitySlider.onchange = () => {
      updateFileSize();
    };
  }

  // Auto-compress button
  const autoCompressBtn = document.getElementById('autoCompressBtn');
  if (autoCompressBtn) {
    autoCompressBtn.onclick = handleAutoCompress;
  }

  // Save button
  const saveBtn = document.getElementById('imageEditorSave');
  if (saveBtn) {
    saveBtn.onclick = handleSave;
  }

  // Delete button
  const deleteBtn = document.getElementById('imageEditorDelete');
  if (deleteBtn) {
    deleteBtn.onclick = handleDelete;
  }

  // Close on overlay click
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
      initializeCanvas();
      resetView();
      updateFileSize();
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

/**
 * Load image from data URL (for editing existing backgrounds)
 */
function loadImageFromDataURL(dataURL: string): void {
  const img = new Image();
  img.onload = () => {
    currentImage = img;
    initializeCanvas();
    resetView();
    updateFileSize();
  };
  img.src = dataURL;
}

/**
 * Initialize canvas size
 */
function initializeCanvas(): void {
  if (!canvas || !currentImage) return;

  // Set canvas to fill available space
  const container = canvas.parentElement;
  if (container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  // Crop overlay is positioned via CSS (centered, floating)
  // No need to manually position it

  canvas.style.cursor = 'grab';
}

/**
 * Reset view to 100% original size
 */
function resetView(): void {
  if (!canvas || !currentImage) return;

  // Set to 100% original size (1:1 pixel ratio)
  viewState.scale = 1.0;

  // Center the image
  viewState.offsetX = (canvas.width - currentImage.width * viewState.scale) / 2;
  viewState.offsetY = (canvas.height - currentImage.height * viewState.scale) / 2;

  updateZoomDisplay();
  renderCanvas();
}

/**
 * Handle zoom in/out
 */
function handleZoom(delta: number): void {
  viewState.scale = Math.max(0.1, Math.min(5, viewState.scale + delta));
  updateZoomDisplay();
  renderCanvas();
}

/**
 * Update zoom display
 */
function updateZoomDisplay(): void {
  const display = document.getElementById('zoomDisplay');
  if (display) {
    display.textContent = `${Math.round(viewState.scale * 100)}%`;
  }
}

/**
 * Render canvas with current view state
 */
function renderCanvas(): void {
  if (!canvas || !ctx || !currentImage) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fill with dark background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw image with current transform
  const imgWidth = currentImage.width * viewState.scale;
  const imgHeight = currentImage.height * viewState.scale;

  ctx.drawImage(
    currentImage,
    viewState.offsetX,
    viewState.offsetY,
    imgWidth,
    imgHeight
  );
}

/**
 * Get cropped image data
 */
function getCroppedImage(): HTMLCanvasElement | null {
  if (!canvas || !ctx || !currentImage) return null;

  const overlay = document.getElementById('cropOverlay');
  if (!overlay) return null;

  // Get crop area position in screen coordinates
  const overlayRect = overlay.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();

  // Calculate crop position relative to canvas display (CSS pixels)
  const cropXDisplay = overlayRect.left - canvasRect.left;
  const cropYDisplay = overlayRect.top - canvasRect.top;

  // Get actual displayed size of overlay (might be scaled by max-width/max-height)
  const displayedCropWidth = overlayRect.width;
  const displayedCropHeight = overlayRect.height;

  // Calculate scale factor between canvas actual size and display size
  const scaleX = canvas.width / canvasRect.width;
  const scaleY = canvas.height / canvasRect.height;

  // Convert crop position and size to canvas pixels
  const cropX = cropXDisplay * scaleX;
  const cropY = cropYDisplay * scaleY;
  const cropWidth = displayedCropWidth * scaleX;
  const cropHeight = displayedCropHeight * scaleY;

  // Create crop canvas at the desired output size (550×600)
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropArea.width;
  cropCanvas.height = cropArea.height;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return null;

  // Extract and scale the cropped region to fit output size
  cropCtx.drawImage(
    canvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  return cropCanvas;
}

/**
 * Update file size display
 */
async function updateFileSize(): Promise<void> {
  const cropCanvas = getCroppedImage();
  if (!cropCanvas) return;

  const qualitySlider = document.getElementById('qualitySlider') as HTMLInputElement;
  const quality = parseInt(qualitySlider?.value || '90') / 100;

  return new Promise<void>((resolve) => {
    cropCanvas.toBlob(
      (blob) => {
        if (blob) {
          const sizeKB = blob.size / 1024;
          const fileSizeDisplay = document.getElementById('fileSizeDisplay');
          const saveBtn = document.getElementById('imageEditorSave') as HTMLButtonElement;

          if (fileSizeDisplay) {
            const color = sizeKB <= 500 ? 'var(--color-success)' : 'var(--color-danger)';
            fileSizeDisplay.innerHTML = `<span style="color: ${color};">${sizeKB.toFixed(0)}KB</span>`;
          }

          // Disable save button if over 500KB
          if (saveBtn) {
            if (sizeKB > 500) {
              saveBtn.setAttribute('disabled', 'true');
              saveBtn.title = 'Image is over 500KB - use Auto-Compress first';
            } else {
              saveBtn.removeAttribute('disabled');
              saveBtn.title = 'Save background';
            }
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
 * Handle auto-compress
 */
async function handleAutoCompress(): Promise<void> {
  const btn = document.getElementById('autoCompressBtn');
  if (btn) {
    btn.textContent = '⏳ Compressing...';
    btn.setAttribute('disabled', 'true');
  }

  try {
    // Find optimal quality for 500KB
    const optimalQuality = await findOptimalQuality(500);

    // Update slider
    const qualitySlider = document.getElementById('qualitySlider') as HTMLInputElement;
    const qualityValue = document.getElementById('qualityValue');
    if (qualitySlider && qualityValue) {
      qualitySlider.value = (optimalQuality * 100).toString();
      qualityValue.textContent = `${Math.round(optimalQuality * 100)}%`;
    }

    await updateFileSize();
    console.log('[Image Editor] Auto-compressed to quality:', Math.round(optimalQuality * 100));
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
 * Find optimal quality to reach target file size
 */
async function findOptimalQuality(targetKB: number): Promise<number> {
  const cropCanvas = getCroppedImage();
  if (!cropCanvas) throw new Error('Failed to get crop canvas');

  const targetBytes = targetKB * 1024;
  let minQuality = 0.1;
  let maxQuality = 1.0;
  let bestQuality = 0.9;

  // Binary search for optimal quality
  for (let i = 0; i < 10; i++) {
    const quality = (minQuality + maxQuality) / 2;
    const size = await getCompressedSize(cropCanvas, quality);

    if (Math.abs(size - targetBytes) < targetBytes * 0.05) {
      // Within 5% of target
      bestQuality = quality;
      break;
    }

    if (size > targetBytes) {
      maxQuality = quality;
    } else {
      minQuality = quality;
      bestQuality = quality; // Save this as it's under target
    }
  }

  return bestQuality;
}

/**
 * Get compressed size for given quality
 */
function getCompressedSize(canvas: HTMLCanvasElement, quality: number): Promise<number> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }
        resolve(blob.size);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Handle save
 */
async function handleSave(): Promise<void> {
  if (!onSaveCallback) return;

  const saveBtn = document.getElementById('imageEditorSave');
  if (saveBtn) {
    saveBtn.textContent = 'Saving...';
    saveBtn.setAttribute('disabled', 'true');
  }

  try {
    const cropCanvas = getCroppedImage();
    if (!cropCanvas) {
      throw new Error('Failed to get cropped image');
    }

    const qualitySlider = document.getElementById('qualitySlider') as HTMLInputElement;
    const quality = parseInt(qualitySlider?.value || '90') / 100;

    return new Promise<void>((resolve, reject) => {
      cropCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          const sizeKB = blob.size / 1024;
          if (sizeKB > 500) {
            const confirmResult = window.confirm(
              `Image is still ${sizeKB.toFixed(0)}KB (max 500KB).\n\n` +
              `Would you like to auto-compress it now?`
            );

            if (confirmResult) {
              handleAutoCompress().then(() => {
                // Try again after auto-compress
                handleSave();
              });
              if (saveBtn) {
                saveBtn.textContent = '✓ Save & Apply Background';
                saveBtn.removeAttribute('disabled');
              }
              resolve();
            } else {
              if (saveBtn) {
                saveBtn.textContent = '✓ Save & Apply Background';
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
      saveBtn.textContent = '✓ Save & Apply Background';
      saveBtn.removeAttribute('disabled');
    }
  }
}

/**
 * Handle delete custom background
 */
function handleDelete(): void {
  if (!onSaveCallback) return;

  const confirmed = window.confirm(
    'Are you sure you want to delete this custom background?\n\nThis action cannot be undone.'
  );

  if (!confirmed) return;

  console.log('[Image Editor] Deleting custom background');

  // Call the callback with deleted flag
  onSaveCallback({
    success: true,
    deleted: true,
  });

  closeImageEditor();
}

/**
 * Close image editor modal
 */
function closeImageEditor(): void {
  const modal = document.getElementById('imageEditorModal');
  if (modal) {
    modal.style.display = 'none';
  }

  // Clear image state (but keep canvas/ctx references for reuse)
  currentImage = null;
  onSaveCallback = null;
  viewState = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
  };
}
