import { useEffect, useRef } from "react";

// Botón "atrás" del celular dentro de la app: cada pantalla o ventana abierta se registra aquí y "atrás" cierra la de más arriba.
// Solo cuando ya no queda ninguna se pregunta si quiere cerrar sesión.
const pila = [];

// Mientras `activo` sea verdadero, "atrás" ejecuta `cerrar` (si es la pantalla más reciente)
export const useAtras = (activo, cerrar) => {
  const ultimo = useRef(cerrar);
  ultimo.current = cerrar;
  useEffect(() => {
    if (!activo) return undefined;
    const manejador = () => ultimo.current();
    pila.push(manejador);
    return () => {
      const i = pila.lastIndexOf(manejador);
      if (i >= 0) pila.splice(i, 1);
    };
  }, [activo]);
};

// Ejecuta el cierre de la pantalla más reciente; devuelve false si no había ninguna
export const retroceder = () => {
  const manejador = pila[pila.length - 1];
  if (!manejador) return false;
  manejador();
  return true;
};
