// Reduce una imagen antes de subirla: máximo 1280 px por lado y formato WebP (JPEG si el navegador no lo soporta).
// Una captura de 2 MB suele quedar en 50-150 KB y se sigue leyendo bien.
export const comprimirImagen = (archivo, maxLado = 1280, calidad = 0.8) =>
  new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(img.width * escala);
      lienzo.height = Math.round(img.height * escala);
      lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);

      lienzo.toBlob((webp) => {
        if (webp && webp.type === "image/webp") return resolver(webp);
        lienzo.toBlob((jpg) => (jpg ? resolver(jpg) : rechazar(new Error("No se pudo comprimir la imagen"))), "image/jpeg", calidad);
      }, "image/webp", calidad);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new Error("El archivo no es una imagen válida"));
    };
    img.src = url;
  });

export const extensionDe = (blob) => (blob.type === "application/pdf" ? "pdf" : blob.type === "image/webp" ? "webp" : "jpg");
export const kb = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Comprobantes: imagen (se comprime) o PDF (se sube tal cual, con tope de tamaño)
export const MAX_PDF = 5 * 1024 * 1024;
export const esPdf = (x) => (typeof x === "string" ? /\.pdf(\?|$)/i.test(decodeURIComponent(x)) : x?.type === "application/pdf");

// Convierte una imagen ya comprimida en texto (data URL) para guardarla en Firestore
export const aDataUrl = (blob) => new Promise((resolver, rechazar) => {
  const lector = new FileReader();
  lector.onload = () => resolver(lector.result);
  lector.onerror = () => rechazar(new Error("No se pudo leer la imagen"));
  lector.readAsDataURL(blob);
});
