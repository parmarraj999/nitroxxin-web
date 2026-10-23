const admin = require('firebase-admin');

const defaultBucketName =
  process.env.STORAGE_BUCKET ||
  process.env.FIREBASE_STORAGE_BUCKET ||
  'nitroxxin-web.firebasestorage.app';

// Initialize Firebase Admin SDK idempotently
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: defaultBucketName,
  });
}

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket(defaultBucketName);
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

module.exports = {
  admin,
  db,
  storage,
  bucket,
  FieldValue,
  Timestamp,
};
