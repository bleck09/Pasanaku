# Seguridad de Pasanaku

## Qué es público y qué no

- **No hay contraseñas ni claves privadas en el repositorio.** El archivo `.env.local` (donde está la configuración de Firebase) está en `.gitignore` y no se sube. Se incluye `.env.example` como plantilla.
- **La configuración de Firebase (`apiKey`, `projectId`, etc.) NO es un secreto.** Cualquier app web la envía dentro del código publicado: se puede ver en la pestaña "Network" del navegador de cualquier visitante, y también quedó en el historial de Git. Esconderla no es posible; lo que protege los datos son:
  1. las **reglas** de Firestore y Storage (`firestore.rules`, `storage.rules`);
  2. **restringir la clave de API** a tu sitio;
  3. (recomendado) **App Check**.

## Pasos en la consola de Firebase / Google Cloud

1. **Publicar las reglas.** Firebase → Firestore → Reglas, pegar `firestore.rules`; Storage → Reglas, pegar `storage.rules`. Se publican por separado, subir el repositorio no las actualiza.
2. **Restringir la clave de API.** Google Cloud Console → APIs y servicios → Credenciales → la "Browser key" del proyecto:
   - *Restricciones de aplicaciones* → **Sitios web (referentes HTTP)**: `https://bleck09.github.io/*` y `http://localhost:5173/*`.
   - *Restricciones de API*: dejar solo las de Firebase que usa la app (Identity Toolkit, Cloud Firestore, Cloud Storage for Firebase, Firebase Installations, Token Service).
3. **Authentication → Configuración → Dominios autorizados**: solo `bleck09.github.io` y `localhost`.
4. **Activar App Check** (reCAPTCHA v3) para Firestore y Storage: evita que un script ajeno use tu proyecto aunque conozca la clave.
5. **Presupuesto y alertas** en Google Cloud (Facturación) para enterarte de un uso anormal.
6. **Proyecto propio.** El código todavía usa el proyecto de Firebase `lacasadelron`. Conviene crear uno exclusivo para Pasanaku (así las reglas de un sistema no afectan al otro) y poner sus datos en `.env.local`.

## Cómo se guardan las contraseñas de los jugadores

Los jugadores no usan Firebase Authentication. Para que sus contraseñas no se puedan robar:

- La contraseña **nunca se guarda**. Se calcula un hash PBKDF2-SHA256 (310 000 iteraciones, sal propia) en el navegador.
- El hash vive en la colección `claves`, que **ningún navegador puede leer** (`allow read: if false`). El perfil público (`jugadores`) solo tiene nombre, sal e iteraciones.
- Para entrar, el navegador calcula el hash y pregunta por el documento `acceso/{usuario}/prueba/{hash}`: las reglas solo dejan leerlo si el hash coincide. El hash nunca sale del servidor.
- Para **cambiar** una contraseña hay que enviar la prueba (el hash) de la actual. Sin conocerla, ni leyendo la base de datos, nadie puede cambiarla.
- La contraseña temporal que ve el administrador está en `temporales` (solo lectura para administradores) y desaparece cuando la persona elige la suya.

## Orden para publicar esta actualización

1. Publicar `firestore.rules` en Firebase.
2. Compilar y subir la página: `npm run publicar`, luego `git add docs`, `git commit` y `git push`.
3. Entrar **una vez como administrador**: el sistema pasa automáticamente los hashes antiguos de las cuentas existentes a la colección privada (aparece el aviso "Seguridad de N cuentas actualizada").

Entre el paso 1 y el 3 los jugadores no podrán iniciar sesión (los administradores sí).

## Riesgos que quedan (por diseño actual)

- **Fotos de perfil y QR de cobro de jugadores:** como no hay sesión de Firebase para ellos, las reglas no pueden comprobar quién escribe. Por eso la app avisa al administrador cuando un QR se cambió hace menos de 3 días. Si el pasanaku maneja montos altos, confirmar el QR con la persona antes de pagar.
- **Adivinar contraseñas en línea:** no hay límite de intentos. Se mitiga con contraseñas largas (la app pide mínimo 8 caracteres) y con App Check.
- **Lectura pública:** pasanakus, participantes, pagos, entregas y multas se pueden leer sin sesión porque los jugadores no inician sesión en Firebase. No contienen contraseñas.
- **Siguiente paso recomendado:** pasar a los jugadores a Firebase Authentication con Cloud Functions (plan Blaze). Eso permitiría reglas por usuario y límite de intentos.
