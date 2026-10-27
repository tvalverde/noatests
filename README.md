# noatests

Exámenes interactivos para Noa, organizados por materias y publicados con GitHub Pages.

- `catalogo.json` — materias, temas y exámenes con sus nombres y descripciones. Es la única fuente de las listas (portada, materia, tema) y de "Mis notas": un examen nuevo se da de alta aquí (y los tests fallan si hay un examen en disco que no esté)
- `listas.js` — pinta las listas de la portada, materia y tema desde el catálogo, con la última nota junto a cada examen
- `index.html` — portada
- `matematicas/index.html` — lista de temas de matemáticas
- `matematicas/dibujos.js` — dibujos SVG declarativos para las preguntas (bloques multibase, rectas numéricas, tarjetas, planos con salas y calles, figuras trasladadas, alturas y distancias); la cabecera del archivo explica cada uno. Regla: toda pregunta que mencione un dibujo debe mostrarlo
- `matematicas/examen.js` y `examen.css` — código común de los exámenes de matemáticas: corrección, formato de números (1.234), cuadrícula, pantalla de resultado y guardado del último intento en el navegador (localStorage), con una sola corrección por intento. Cada pregunta vale 1 punto repartido entre sus huecos; la nota se redondea al cuarto de punto
- `matematicas/temas1-2-numeros-y-planos/index.html` — lista de exámenes de los temas 1 y 2
- `matematicas/temas1-2-numeros-y-planos/examen1/index.html`, `examen2/index.html` — exámenes del tema
- `notas/` — "Mis notas", navegable por pantallas con su propia dirección (`#/materia/tema/examen`, funciona el botón atrás): resumen por materia (media, hechos, último examen) → temas de la materia → exámenes del tema (incluidos los no hechos) → detalle del examen (todos los intentos, gráfica de evolución con 2 o más, mejor y peor). "Qué se me da mejor y peor" por materia, tema y examen (`data-tipo` de cada pregunta). Arts muestra miniaturas de los dibujos. La nube y exportar/importar solo aparecen en el resumen. Las notas viven en localStorage con la ruta del examen como clave; no se mueven ni se tocan. Desde esta página se pueden exportar a un archivo e importar en otro dispositivo (`notas/copia.js`), fusionando sin duplicar ni borrar
- `sync.js` — sincronización con la nube (Supabase, proyecto `noatests`). localStorage sigue siendo la fuente local y funciona sin red; con un código de familia guardado en el dispositivo, cada intento se envía a la nube (cola con reintento al recuperar la red) y al abrir Mis notas o un examen se descargan y fusionan los intentos de los demás dispositivos. En la base de datos las tablas están cerradas; solo se accede por funciones que exigen el código de familia (guardado como hash). La clave pública de la web no da acceso a nada sin el código. `.github/workflows/latido.yml` llama dos veces al día a una función que escribe en la tabla `latidos` y lee las de la app (Supabase solo cuenta como actividad las consultas a tablas de usuario), para que el plan gratuito no pause el proyecto
- `sw.js`, `sw-registro.js`, `manifest.json` — modo sin conexión (las páginas visitadas quedan guardadas) e instalación como app
- `tests/run.js`, `tests/catalogo.js` y `tests/sync.js` (nube simulada) — comprobaciones automáticas (`npm test`): cada examen da 10 con las respuestas correctas, cada pregunta tiene tipo, y toda pregunta que menciona un dibujo lo muestra. Se ejecutan en GitHub antes de publicar
- `arts/examen1/index.html` — examen de dibujo (lienzos para pintar, sin corrección)

Estructura: `<materia>/<tema>/<examen>/index.html`. Cada nivel tiene un `index.html` con la lista del nivel siguiente. Para un examen nuevo de matemáticas, copiar un `examenN/index.html` existente, cambiar solo las preguntas y darlo de alta en `catalogo.json`: `<input data-r="respuesta">`, `<span class="grupo" data-r="opción">` con `.opcion`, y `<div class="grid" data-start="f,c" data-dest="f,c">` para la cuadrícula.

Cada examen es una página HTML independiente con corrección automática.
