import { useEffect } from "react";

// Cierra un desplegable al hacer clic fuera de él o al pulsar Esc
export const useFuera = (ref, abierto, cerrar) => {
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) cerrar(); };
    const tecla = (e) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [ref, abierto, cerrar]);
};
