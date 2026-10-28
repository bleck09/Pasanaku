import { auth } from "../../../firebase";

// Los jugadores no usan Firebase Authentication: su sesión es solo el id de su perfil en la colección "jugadores".
// El administrador sí inicia sesión con Firebase Authentication (correo y contraseña).
export const CLAVE_SESION = "pk_jugador";

export const idSesion = () => auth.currentUser?.uid || localStorage.getItem(CLAVE_SESION);
export const esJugadorSimple = () => !auth.currentUser && Boolean(localStorage.getItem(CLAVE_SESION));

// El jugador pulsó "Omitir" en la pantalla de crear contraseña: no se le vuelve a pedir hasta que inicie sesión otra vez
export const OMITIR_CLAVE = "pk_omitir_clave";
