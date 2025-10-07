/**
 * Popup UI Script - V2
 * Manages the tabbed extension popup interface
 */

// ========== TAB NAVIGATION ==========

document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
  initUI();
  loadInitialData();
});

/**
 * Initialize tab switching functionality
 */
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const targetTab = document.getElementById(`${tabName}-tab`);
      if (targetTab) {
        targetTab.classList.add('active');
      }

      console.log(`[Popup V2] Switched to ${tabName} tab`);
    });
  });
}

/**
 * Initialize UI event listeners
 */
function initUI() {
  // Aliases tab
  const addProfileBtn = document.getElementById('addProfileBtn');
  const addProfileBtnEmpty = document.getElementById('addProfileBtnEmpty');

  addProfileBtn?.addEventListener('click', showAddProfileForm);
  addProfileBtnEmpty?.addEventListener('click', showAddProfileForm);

  // Settings tab
  const enabledToggle = document.getElementById('enabledToggle') as HTMLInputElement;
  const emailOptInToggle = document.getElementById('emailOptInToggle') as HTMLInputElement;
  const subscribeBtn = document.getElementById('subscribeBtn');
  const clearStatsBtn = document.getElementById('clearStatsBtn');
  const exportProfilesBtn = document.getElementById('exportProfilesBtn');

  enabledToggle?.addEventListener('change', handleEnabledToggle);
  emailOptInToggle?.addEventListener('change', handleEmailOptInToggle);
  subscribeBtn?.addEventListener('click', handleSubscribe);
  clearStatsBtn?.addEventListener('click', handleClearStats);
  exportProfilesBtn?.addEventListener('click', handleExportProfiles);

  // Debug tab
  const clearLogBtn = document.getElementById('clearLogBtn');
  clearLogBtn?.addEventListener('click', handleClearLog);

  console.log('[Popup V2] UI initialized');
}

/**
 * Load initial data from storage
 */
async function loadInitialData() {
  try {
    // TODO: Load from Zustand store once implemented
    // For now, show placeholders
    renderPlaceholderProfiles();
    renderPlaceholderStats();
    renderPlaceholderDebugLog();
  } catch (error) {
    console.error('[Popup V2] Error loading data:', error);
  }
}

// ========== ALIASES TAB ==========

function showAddProfileForm() {
  console.log('[Popup V2] Add profile clicked');
  // TODO: Implement profile editor modal
  alert('Profile editor coming soon! This will open a form to create a new identity profile.');
}

function renderPlaceholderProfiles() {
  const profileList = document.getElementById('profileList');
  const emptyState = document.getElementById('profilesEmptyState');

  if (!profileList || !emptyState) return;

  // Show empty state for now
  emptyState.classList.remove('hidden');
  profileList.innerHTML = '';

  // Example: Render a sample profile (for testing)
  // Uncomment to see profile card:
  /*
  emptyState.classList.add('hidden');
  profileList.innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-title">👤 Greg - Work</div>
        <div class="profile-actions">
          <button class="icon-btn" title="Toggle">⚪</button>
          <button class="icon-btn" title="Edit">✏️</button>
          <button class="icon-btn" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="profile-mappings">
        <div class="mapping-row">
          <span class="mapping-real">Greg Barker</span>
          <span class="mapping-arrow">→</span>
          <span class="mapping-alias">John Smith</span>
        </div>
        <div class="mapping-row">
          <span class="mapping-real">greg@work.com</span>
          <span class="mapping-arrow">→</span>
          <span class="mapping-alias">john@example.com</span>
        </div>
        <div class="mapping-row">
          <span class="mapping-real">(555) 123-4567</span>
          <span class="mapping-arrow">→</span>
          <span class="mapping-alias">(555) 000-0001</span>
        </div>
      </div>
      <div class="profile-meta">
        Used: 24 times | Last: 2 hours ago
      </div>
    </div>
  `;
  */
}

// ========== STATS TAB ==========

function renderPlaceholderStats() {
  // Stats are already showing 0 values in HTML
  // TODO: Load real stats from storage
  console.log('[Popup V2] Stats placeholder loaded');
}

// ========== SETTINGS TAB ==========

function handleEnabledToggle(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  console.log('[Popup V2] Protection enabled:', checkbox.checked);
  // TODO: Update config in storage
}

function handleEmailOptInToggle(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const emailInputGroup = document.getElementById('emailInputGroup');

  if (emailInputGroup) {
    emailInputGroup.style.display = checkbox.checked ? 'flex' : 'none';
  }

  console.log('[Popup V2] Email opt-in:', checkbox.checked);
}

function handleSubscribe() {
  const emailInput = document.getElementById('emailInput') as HTMLInputElement;
  const email = emailInput?.value.trim();

  if (!email) {
    alert('Please enter your email address');
    return;
  }

  if (!isValidEmail(email)) {
    alert('Please enter a valid email address');
    return;
  }

  console.log('[Popup V2] Subscribing email:', email);
  // TODO: Send to Mailchimp API via serverless function
  alert(`Thanks for subscribing! We'll send updates to ${email}`);
}

function handleClearStats() {
  if (!confirm('Are you sure you want to clear all statistics? This cannot be undone.')) {
    return;
  }

  console.log('[Popup V2] Clearing stats');
  // TODO: Clear stats in storage
  alert('Stats cleared successfully!');
}

function handleExportProfiles() {
  console.log('[Popup V2] Exporting profiles');
  // TODO: Export profiles as JSON
  alert('Profile export coming soon! This will download your profiles as a JSON file.');
}

// ========== DEBUG CONSOLE TAB ==========

function handleClearLog() {
  const debugConsole = document.getElementById('debugConsole');
  const emptyState = document.getElementById('debugEmptyState');

  if (debugConsole && emptyState) {
    debugConsole.innerHTML = '';
    emptyState.classList.remove('hidden');
  }

  console.log('[Popup V2] Debug log cleared');
}

function renderPlaceholderDebugLog() {
  const debugConsole = document.getElementById('debugConsole');
  const emptyState = document.getElementById('debugEmptyState');

  if (!debugConsole || !emptyState) return;

  // Show empty state by default
  emptyState.classList.remove('hidden');

  // Example: Add sample log entries (for testing)
  // Uncomment to see debug log:
  /*
  emptyState.classList.add('hidden');
  debugConsole.innerHTML = `
    <div class="debug-entry">
      <span class="debug-timestamp">[14:32:15]</span>
      <span class="debug-type success">✓</span>
      <span class="debug-message">Interception - ChatGPT</span>
      <div class="debug-details">
        Found: 2 PII items (name, email)<br>
        Profile: Greg - Work<br>
        Substituted: 2 items
      </div>
    </div>
    <div class="debug-entry">
      <span class="debug-timestamp">[14:28:03]</span>
      <span class="debug-type warning">⚠</span>
      <span class="debug-message">Warning - ChatGPT</span>
      <div class="debug-details">
        Found: 1 PII item (phone)<br>
        User approved replacement
      </div>
    </div>
    <div class="debug-entry">
      <span class="debug-timestamp">[14:15:42]</span>
      <span class="debug-type error">✗</span>
      <span class="debug-message">Error - Claude</span>
      <div class="debug-details">
        Failed to parse response<br>
        Details: JSON parse error at line 24
      </div>
    </div>
  `;
  */
}

// ========== UTILITIES ==========

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== EXPORTS ==========
// For testing in console
(window as any).popupV2 = {
  renderPlaceholderProfiles,
  renderPlaceholderStats,
  renderPlaceholderDebugLog,
};

console.log('[Popup V2] Script loaded successfully');
