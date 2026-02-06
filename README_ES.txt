# APP LISTO (OFFLINE) — Registro Iglesia (Miembros + Evangelizados + Fotos)

✅ Este paquete es un **app web** que funciona **sin internet** (offline) y guarda datos (incluyendo fotos) en el **dispositivo**.
Sirve para “descargar y usar” ahora mismo.

## Cómo usar (3 formas)

### A) En PC (Windows/Mac)
1) Descomprimí el ZIP
2) Abrí `index.html` con Google Chrome (doble clic)
3) Listo.

### B) En celular como “App” (PWA) — Recomendado
1) Subí la carpeta a un hosting simple (por ejemplo Netlify)
2) Abrí el link en el celular
3) Menú del navegador → **“Agregar a pantalla de inicio”**
4) Queda como app instalada.

### C) En red local (sin internet)
- Podés servirlo desde una notebook con un servidor simple (ej: `python -m http.server`) y entrar desde el celular en la misma Wi‑Fi.

## Importante (MULTIUSUARIO)
- Por defecto, los datos quedan **en ese dispositivo**.
- Para pasar datos a otro celular/PC:
  - Botón **Exportar** (genera .json)
  - En el otro dispositivo: **Importar**

## Seguridad
Este modo offline NO tiene usuarios/contraseñas.
Si querés permisos por obrero/pastor y acceso desde todos, la versión correcta es: **Power Apps + SharePoint**.

## Estructura
- Miembros: búsqueda por nombre/teléfono, filtro por sede, activo/inactivo, foto
- Evangelizados: estados, próximo contacto, seguimiento, foto
