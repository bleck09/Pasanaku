import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// La configuración sale de las variables VITE_FIREBASE_* (archivo .env.local, que no se sube al repositorio; ver .env.example).
// Ojo: en una app web esta configuración viaja dentro del código publicado, así que NO es un secreto.
// La seguridad real está en las reglas de Firestore/Storage y en restringir la clave de API (ver SEGURIDAD.md).
const env = import.meta.env;
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error("Falta la configuración de Firebase. Copia .env.example como .env.local y completa los valores VITE_FIREBASE_*.");
}

// Inicializamos la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Exportamos las herramientas para el Login, Base de Datos, Imágenes y Analíticas
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
