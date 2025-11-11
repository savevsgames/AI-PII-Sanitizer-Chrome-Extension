#!/usr/bin/env node
/**
 * Package Release Script
 *
 * Creates a release package from the built dist/ folder with consistent extension ID.
 * All testers will get the same extension ID because the public key is injected
 * into manifest.json during build.
 *
 * Usage: npm run build:release
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RELEASES_DIR = path.join(ROOT_DIR, 'releases');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getVersion() {
  const manifestPath = path.join(DIST_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    log('❌ dist/manifest.json not found. Run "npm run build" first.', 'red');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return manifest.version;
}

function verifyPublicKey() {
  const manifestPath = path.join(DIST_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (!manifest.key) {
    log('❌ ERROR: No "key" field found in manifest.json', 'red');
    log('   Make sure EXTENSION_PUBLIC_KEY is set in .env', 'yellow');
    process.exit(1);
  }

  log('✓ Public key found in manifest.json', 'green');
  return true;
}

function createReleaseDirectory(version) {
  const releaseDir = path.join(RELEASES_DIR, `v${version}`);

  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
    log(`✓ Created release directory: releases/v${version}`, 'green');
  }

  return releaseDir;
}

function copyDistToRelease(releaseDir, version) {
  const targetDir = path.join(releaseDir, `PromptBlocker-v${version}`);

  // Remove old version if exists
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true });
    log(`✓ Removed old version: ${targetDir}`, 'yellow');
  }

  // Copy dist to release directory
  fs.cpSync(DIST_DIR, targetDir, { recursive: true });
  log(`✓ Copied dist to: ${targetDir}`, 'green');

  return targetDir;
}

function createZipPackage(releaseDir, unpackedDir, version) {
  const zipFile = path.join(releaseDir, `PromptBlocker-v${version}.zip`);
  const relativeDir = path.relative(releaseDir, unpackedDir);

  // Remove old zip if exists
  if (fs.existsSync(zipFile)) {
    fs.unlinkSync(zipFile);
  }

  try {
    // Use PowerShell to create zip on Windows
    const command = `powershell -Command "Compress-Archive -Path '${unpackedDir}\\*' -DestinationPath '${zipFile}' -Force"`;
    execSync(command, { stdio: 'inherit' });

    const stats = fs.statSync(zipFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    log(`✓ Created ZIP package: ${zipFile} (${sizeMB} MB)`, 'green');

    return zipFile;
  } catch (error) {
    log('❌ Failed to create ZIP package', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function printSummary(version, unpackedDir, zipFile) {
  const extensionId = 'gpmmdongkfeimmejkbcnilmacgngnjgi';

  log('\n' + '='.repeat(70), 'cyan');
  log('🎉 Release Package Created Successfully!', 'green');
  log('='.repeat(70), 'cyan');
  log(`\n${colors.bold}Version:${colors.reset} ${version}`, 'cyan');
  log(`${colors.bold}Extension ID:${colors.reset} ${extensionId}`, 'cyan');
  log(`\n${colors.bold}Files created:${colors.reset}`, 'yellow');
  log(`  📁 Unpacked: ${path.basename(unpackedDir)}`, 'green');
  log(`  📦 ZIP:      ${path.basename(zipFile)}`, 'green');
  log(`\n${colors.bold}Distribution instructions:${colors.reset}`, 'yellow');
  log(`  1. Share the ZIP file with testers`, 'cyan');
  log(`  2. Testers extract and load unpacked extension`, 'cyan');
  log(`  3. Everyone will get extension ID: ${extensionId}`, 'cyan');
  log(`  4. Firebase UIDs will work consistently for encryption`, 'cyan');
  log('='.repeat(70), 'cyan');
}

function main() {
  log('\n🚀 PromptBlocker Release Packager', 'cyan');
  log('='.repeat(70), 'cyan');

  // Step 1: Verify build
  log('\n📋 Step 1: Verifying build...', 'cyan');
  const version = getVersion();
  log(`✓ Version: ${version}`, 'green');
  verifyPublicKey();

  // Step 2: Create release directory
  log('\n📁 Step 2: Creating release directory...', 'cyan');
  const releaseDir = createReleaseDirectory(version);

  // Step 3: Copy dist to release
  log('\n📋 Step 3: Copying files...', 'cyan');
  const unpackedDir = copyDistToRelease(releaseDir, version);

  // Step 4: Create ZIP package
  log('\n📦 Step 4: Creating ZIP package...', 'cyan');
  const zipFile = createZipPackage(releaseDir, unpackedDir, version);

  // Summary
  printSummary(version, unpackedDir, zipFile);
}

// Run the script
try {
  main();
} catch (error) {
  log('\n❌ Package creation failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
}
