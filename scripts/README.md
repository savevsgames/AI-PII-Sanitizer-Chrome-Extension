# Helper Scripts

This folder contains helper scripts for development and deployment tasks.

## Firebase Setup Scripts

### `firebase-setup.sh` (Unix/Mac/Linux)
```bash
chmod +x scripts/firebase-setup.sh
./scripts/firebase-setup.sh
```

### `firebase-setup.bat` (Windows)
```cmd
scripts\firebase-setup.bat
```

### What These Scripts Do:
1. Login to Firebase CLI
2. Set the Firebase project to `promptblocker-prod`
3. Deploy Firestore security rules
4. Deploy Firestore indexes

### Prerequisites:
- Firebase CLI installed: `npm install -g firebase-tools`
- Google account with access to `promptblocker-prod` project

### Manual Alternative:
```bash
firebase login
firebase use promptblocker-prod
firebase deploy --only firestore:rules,firestore:indexes
```

## Adding New Scripts

When adding new helper scripts:
1. Add clear documentation above
2. Make shell scripts executable: `chmod +x scriptname.sh`
3. Test on your platform before committing
4. Update this README
