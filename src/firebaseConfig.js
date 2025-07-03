import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // 👈 thiếu dòng này
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB_HQQJYZdHd1tN-jrT9HBP4kGuV12cBxU",
  authDomain: "webrtc-2f7fb.firebaseapp.com",
  projectId: "webrtc-2f7fb",
  storageBucket: "webrtc-2f7fb.firebasestorage.app",
  messagingSenderId: "285467244129",
  appId: "1:285467244129:web:bb2462a0f322e0b9691c20",
  measurementId: "G-71488CE7WC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // ✅ thêm dòng này
const analytics = getAnalytics(app);

export { db };
