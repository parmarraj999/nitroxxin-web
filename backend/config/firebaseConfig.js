const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json"); // Download this from Firebase

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});

const db = admin.firestore();

module.exports = db;
