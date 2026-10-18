# noatests

Exámenes interactivos para Noa, organizados por materias y publicados con GitHub Pages.

- `index.html` — portada con el índice de materias
- `matematicas/index.html` — lista de temas de matemáticas
- `matematicas/examen.js` y `examen.css` — código común de los exámenes de matemáticas: corrección, formato de números (1.234), cuadrícula, pantalla de resultado y guardado del último intento en el navegador (localStorage), con una sola corrección por intento
- `matematicas/tema1-numeros-y-planos/index.html` — lista de exámenes del tema 1
- `matematicas/tema1-numeros-y-planos/examen1/index.html`, `examen2/index.html` — exámenes del tema
- `arts/examen1/index.html` — examen de dibujo (lienzos para pintar, sin corrección)

Estructura: `<materia>/<tema>/<examen>/index.html`. Cada nivel tiene un `index.html` con la lista del nivel siguiente. Para un examen nuevo de matemáticas, copiar un `examenN/index.html` existente y cambiar solo las preguntas: `<input data-r="respuesta">`, `<span class="grupo" data-r="opción">` con `.opcion`, y `<div class="grid" data-start="f,c" data-dest="f,c">` para la cuadrícula. Luego enlazarlo en el `index.html` del tema.

Cada examen es una página HTML independiente con corrección automática.
