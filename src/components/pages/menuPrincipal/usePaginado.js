import { useState } from "react";

// Muestra una lista por tandas ("Mostrar más"). Al cambiar la clave (búsqueda o filtro) vuelve a la primera tanda.
export const usePaginado = (lista, clave = "", tam = 20) => {
  const [estado, setEstado] = useState({ clave, cantidad: tam });
  const cantidad = estado.clave === clave ? estado.cantidad : tam;
  return {
    visibles: lista.slice(0, cantidad),
    mostrados: Math.min(cantidad, lista.length),
    total: lista.length,
    restantes: Math.max(lista.length - cantidad, 0),
    mostrarMas: () => setEstado({ clave, cantidad: cantidad + tam }),
  };
};
