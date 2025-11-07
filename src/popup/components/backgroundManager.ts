/**
 * Background Manager Component
 * Handles background selection, customization, and application
 */

import {
  BACKGROUNDS,
  getAvailableBackgrounds,
  DEFAULT_BACKGROUND_CONFIG,
  getThemeDefaultBackground,
  type Background,
  type BackgroundConfig,
  type TierLevel
} from '../../lib/backgrounds';
import { useAppStore } from '../../lib/store';
import { showError, showProFeature, showWarning } from '../utils/modalUtils';
import { openImageEditor } from './imageEditor';

let currentConfig: BackgroundConfig = { ...DEFAULT_BACKGROUND_CONFIG };
let userTier: TierLevel = 'free';
let userHasExplicitSelection = false; // Track if user manually selected a background

/**
 * Initialize background manager in Settings tab
 */
export async function initializeBackgroundManager() {
  console.log('[Background Manager] Initializing...');

  const store = useAppStore.getState();
  const tier = store.config?.account?.tier || 'free';
  // Map enterprise to pro for background features
  userTier = (tier === 'enterprise' ? 'pro' : tier) as TierLevel;

  // Load current config from storage (MUST await before rendering!)
  await loadBackgroundConfig();

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
    const result = await chrome.storage.local.get(['backgroundConfig', 'userSelectedBackground']);

    // Check if user has explicitly selected a background
    userHasExplicitSelection = result.userSelectedBackground || false;

    if (result.backgroundConfig) {
      currentConfig = { ...DEFAULT_BACKGROUND_CONFIG, ...result.backgroundConfig };
    } else {
      // No saved config - initialize with theme-based default
      currentConfig = { ...DEFAULT_BACKGROUND_CONFIG };
    }

    // Auto-select theme default if no explicit user selection
    if (!userHasExplicitSelection) {
      const isDarkTheme = document.body.getAttribute('data-theme-mode') === 'dark';
      const themeDefaultId = getThemeDefaultBackground(isDarkTheme);

      currentConfig.backgroundId = themeDefaultId;
      currentConfig.enabled = true;

      console.log('[Background Manager] Auto-selected theme default:', themeDefaultId);
    }

    console.log('[Background Manager] Loaded config:', currentConfig);
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
async function handleBackgroundSelect(backgroundId: string, isAvailable: boolean) {
  if (!isAvailable) {
    // Show upgrade prompt
    showUpgradePrompt();
    return;
  }

  // Mark that user has explicitly selected a background
  userHasExplicitSelection = true;
  chrome.storage.local.set({ userSelectedBackground: true });

  // Reset transparency to default when selecting theme defaults (better readability)
  const isThemeDefault = backgroundId === 'default_dark' || backgroundId === 'default_light';
  const opacity = isThemeDefault ? 80 : currentConfig.opacity;

  // Update config
  const newConfig: BackgroundConfig = {
    ...currentConfig,
    enabled: true,
    source: 'library',
    backgroundId,
    opacity,
  };

  // Save config and wait for it to complete
  await saveBackgroundConfig(newConfig);

  // Bidirectional sync: Selecting default background sets matching theme + 80% opacity
  if (isThemeDefault) {
    // Set transparency to 80% (show subtle background)
    const slider = document.getElementById('bgTransparencySlider') as HTMLInputElement;
    const valueDisplay = document.getElementById('bgTransparencyValue');
    if (slider) slider.value = '80';
    if (valueDisplay) valueDisplay.textContent = '80%';

    // Save transparency setting
    await chrome.storage.local.set({ bgTransparency: 80 });

    // Trigger the actual transparency update
    window.dispatchEvent(new CustomEvent('bgTransparencyUpdate', { detail: 80 }));

    // Set matching theme (classic dark/light)
    const store = useAppStore.getState();
    const themeName = backgroundId === 'default_dark' ? 'classic-dark' : 'classic-light';

    await store.updateSettings({ theme: themeName });

    // Apply theme immediately
    const { applyTheme } = await import('./settingsHandlers');
    await applyTheme(themeName);

    console.log('[Background Manager] Selected default background → Set theme:', themeName, '+ 80% opacity');
  }

  // Re-render to update selection (now currentConfig is updated)
  renderBackgroundLibrary();
}

/**
 * Setup event listeners for controls
 */
function setupEventListeners() {
  // Note: BG Transparency slider is handled by settingsHandlers.ts
  // It uses bgTransparencySlider ID and controls container transparency

  // Blur checkbox - applies CSS blur to background image
  const blurCheckbox = document.getElementById('backgroundBlur') as HTMLInputElement;
  if (blurCheckbox) {
    blurCheckbox.checked = currentConfig.blur;

    blurCheckbox.onchange = () => {
      saveBackgroundConfig({ ...currentConfig, blur: blurCheckbox.checked });
    };
  }

  // Custom upload button (PRO only)
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

  // Custom upload is PRO only
  if (userTier === 'pro') {
    if (customUploadSection) customUploadSection.style.display = 'block';
  } else {
    if (customUploadSection) customUploadSection.style.display = 'none';
  }

  // Note: Background Options (transparency slider & blur) are now available to all users
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
    // Open image editor for cropping and compression
    console.log('[Background Manager] Image too large, opening editor...');
    openImageEditor(file, handleImageEditorResult);
    return;
  }

  // Small enough - apply directly
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
 * Handle result from image editor
 */
async function handleImageEditorResult(result: { success: boolean; dataURL?: string; size?: number; error?: string }) {
  if (!result.success) {
    showError(result.error || 'Failed to process image. Please try again.');
    return;
  }

  if (!result.dataURL) {
    showError('No image data received. Please try again.');
    return;
  }

  try {
    // Save custom background
    const newConfig: BackgroundConfig = {
      ...currentConfig,
      enabled: true,
      source: 'custom',
      customBackground: result.dataURL,
    };

    await saveBackgroundConfig(newConfig);

    // Re-render library
    renderBackgroundLibrary();

    const sizeKB = result.size ? (result.size / 1024).toFixed(0) : 'unknown';
    console.log('[Background Manager] Custom background saved successfully:', sizeKB, 'KB');
  } catch (error) {
    console.error('[Background Manager] Error saving custom background:', error);
    showError('Failed to save background. Please try again.');
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
    body.style.setProperty('--bg-blur', 'none');
    body.removeAttribute('data-custom-bg');
    body.removeAttribute('data-bg-blur');
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
    // Store background in CSS variable for ::before pseudo-element
    body.style.setProperty('--bg-image', backgroundValue);
    body.style.setProperty('--bg-size', 'cover');
    body.style.setProperty('--bg-position', 'center');

    // Apply blur effect if enabled
    if (config.blur) {
      body.style.setProperty('--bg-blur', 'blur(8px)');
      body.setAttribute('data-bg-blur', 'true');
    } else {
      body.style.setProperty('--bg-blur', 'none');
      body.removeAttribute('data-bg-blur');
    }

    // If no blur, apply background directly to body (better performance)
    // If blur is enabled, CSS will apply it via ::before pseudo-element
    if (!config.blur) {
      body.style.backgroundImage = backgroundValue;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundAttachment = 'fixed';
    } else {
      // Clear direct background when using blur (::before will handle it)
      body.style.backgroundImage = 'none';
    }

    // Mark that we have a custom background
    body.setAttribute('data-custom-bg', 'true');

    // Trigger transparency update to show the background
    // Load saved transparency value and apply it
    chrome.storage.local.get('bgTransparency', (result) => {
      const transparency = result.bgTransparency || 0;
      // Dispatch custom event to trigger transparency update
      window.dispatchEvent(new CustomEvent('bgTransparencyUpdate', { detail: transparency }));
    });

    console.log('[Background Manager] Applied background with blur:', config.blur);
  }
}

/**
 * Show upgrade prompt
 */
function showUpgradePrompt() {
  showProFeature('Premium Backgrounds', 'Unlock all backgrounds and custom uploads.\n\nClick "Upgrade to PRO" in Account Settings to get started.');
}

/**
 * Export for use in Settings tab
 */
export function initializeBackgroundSettings() {
  initializeBackgroundManager();
}

/**
 * Initialize background on popup load
 * Applies saved background configuration or theme-based default
 */
export async function initializeBackgroundOnLoad() {
  console.log('[Background Manager] Loading background on startup...');

  try {
    const result = await chrome.storage.local.get(['backgroundConfig', 'userSelectedBackground']);
    const userHasSelection = result.userSelectedBackground || false;

    let config: BackgroundConfig;

    if (result.backgroundConfig) {
      config = { ...DEFAULT_BACKGROUND_CONFIG, ...result.backgroundConfig };
    } else {
      config = { ...DEFAULT_BACKGROUND_CONFIG };
    }

    // Auto-select theme default if no explicit user selection
    if (!userHasSelection) {
      const isDarkTheme = document.body.getAttribute('data-theme-mode') === 'dark';
      const themeDefaultId = getThemeDefaultBackground(isDarkTheme);

      config.backgroundId = themeDefaultId;
      config.enabled = true;

      console.log('[Background Manager] Auto-selected theme default on load:', themeDefaultId);
    }

    applyBackground(config);
    console.log('[Background Manager] Background applied on load:', config);
  } catch (error) {
    console.error('[Background Manager] Error loading background on startup:', error);
  }
}

/**
 * Handle classic theme selection
 * Bidirectional sync: Selecting classic theme sets matching background + 100% opacity
 */
export async function onClassicThemeSelected(themeName: 'classic-dark' | 'classic-light') {
  console.log('[Background Manager] Classic theme selected:', themeName);

  // Determine matching background
  const backgroundId = themeName === 'classic-dark' ? 'default_dark' : 'default_light';

  // Update background config
  const newConfig: BackgroundConfig = {
    ...currentConfig,
    enabled: true,
    source: 'library',
    backgroundId,
    opacity: 80, // Keep at 80 for the background config
  };

  await chrome.storage.local.set({ backgroundConfig: newConfig });
  currentConfig = newConfig;

  // Set transparency to 100% (hide background completely)
  const slider = document.getElementById('bgTransparencySlider') as HTMLInputElement;
  const valueDisplay = document.getElementById('bgTransparencyValue');
  if (slider) slider.value = '100';
  if (valueDisplay) valueDisplay.textContent = '100%';

  // Save transparency setting
  await chrome.storage.local.set({ bgTransparency: 100 });

  // Trigger the actual transparency update
  window.dispatchEvent(new CustomEvent('bgTransparencyUpdate', { detail: 100 }));

  // Apply background (will be hidden by 100% opacity)
  applyBackground(newConfig);

  // Re-render if UI is visible
  const container = document.getElementById('backgroundLibrary');
  if (container) {
    renderBackgroundLibrary();
  }

  console.log('[Background Manager] Classic theme → Set background:', backgroundId, '+ 100% opacity');
}

/**
 * Handle theme changes
 * Updates background to match new theme if no explicit user selection
 */
export async function onThemeChange(isDarkTheme: boolean) {
  console.log('[Background Manager] Theme changed to:', isDarkTheme ? 'dark' : 'light');

  try {
    const result = await chrome.storage.local.get(['backgroundConfig', 'userSelectedBackground']);
    const userHasSelection = result.userSelectedBackground || false;

    // Only auto-switch if user hasn't explicitly selected a background
    if (!userHasSelection) {
      const themeDefaultId = getThemeDefaultBackground(isDarkTheme);

      const newConfig: BackgroundConfig = {
        ...DEFAULT_BACKGROUND_CONFIG,
        ...(result.backgroundConfig || {}),
        backgroundId: themeDefaultId,
        enabled: true,
      };

      await chrome.storage.local.set({ backgroundConfig: newConfig });
      applyBackground(newConfig);

      console.log('[Background Manager] Auto-switched to theme default:', themeDefaultId);
    } else {
      console.log('[Background Manager] User has explicit selection, not auto-switching');
    }
  } catch (error) {
    console.error('[Background Manager] Error handling theme change:', error);
  }
}
