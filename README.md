# noatests

Exámenes interactivos para Noa, organizados por materias y publicados con GitHub Pages.

- `index.html` — portada con el índice de materias
- `matematicas/index.html` — lista de exámenes de matemáticas
- `matematicas/tema1-numeros-y-planos/index.html` — lista de exámenes del tema 1
- `matematicas/tema1-numeros-y-planos/examen1/index.html`, `examen2/index.html` — exámenes del tema
- `arts/examen1/index.html` — examen de dibujo (lienzos para pintar, sin corrección)

Estructura: `<materia>/<tema>/<examen>/index.html`. Cada nivel tiene un `index.html` con la lista del nivel siguiente. Para un examen nuevo del mismo tema, crear `examenN/` y enlazarlo en el `index.html` del tema.

Cada examen es una página HTML independiente con corrección automática.
