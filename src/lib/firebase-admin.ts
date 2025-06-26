import 'dotenv/config';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK.
// When running in a Google Cloud environment like App Hosting,
// it automatically discovers the service account credentials.
if (!admin.apps.length) {
  admin.initializeApp();
}

export const adminDb = admin.firestore();
