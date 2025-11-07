/**
 * Background Manager Component
 * Handles background selection, customization, and application
 */

import {
  BACKGROUNDS,
  getAvailableBackgrounds,
  DEFAULT_BACKGROUND_CONFIG,
  type Background,
  type BackgroundConfig,
  type TierLevel
} from '../../lib/backgrounds';
import { useAppStore } from '../../lib/store';
import { showError, showProFeature, showWarning } from '../utils/modalUtils';

let currentConfig: BackgroundConfig = { ...DEFAULT_BACKGROUND_CONFIG };
let userTier: TierLevel = 'free';

/**
 * Initialize background manager in Account Settings modal
 */
export function initializeBackgroundManager() {
  console.log('[Background Manager] Initializing...');

  const store = useAppStore.getState();
  const tier = store.config?.account?.tier || 'free';
  // Map enterprise to pro for background features
  userTier = (tier === 'enterprise' ? 'pro' : tier) as TierLevel;

  // Load current config from storage
  loadBackgroundConfig();

  // Render background library
  renderBackgroundLibrary();

  // Setup event listeners
  setupEventListeners();

  // Show/hide PRO features based on tier
  updateUIForTier();

  console.log('[Background Manager] Initialized for tier:', userTier);
}

/**
 * Load background configuration from storage
 */
async function loadBackgroundConfig() {
  try {
    const result = await chrome.storage.local.get('backgroundConfig');
    if (result.backgroundConfig) {
      currentConfig = { ...DEFAULT_BACKGROUND_CONFIG, ...result.backgroundConfig };
      console.log('[Background Manager] Loaded config:', currentConfig);
    }
  } catch (error) {
    console.error('[Background Manager] Error loading config:', error);
  }
}

/**
 * Save background configuration to storage
 */
async function saveBackgroundConfig(config: BackgroundConfig) {
  try {
    await chrome.storage.local.set({ backgroundConfig: config });
    currentConfig = config;
    console.log('[Background Manager] Saved config:', config);

    // Apply background immediately
    applyBackground(config);
  } catch (error) {
    console.error('[Background Manager] Error saving config:', error);
  }
}

/**
 * Render background library thumbnails
 */
function renderBackgroundLibrary() {
  const container = document.getElementById('backgroundLibrary');
  if (!container) {
    console.error('[Background Manager] Library container not found');
    return;
  }

  const availableBackgrounds = getAvailableBackgrounds(userTier);
  const allBackgrounds = BACKGROUNDS;

  container.innerHTML = '';

  allBackgrounds.forEach((bg) => {
    const isAvailable = availableBackgrounds.includes(bg);
    const isSelected = currentConfig.backgroundId === bg.id;
    const thumbnail = createBackgroundThumbnail(bg, isAvailable, isSelected);
    container.appendChild(thumbnail);
  });
}

/**
 * Create a background thumbnail element
 */
function createBackgroundThumbnail(
  bg: Background,
  isAvailable: boolean,
  isSelected: boolean
): HTMLElement {
  const div = document.createElement('div');
  div.className = 'background-thumbnail';
  div.dataset.backgroundId = bg.id;
  div.dataset.name = bg.name;

  if (isSelected) {
    div.classList.add('selected');
  }

  if (!isAvailable) {
    div.classList.add('locked');
  }

  // Create preview element
  const preview = document.createElement('div');
  preview.className = 'background-thumbnail-preview';

  // Handle gradient vs image backgrounds
  if (bg.thumbnail.startsWith('gradient:')) {
    const gradient = bg.thumbnail.replace('gradient:', '');
    preview.style.background = gradient;
  } else if (bg.thumbnail) {
    preview.style.backgroundImage = `url('${bg.thumbnail}')`;
    preview.style.backgroundSize = 'cover';
    preview.style.backgroundPosition = 'center';
  } else {
    preview.style.background = '#1a1a2e';
  }

  div.appendChild(preview);

  // Add checkmark if selected
  if (isSelected) {
    const check = document.createElement('div');
    check.className = 'background-thumbnail-check';
    check.textContent = '✓';
    div.appendChild(check);
  }

  // Add lock icon for PRO backgrounds
  if (!isAvailable) {
    const lock = document.createElement('div');
    lock.className = 'background-thumbnail-lock';
    lock.textContent = '🔒 PRO';
    div.appendChild(lock);
  }

  // Add click handler
  div.onclick = () => handleBackgroundSelect(bg.id, isAvailable);

  return div;
}

/**
 * Handle background selection
 */
function handleBackgroundSelect(backgroundId: string, isAvailable: boolean) {
  if (!isAvailable) {
    // Show upgrade prompt
    showUpgradePrompt();
    return;
  }

  // Update config
  const newConfig: BackgroundConfig = {
    ...currentConfig,
    enabled: true,
    source: 'library',
    backgroundId,
  };

  saveBackgroundConfig(newConfig);

  // Re-render to update selection
  renderBackgroundLibrary();
}

/**
 * Setup event listeners for controls
 */
function setupEventListeners() {
  // Opacity slider
  const opacitySlider = document.getElementById('backgroundOpacity') as HTMLInputElement;
  const opacityValue = document.getElementById('opacityValue');

  if (opacitySlider) {
    opacitySlider.value = currentConfig.opacity.toString();
    if (opacityValue) {
      opacityValue.textContent = `${currentConfig.opacity}%`;
    }

    opacitySlider.oninput = () => {
      const value = parseInt(opacitySlider.value);
      if (opacityValue) {
        opacityValue.textContent = `${value}%`;
      }
    };

    opacitySlider.onchange = () => {
      const value = parseInt(opacitySlider.value);
      saveBackgroundConfig({ ...currentConfig, opacity: value });
    };
  }

  // Blur checkbox
  const blurCheckbox = document.getElementById('backgroundBlur') as HTMLInputElement;
  if (blurCheckbox) {
    blurCheckbox.checked = currentConfig.blur;

    blurCheckbox.onchange = () => {
      saveBackgroundConfig({ ...currentConfig, blur: blurCheckbox.checked });
    };
  }

  // Custom upload button
  const uploadBtn = document.getElementById('uploadCustomBackgroundBtn');
  const fileInput = document.getElementById('customBackgroundInput') as HTMLInputElement;

  if (uploadBtn && fileInput) {
    uploadBtn.onclick = () => {
      if (userTier !== 'pro') {
        showUpgradePrompt();
        return;
      }
      fileInput.click();
    };

    fileInput.onchange = async () => {
      if (fileInput.files && fileInput.files[0]) {
        await handleCustomUpload(fileInput.files[0]);
        fileInput.value = ''; // Reset input
      }
    };
  }
}

/**
 * Update UI based on user tier
 */
function updateUIForTier() {
  const customUploadSection = document.getElementById('customBackgroundUploadSection');
  const optionsSection = document.getElementById('backgroundOptionsSection');

  if (userTier === 'pro') {
    if (customUploadSection) customUploadSection.style.display = 'block';
    if (optionsSection) optionsSection.style.display = 'block';
  } else {
    if (customUploadSection) customUploadSection.style.display = 'none';
    if (optionsSection) optionsSection.style.display = 'none';
  }
}

/**
 * Handle custom background upload
 */
async function handleCustomUpload(file: File) {
  console.log('[Background Manager] Processing custom upload:', file.name);

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showWarning('Please upload an image file (JPEG, PNG, or WebP).');
    return;
  }

  // Check file size (500KB limit)
  const maxSize = 500 * 1024; // 500KB
  if (file.size > maxSize) {
    showWarning(`Image too large (${(file.size / 1024).toFixed(0)}KB).\n\nMaximum size is 500KB. Please use a smaller image or we'll compress it for you.`);
    // TODO: Open cropping modal with compression
    return;
  }

  try {
    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;

      // Save custom background
      const newConfig: BackgroundConfig = {
        ...currentConfig,
        enabled: true,
        source: 'custom',
        customBackground: base64,
      };

      await saveBackgroundConfig(newConfig);

      // Re-render library
      renderBackgroundLibrary();

      console.log('[Background Manager] Custom background uploaded successfully');
    };

    reader.readAsDataURL(file);
  } catch (error) {
    console.error('[Background Manager] Error uploading custom background:', error);
    showError('Failed to upload background. Please try again.');
  }
}

/**
 * Apply background to the extension UI
 * Background image goes on body, transparency affects .container
 */
function applyBackground(config: BackgroundConfig) {
  const body = document.body;

  if (!config.enabled || (!config.backgroundId && !config.customBackground)) {
    // Remove background
    body.style.backgroundImage = 'none';
    body.style.background = '';
    body.removeAttribute('data-custom-bg');
    return;
  }

  let backgroundValue = '';

  if (config.source === 'custom' && config.customBackground) {
    // Apply custom background
    backgroundValue = `url('${config.customBackground}')`;
  } else if (config.source === 'library' && config.backgroundId) {
    // Apply library background
    const bg = BACKGROUNDS.find((b) => b.id === config.backgroundId);
    if (bg) {
      if (bg.url.startsWith('gradient:')) {
        backgroundValue = bg.url.replace('gradient:', '');
      } else if (bg.url) {
        backgroundValue = `url('${bg.url}')`;
      }
    }
  }

  if (backgroundValue) {
    // Apply background image to body (fixed, behind everything)
    body.style.backgroundImage = backgroundValue;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundAttachment = 'fixed';

    // Mark that we have a custom background
    body.setAttribute('data-custom-bg', 'true');

    // Trigger transparency update to show the background
    // Load saved transparency value and apply it
    chrome.storage.local.get('bgTransparency', (result) => {
      const transparency = result.bgTransparency || 0;
      // Dispatch custom event to trigger transparency update
      window.dispatchEvent(new CustomEvent('bgTransparencyUpdate', { detail: transparency }));
    });

    console.log('[Background Manager] Applied background:', config);
  }
}

/**
 * Show upgrade prompt
 */
function showUpgradePrompt() {
  showProFeature('Premium Backgrounds', 'Unlock all backgrounds and custom uploads.\n\nClick "Upgrade to PRO" in Account Settings to get started.');
}

/**
 * Export for use in Account Settings modal
 */
export function onAccountSettingsOpened() {
  initializeBackgroundManager();
}

/**
 * Initialize background on popup load
 * Applies saved background configuration
 */
export async function initializeBackgroundOnLoad() {
  console.log('[Background Manager] Loading background on startup...');

  try {
    const result = await chrome.storage.local.get('backgroundConfig');
    if (result.backgroundConfig) {
      const config = { ...DEFAULT_BACKGROUND_CONFIG, ...result.backgroundConfig };
      applyBackground(config);
      console.log('[Background Manager] Background applied on load:', config);
    }
  } catch (error) {
    console.error('[Background Manager] Error loading background on startup:', error);
  }
}
