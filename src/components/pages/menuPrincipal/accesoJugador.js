import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { hashClave, ITERACIONES } from "./claves";

// El verificador de la contraseña (el hash) vive en la colección "claves", que ningún navegador puede leer.
// Para comprobar una contraseña se calcula su hash aquí y se "pregunta" a Firestore por el documento acceso/{usuario}/prueba/{hash}:
// las reglas solo permiten esa lectura si el hash coincide con el guardado. Así el hash nunca sale del servidor.
// Devuelve la prueba (el hash derivado) si la contraseña es correcta, o null si no lo es.
export const probarClave = async (id, clave, perfil) => {
  const { hash } = await hashClave(clave, perfil.sal, perfil.iter || ITERACIONES);
  try {
    await getDoc(doc(db, "acceso", id, "prueba", hash));
    return hash;
  } catch (err) {
    if (err.code === "permission-denied") return null;
    throw err;
  }
};

// La prueba de la sesión se guarda solo en esta pestaña (se borra al cerrarla) y sirve para el cambio obligatorio de contraseña
export const CLAVE_PRUEBA = "pk_prueba";
