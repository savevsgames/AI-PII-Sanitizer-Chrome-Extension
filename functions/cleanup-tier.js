// Cleanup script to reset user tier to FREE
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'promptblocker-prod'
});

const db = admin.firestore();
const userId = 'WPyF1pYjdmMMgfhkCTPmvMoguuH3';

async function cleanup() {
  try {
    console.log('📋 Checking current tier...');

    // Get current user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    console.log('📊 Current data:');
    console.log('  - Tier:', userData?.tier);
    console.log('  - Subscription Status:', userData?.subscriptionStatus);

    console.log('\n📋 Updating to FREE tier...');

    // Update user tier to FREE
    await db.collection('users').doc(userId).update({
      tier: 'free',
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      updatedAt: Date.now()
    });

    console.log('✅ Firestore tier updated to FREE');

    // Verify
    const updatedDoc = await db.collection('users').doc(userId).get();
    const updatedData = updatedDoc.data();

    console.log('\n📊 Updated data:');
    console.log('  - Tier:', updatedData.tier);
    console.log('  - Subscription Status:', updatedData.subscriptionStatus);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanup();
