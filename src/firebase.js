import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Configuración de Firebase (proyecto aún "lacasadelron"; cambiar por el de Pasanaku)
export const firebaseConfig = {
  apiKey: "AIzaSyArHWZwdN3uHmdePb-_3IoLeRxs5xhy8Ak",
  authDomain: "lacasadelron.firebaseapp.com",
  projectId: "lacasadelron",
  storageBucket: "lacasadelron.firebasestorage.app",
  messagingSenderId: "797620703726",
  appId: "1:797620703726:web:5e6d4eff0575147da17eff",
  measurementId: "G-0KR04Z14CD"
};

// Inicializamos la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Exportamos las herramientas para el Login, Base de Datos, Imágenes y Analíticas
export const auth = getAuth(app); 
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
