# Ejercicios de Noa: reglas para trabajar en este repo

Web estática (GitHub Pages) con ejercicios para Noa, 8 años, 3.º de Primaria (libros de Anaya). Todo lo que ella ve debe estar pensado para una niña de 8 años.

## Palabras
- A la niña se le dice **ejercicio**, nunca "examen". Por dentro (carpetas `examenN/`, `catalogo.json` → `examenes`, claves de localStorage `noatests-mates:`) se mantiene "examen" para no perder datos. Un test falla si "examen" aparece en alguna pantalla.
- Se mantiene la nota de 0 a 10 (en el cole les ponen notas) y las estrellas.

## Proceso obligatorio para crear ejercicios
1. **Fotos del libro** del tema (las pasa Toni). Se guardan en el artefacto privado "Libros de Noa" (nunca en el repo: tienen derechos de autor).
2. **Temario** `temario/<materia>/<tema>.json` escrito a partir de las fotos, antes de cualquier ejercicio. Para cada contenido (`data-tipo`): páginas del libro y qué entra; número máximo; si hay decimales; palabras prohibidas (contenidos de otros temas o cursos); qué queda fuera. Estado `"pendiente"` hasta que Toni lo dé por bueno (`"revisado"` + `revisado_el`). Toni lo revisa cuando quiere en la página `temario/` de la web.
3. Cada contenido nuevo lleva nombre en `contenidos` de su materia en `catalogo.json`.
4. **Generador** en `herramientas/generar-*.py`: las respuestas se calculan a partir de los datos, nunca se teclean. Los dibujos salen de los mismos datos que las respuestas.
5. **Qué se pregunta:** lo que el libro pide aprender, no los datos de las lecturas. La guía son las secciones finales de cada tema: «En resumen», «Repasamos», «Nuestro reto» (y en mates y sociales, los cuadros de teoría y los ejercicios). Las lecturas son contexto: no se pregunta cuánto mide la cola de un mono en Lengua. Para practicar una destreza se usan ejemplos nuevos (otro animal, otro cuento). El temario recoge esa guía en su campo `guia`.
6. Solo preguntar lo que está en las páginas del temario y como lo pregunta el libro (mismas palabras: minuendo, umbría…). Ante la duda, no preguntarlo.
7. `npm test`: debe pasar todo. `tests/temario.js` rechaza contenidos fuera del temario, números por encima del máximo, decimales y palabras prohibidas. `tests/run.js` / `tests/sociales.js` recalculan cada respuesta desde el dibujo.
8. **Revisión visual** a 360–400 px de ancho (Playwright) de cada pregunta.
9. **Revisión independiente** con un subagente que comprueba que se pregunta lo que pide aprender el libro (según «En resumen», «Repasamos» y «Nuestro reto») y compara cada pregunta con las fotos de las páginas que indica el temario (que esté en el libro, una sola respuesta válida, vocabulario del libro, legible en móvil). Aplicar lo que encuentre.
10. Si se tocó algún `.js`/`.css` común: `node herramientas/subir-version.js`. Commit y push a `main` (GitHub ejecuta los tests y publica).

## Código
- Motor común: `comun/examen.js` y `comun/examen.css`. Listas: `listas.js` y `comun/listas.css`. Mis notas: `notas/`. Nube: `sync.js` (Supabase).
- Dibujos: `matematicas/dibujos.js`, `sociales/dibujos.js` (la cabecera explica cada uno).
- Los tests usan jsdom; la revisión visual, Chromium con Playwright.
- Más detalle en `README.md`.
