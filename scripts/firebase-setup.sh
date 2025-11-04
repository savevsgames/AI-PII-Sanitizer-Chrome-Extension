#!/bin/bash

# Firebase Setup Script
# Run this script to login and deploy Firebase security rules

echo "=========================================="
echo "Firebase Setup for PromptBlocker"
echo "=========================================="
echo ""

# Step 1: Login to Firebase
echo "Step 1: Logging in to Firebase..."
echo "Your browser will open. Sign in with your Google account."
echo ""
firebase login

if [ $? -ne 0 ]; then
    echo "❌ Firebase login failed. Please try again."
    exit 1
fi

echo ""
echo "✅ Login successful!"
echo ""

# Step 2: Set the Firebase project
echo "Step 2: Setting Firebase project..."
echo ""
firebase use --add

if [ $? -ne 0 ]; then
    echo "❌ Failed to set project. Make sure promptblocker-prod exists."
    exit 1
fi

echo ""
echo "✅ Project set successfully!"
echo ""

# Step 3: Deploy Firestore rules
echo "Step 3: Deploying Firestore security rules..."
echo ""
firebase deploy --only firestore:rules

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy rules."
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Firebase setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify rules in Firebase Console"
echo "2. Test Firebase connection (Part 8 of guide)"
echo "3. Build authentication UI"
echo ""
