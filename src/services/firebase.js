const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAG-FLs94I1LRNQ0Gwnyey-Dwjia8NVdn0",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "nitroxxin-web.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "nitroxxin-web",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "nitroxxin-web.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "640362602132",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:640362602132:web:6e6cd1fd13ba1d21545e81",
};

let firebaseApp;

export const getFirebase = () => {
  if (!window.firebase) {
    throw new Error("Firebase SDK scripts are not loaded.");
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("Firebase config is missing. Add REACT_APP_FIREBASE_* values to your environment.");
  }

  if (!firebaseApp) {
    firebaseApp = window.firebase.apps.length
      ? window.firebase.app()
      : window.firebase.initializeApp(firebaseConfig);

    window.firebase.auth().setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
  }

  return window.firebase;
};

export const auth = () => getFirebase().auth();
export const db = () => getFirebase().firestore();
export const storage = () => getFirebase().storage();

export const COLLECTIONS = {
  users: "users",
  vendors: "vendors",
  products: "product-collection",
  categories: "product_categories",
  brands: "brands",
  events: "events",
  orders: "orders",
  bookings: "bookings",
  cart: "cart",
  wishlist: "wishlist",
  settings: "settings",
  banners: "banners",
  notifications: "notifications",
};

export const serverTimestamp = () => getFirebase().firestore.FieldValue.serverTimestamp();
export const increment = (value) => getFirebase().firestore.FieldValue.increment(value);
export const documentId = () => getFirebase().firestore.FieldPath.documentId();
