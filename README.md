# Festival Dängo

Sitio oficial de [Festival Dängo](https://festivaldango.com), diseñado y desarrollado por [The Dash Studios](https://thedashstudios.mx). Música, arte y cultura en Rancho La Ventilla, Teotihuacán.

La versión actual conserva la **edición del 14 de febrero de 2026 como archivo**: cartel, 27 fotografías, ubicación y condiciones históricas. La fecha se verificó en el cartel oficial del repositorio (`public/images/ui/noticias/Line_Up.webp`). No anuncia entradas disponibles ni inventa una próxima edición.

## Desarrollo

Requiere Node.js 22.12 o posterior y npm.

```sh
git clone https://github.com/eddndev-studio/dango.git
cd dango
npm ci
npm run dev
```

Astro genera HTML estático. El sitio usa CSS propio, tipografías locales WOFF2 y JavaScript pequeño para el menú y las galerías. Las interacciones principales conservan alternativas sin JavaScript.

```sh
npm run build   # Genera las imágenes adaptativas y el sitio en dist/
npm run check   # Revisa los tipos y componentes
npm run verify  # Verifica enlaces, recursos, SEO y presupuestos de tamaño
npm run preview
```

## Contenido y fotografías

- `src/data/site.ts`: identidad, fecha, enlaces y cartel.
- `src/data/faq.json`: información histórica de la edición.
- `src/data/gallery-captions.json`: descripciones de las 27 fotografías.
- `public/images/`: originales; no se sobrescriben durante el build.
- `scripts/build-media.mjs`: genera WebP a 480, 960 y 1600 px, con nombres basados en el contenido; corrige la orientación de una fotografía guardada de lado.
- `public/media/` y `src/data/media.json`: resultados generados, excluidos de Git.
- `scripts/build-social.mjs`: genera la tarjeta social de 1200 × 630 a partir del logotipo vectorial original. Ejecutar después de modificar esa composición.

Las miniaturas usan `srcset`, dimensiones explícitas y carga diferida. La galería abre una versión de mayor tamaño solo cuando se solicita. El menú y los visores usan diálogos nativos, foco controlado y cierre con Escape; los visores también admiten flechas. La preferencia de movimiento reducido desactiva transiciones.

## SEO

Canonical y sitemap usan exclusivamente `https://festivaldango.com`. Cada página tiene título, descripción, H1 y metadatos sociales. Los datos estructurados del evento aparecen únicamente en la portada y corresponden a la fecha del cartel. No se publica disponibilidad de boletos de una edición pasada. La página 404 incluye `noindex`.

## Publicación

GitHub Actions ejecuta instalación reproducible, build, revisión de tipos y verificación del sitio. Un push a `main` publica al hosting existente mediante SSH/rsync; los pull requests ejecutan las comprobaciones sin desplegar.

Se conservan los secretos de repositorio existentes: `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER` y `DEPLOY_PATH`. Nunca deben guardarse en archivos del proyecto.

El servidor actual es nginx. La configuración aplicada de caché, compresión, HTTP/2, redirecciones y respuesta 404 está versionada en `ops/nginx/festivaldango.com.conf`. Los cambios de esta configuración se aplican en el hosting tras guardar una copia y validar con `nginx -t`; el workflow publica únicamente `dist/`. Véase `docs/audit-2026-09-05.md` para el respaldo y la evidencia del despliegue.

## Licencia

El código mantiene la licencia GPL-3.0-or-later del repositorio; véase [LICENSE](LICENSE). Las fotografías y la identidad del festival se mantienen como materiales del proyecto.
