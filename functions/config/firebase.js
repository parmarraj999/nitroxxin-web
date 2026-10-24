const admin = require('firebase-admin');

const defaultBucketName =
  process.env.STORAGE_BUCKET ||
  process.env.FIREBASE_STORAGE_BUCKET ||
  'nitroxxin-web.firebasestorage.app';

let _db = null;
let _bucket = null;

function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp({ storageBucket: defaultBucketName });
  }
  if (!_db) {
    _db = admin.firestore();
  }
  return _db;
}

function getBucket() {
  if (!admin.apps.length) {
    admin.initializeApp({ storageBucket: defaultBucketName });
  }
  if (!_bucket) {
    _bucket = admin.storage().bucket(defaultBucketName);
  }
  return _bucket;
}

module.exports = {
  admin,
  get db() {
    return getDb();
  },
  get storage() {
    if (!admin.apps.length) {
      admin.initializeApp({ storageBucket: defaultBucketName });
    }
    return admin.storage();
  },
  get bucket() {
    return getBucket();
  },
  FieldValue: admin.firestore.FieldValue,
  Timestamp: admin.firestore.Timestamp,
};
