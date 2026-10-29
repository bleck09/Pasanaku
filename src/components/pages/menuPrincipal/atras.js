import { useEffect, useRef } from "react";

// Botón "atrás" del celular dentro de la app, como lo hacen las apps profesionales:
// cada pantalla u ventana que se abre (por un toque del usuario) deja UNA entrada en el historial del navegador;
// "atrás" consume esa entrada y cierra esa pantalla. Así "atrás" sube de nivel y no saca de la app.
const pila = [];
let puente = null; // { empujar(), volver() } lo conecta MenuPrincipal con el historial del router
let propios = 0; // retrocesos provocados por la propia app (al cerrar una pantalla con su botón), no por el usuario

export const conectarHistorial = (nuevo) => {
  puente = nuevo;
  return () => { if (puente === nuevo) puente = null; };
};

// ¿Este retroceso lo provocó la app? (entonces no hay que cerrar nada más)
export const esRetrocesoPropio = () => {
  if (propios <= 0) return false;
  propios -= 1;
  return true;
};

// Mientras `activo` sea verdadero, "atrás" ejecuta `cerrar` (si es la pantalla más reciente)
export const useAtras = (activo, cerrar) => {
  const ultimo = useRef(cerrar);
  ultimo.current = cerrar;
  useEffect(() => {
    if (!activo) return undefined;
    const item = { cerrar: () => ultimo.current(), consumido: false, empujado: Boolean(puente) };
    pila.push(item);
    puente?.empujar();
    return () => {
      const i = pila.lastIndexOf(item);
      if (i >= 0) pila.splice(i, 1);
      // se cerró con su propio botón: se quita también su entrada del historial
      if (!item.consumido && item.empujado && puente?.volver()) propios += 1;
    };
  }, [activo]);
};

// Ejecuta el cierre de la pantalla más reciente; devuelve false si no había ninguna
export const retroceder = () => {
  const item = pila[pila.length - 1];
  if (!item) return false;
  item.consumido = true;
  item.cerrar();
  // si esa pantalla no se cerró (por ejemplo está ocupada), se restituye su entrada para que "atrás" siga alineado
  setTimeout(() => {
    if (pila.includes(item)) { item.consumido = false; puente?.empujar(); }
  }, 80);
  return true;
};
