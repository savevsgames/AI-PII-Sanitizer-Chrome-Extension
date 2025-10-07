/**
 * Popup UI Script
 * Manages the extension popup interface
 */

import { AliasEntry, Message } from '../lib/types';

// DOM elements
const statusIndicator = document.getElementById('statusIndicator') as HTMLDivElement;
const totalSubstitutions = document.getElementById('totalSubstitutions') as HTMLSpanElement;
const totalAliases = document.getElementById('totalAliases') as HTMLSpanElement;
const aliasList = document.getElementById('aliasList') as HTMLDivElement;
const emptyState = document.getElementById('emptyState') as HTMLDivElement;
const addAliasBtn = document.getElementById('addAliasBtn') as HTMLButtonElement;
const addAliasForm = document.getElementById('addAliasForm') as HTMLElement;
const aliasForm = document.getElementById('aliasForm') as HTMLFormElement;
const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;

// Form inputs
const realValueInput = document.getElementById('realValue') as HTMLInputElement;
const aliasValueInput = document.getElementById('aliasValue') as HTMLInputElement;
const categoryInput = document.getElementById('category') as HTMLInputElement;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadAliases();
  setupEventListeners();
});

/**
 * Load configuration from background script
 */
async function loadConfig() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_CONFIG'
    } as Message);

    if (response.success && response.data) {
      const config = response.data;

      // Update status indicator
      if (config.settings.enabled) {
        statusIndicator.querySelector('.status-dot')?.classList.add('active');
        statusIndicator.querySelector('.status-text')!.textContent = 'Active';
      } else {
        statusIndicator.querySelector('.status-dot')?.classList.remove('active');
        statusIndicator.querySelector('.status-text')!.textContent = 'Inactive';
      }

      // Update stats
      totalSubstitutions.textContent = config.stats.totalSubstitutions.toString();
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

/**
 * Load aliases from background script
 */
async function loadAliases() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_ALIASES'
    } as Message);

    if (response.success && response.data) {
      const aliases: AliasEntry[] = response.data;
      displayAliases(aliases);
    }
  } catch (error) {
    console.error('Error loading aliases:', error);
  }
}

/**
 * Display aliases in the list
 */
function displayAliases(aliases: AliasEntry[]) {
  // Update count
  totalAliases.textContent = aliases.length.toString();

  // Clear existing list
  aliasList.innerHTML = '';

  if (aliases.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  // Render each alias
  aliases.forEach(alias => {
    const aliasItem = document.createElement('div');
    aliasItem.className = 'alias-item';
    aliasItem.dataset.id = alias.id;

    aliasItem.innerHTML = `
      <div class="alias-info">
        <span class="alias-real">${escapeHtml(alias.realValue)}</span>
        <span class="alias-alias">→ ${escapeHtml(alias.aliasValue)}</span>
      </div>
      <div class="alias-actions">
        <button class="icon-btn delete" data-id="${alias.id}" title="Delete">
          🗑️
        </button>
      </div>
    `;

    aliasList.appendChild(aliasItem);
  });

  // Attach delete handlers
  document.querySelectorAll('.icon-btn.delete').forEach(btn => {
    btn.addEventListener('click', handleDeleteAlias);
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  addAliasBtn.addEventListener('click', showAddForm);
  cancelBtn.addEventListener('click', hideAddForm);
  aliasForm.addEventListener('submit', handleAddAlias);
}

/**
 * Show add alias form
 */
function showAddForm() {
  addAliasForm.classList.remove('hidden');
  addAliasBtn.disabled = true;
  realValueInput.focus();
}

/**
 * Hide add alias form
 */
function hideAddForm() {
  addAliasForm.classList.add('hidden');
  addAliasBtn.disabled = false;
  aliasForm.reset();
}

/**
 * Handle add alias form submission
 */
async function handleAddAlias(e: Event) {
  e.preventDefault();

  const realValue = realValueInput.value.trim();
  const aliasValue = aliasValueInput.value.trim();
  const category = categoryInput.value.trim();

  if (!realValue || !aliasValue) {
    alert('Please fill in both real name and alias name');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ADD_ALIAS',
      payload: {
        realValue,
        aliasValue,
        type: 'name',
        category: category || undefined,
        enabled: true
      }
    } as Message);

    if (response.success) {
      hideAddForm();
      await loadAliases();
    } else {
      alert('Error adding alias: ' + response.error);
    }
  } catch (error) {
    console.error('Error adding alias:', error);
    alert('Error adding alias');
  }
}

/**
 * Handle delete alias
 */
async function handleDeleteAlias(e: Event) {
  const btn = e.currentTarget as HTMLButtonElement;
  const id = btn.dataset.id;

  if (!id) return;

  if (!confirm('Are you sure you want to delete this alias?')) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'REMOVE_ALIAS',
      payload: { id }
    } as Message);

    if (response.success) {
      await loadAliases();
    } else {
      alert('Error deleting alias: ' + response.error);
    }
  } catch (error) {
    console.error('Error deleting alias:', error);
    alert('Error deleting alias');
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
