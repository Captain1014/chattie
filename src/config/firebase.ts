import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Config:', firebaseConfig);
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 디버깅을 위한 이벤트 리스너 추가
auth.onAuthStateChanged((user) => {
  console.log('Auth state changed:', user?.email);
});

// 네트워크 요청 디버깅
window.addEventListener('error', (event) => {
  if (event.target instanceof HTMLIFrameElement) {
    console.log('iframe error:', event);
  }
}); 