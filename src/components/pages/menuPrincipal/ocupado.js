import { getDownloadURL, uploadBytesResumable } from "firebase/storage";

// Aviso de "estamos trabajando" para cualquier operación que tarde (subir una foto, enviar o confirmar un pago...).
// Uso:
//   const trabajo = ocupado.iniciar({ titulo: "Enviando tu pago...", texto: "No cierres esta ventana." });
//   try { ...; trabajo.progreso(40); ... } finally { await trabajo.terminar(); }
// Se dibuja con <OcupadoHost /> (montado una vez en el menú principal).
const CLAVE_HOST = "__pkOcupadoHost"; // en globalThis para que no se pierda si el módulo se recarga en caliente
const MINIMO_MS = 500; // si la operación es instantánea, el aviso igual se ve un instante (sin parpadear)

export const registrarHost = (fn) => { globalThis[CLAVE_HOST] = fn; };

export const ocupado = {
  iniciar(opciones) {
    const mostrar = (estado) => globalThis[CLAVE_HOST]?.(estado);
    let estado = { titulo: "Un momento...", texto: "", progreso: null, ...opciones };
    const inicio = Date.now();
    mostrar(estado);
    return {
      progreso: (porcentaje) => { estado = { ...estado, progreso: porcentaje }; mostrar(estado); },
      texto: (texto) => { estado = { ...estado, texto, progreso: null }; mostrar(estado); },
      terminar: async () => {
        const falta = MINIMO_MS - (Date.now() - inicio);
        if (falta > 0) await new Promise((resolver) => setTimeout(resolver, falta));
        mostrar(null);
      },
    };
  },
};

// Sube un archivo a Storage informando el avance (0-100) y devuelve su URL de descarga
export const subirConProgreso = (referencia, archivo, alAvanzar) =>
  new Promise((resolver, rechazar) => {
    const tarea = uploadBytesResumable(referencia, archivo, { contentType: archivo.type });
    tarea.on(
      "state_changed",
      (snap) => alAvanzar?.((snap.bytesTransferred / Math.max(snap.totalBytes, 1)) * 100),
      rechazar,
      async () => {
        try { resolver(await getDownloadURL(tarea.snapshot.ref)); } catch (err) { rechazar(err); }
      },
    );
  });
