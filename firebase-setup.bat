@echo off
REM Firebase Setup Script for Windows
REM Run this script to login and deploy Firebase security rules

echo ==========================================
echo Firebase Setup for PromptBlocker
echo ==========================================
echo.

REM Step 1: Login to Firebase
echo Step 1: Logging in to Firebase...
echo Your browser will open. Sign in with your Google account.
echo.
call firebase login

if %ERRORLEVEL% NEQ 0 (
    echo X Firebase login failed. Please try again.
    pause
    exit /b 1
)

echo.
echo √ Login successful!
echo.

REM Step 2: Set the Firebase project
echo Step 2: Setting Firebase project...
echo When prompted, select: promptblocker-prod
echo.
call firebase use --add

if %ERRORLEVEL% NEQ 0 (
    echo X Failed to set project. Make sure promptblocker-prod exists.
    pause
    exit /b 1
)

echo.
echo √ Project set successfully!
echo.

REM Step 3: Deploy Firestore rules
echo Step 3: Deploying Firestore security rules...
echo.
call firebase deploy --only firestore:rules

if %ERRORLEVEL% NEQ 0 (
    echo X Failed to deploy rules.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo √ Firebase setup complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Verify rules in Firebase Console
echo 2. Test Firebase connection (Part 8 of guide)
echo 3. Build authentication UI
echo.
pause
