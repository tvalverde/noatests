import os, html, json
AQUI=os.path.dirname(os.path.abspath(__file__))
V=json.load(open(os.path.join(AQUI,'version.json')))['version']  # versión de los archivos comunes (?v=N); la cambia herramientas/subir-version.js
RAIZ=os.path.join(AQUI,'..','lengua/tema2-animales')
# Qué se pregunta: lo que el libro pide aprender en «Nuestro reto», «En resumen» y «Repasamos» (pp. 39-41, 46-49, 57-59).
# No se preguntan datos de las lecturas (medidas, nombres…): se practica cada destreza con animales y cuentos nuevos.
SN=['Sí','No'];NUM=['singular','plural']
PARTES=['Inicio','Nudo','Desenlace']
PERS=['1.ª persona','2.ª persona','3.ª persona']
CONJ=['1.ª conjugación','2.ª conjugación','3.ª conjugación']
VOC=['Cómo es','Cómo se desplaza','Qué come','Dónde vive']
FICHA=['Cómo es','Cómo se desplaza','Qué come','Dónde vive','Curiosidades','Cómo puedo protegerlo']

import hashlib
FIJAS=[SN,NUM,PARTES,PERS,CONJ,VOC,FICHA,['1','2','3']]  # listas con orden natural: no se barajan
def baraja(r,ops):
    # orden estable pero variado, para que la correcta no salga siempre la primera
    if ops in FIJAS:return ops
    return sorted(ops,key=lambda o:hashlib.md5((r+'|'+o).encode()).hexdigest())
def g(r,ops):
    assert r in ops,(r,ops);assert len(set(o.lower() for o in ops))==len(ops),ops
    ops=baraja(r,ops)
    return '<span class="grupo" data-r="%s">%s</span>'%(html.escape(r),''.join('<span class="opcion">%s</span>'%html.escape(o) for o in ops))
def i(r):return '<input type="text" data-r="%s">'%html.escape(r)
def fila(t,attrs=''):return '  <div class="fila"%s>%s</div>'%((' '+attrs) if attrs else '',t)
def b(x):return '<b>%s</b>'%html.escape(x)
H='<span style="display:inline-block;min-width:3.2em;border-bottom:3px solid #2a8f8f;margin:0 2px">&nbsp;</span>'
def texto(t):return '  <div class="fila" style="background:#eef7f7;border-radius:12px;padding:10px 12px;line-height:1.6">%s</div>'%html.escape(t)
def preg(n,tipo,titulo,cuerpo):
    return '<div class="pregunta" data-tipo="%s">\n  <h2><span class="num">%d</span>%s</h2>\n%s\n</div>\n'%(tipo,n,html.escape(titulo),'\n'.join(cuerpo))

# piezas que tests/lengua.js recalcula con sus propias tablas y reglas
def infinitivo(forma,inf):return fila(b(forma)+' → '+i(inf),'data-inf="%s"'%forma)
def esverbo(p,r):return fila(b(p)+' '+g(r,SN),'data-esverbo="%s"'%p)
def conjugacion(inf,r):return fila(b(inf)+' '+g(r,CONJ),'data-conj="%s"'%inf)
def numero(forma,inf,r):return fila(b(forma)+' '+g(r,NUM),'data-num="%s|%s"'%(forma,inf))
def persona(forma,inf,per,num):return [fila(b(forma)+' '+g(per,PERS),'data-per="%s|%s"'%(forma,inf)),fila('y está en '+g(num,NUM),'data-num="%s|%s"'%(forma,inf))]
def conjuga(inf,pron,r):return fila('('+html.escape(pron)+') '+i(r),'data-conjuga="%s|%s"'%(inf,pron))
def ono(cosa,r,ops):return fila(html.escape(cosa)+' '+g(r,ops),'data-ono="%s"'%cosa)
def esono(r,ops):return fila(g(r,ops),'data-esono="1"')
def parte(frase,r):return fila('«'+html.escape(frase)+'» '+g(r,PARTES),'data-parte="%s"'%frase)
def voc(palabra,r):return fila(b(palabra)+' '+g(r,VOC),'data-voc="%s"'%palabra)
def ficha(frase,r):return fila(html.escape(frase)+' '+g(r,FICHA))

def pagina(num,P):
    cuerpo='\n'.join(preg(k+1,*p) for k,p in enumerate(P))
    return f'''<!DOCTYPE html>
<html lang="es" style="--materia:#2a8f8f;--materia-borde:#2a8f8f">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ejercicio {num} · Lengua · Ejercicios de Noa</title>
<link rel="manifest" href="../../../manifest.json">
<meta name="theme-color" content="#2a8f8f">
<link rel="stylesheet" href="../../../comun/examen.css?v={V}">
</head>
<body>
<header>
  <nav class="migas"><a href="../../../">Inicio</a> › <a href="../../">Lengua</a> › <a href="../">Tema 2</a> › <span>Ejercicio {num}</span></nav>
  <h1>Ejercicio {num}</h1>
  <p>Tema 2 · Funciones vitales de los animales</p>
  <p class="formato">Toca la respuesta correcta o escríbela</p>
</header>
<main>

{cuerpo}
<button class="principal" id="corregir">¡He terminado!</button>

</main>
<script src="../../../sync.js?v={V}"></script>
<script src="../../../comun/examen.js?v={V}"></script>
<script src="../../../sw-registro.js"></script>
</body>
</html>
'''

E1=[
('descripcion','Estás haciendo la ficha de la ardilla 🐿️. ¿En qué apartado va cada frase?',[
  ficha('Tiene pelo y una cola muy grande.','Cómo es'),ficha('Salta de rama en rama.','Cómo se desplaza'),
  ficha('Come frutos secos y semillas.','Qué come'),ficha('Vive en el bosque.','Dónde vive'),
  ficha('Usa su cola como manta cuando duerme.','Curiosidades')]),
('descripcion','Elige la palabra correcta para la ficha de cada animal.',[
  fila('El pez 🐟 tiene '+g('aletas',['aletas','plumas','pezuñas'])),
  fila('La tortuga 🐢 tiene '+g('caparazón',['caparazón','alas','antenas'])),
  fila('La vaca 🐄 tiene '+g('pezuñas',['pezuñas','escamas','aletas'])),
  fila('La serpiente 🐍 se desplaza: '+g('repta',['repta','vuela','salta']))]),
('verbo','¿Cuáles de estas palabras son verbos?',[esverbo('saltar','Sí'),esverbo('mesa','No'),esverbo('correr','Sí'),esverbo('bonito','No'),esverbo('escribir','Sí')]),
('verbo','Escribe el infinitivo de cada verbo.',[infinitivo('nada','nadar'),infinitivo('vuelan','volar'),infinitivo('come','comer'),infinitivo('viven','vivir'),infinitivo('salta','saltar')]),
('persona','¿Lo hace una persona o animal, o varias? Elige singular o plural.',[numero('corre','correr','singular'),numero('corremos','correr','plural'),numero('cantan','cantar','plural'),numero('saltas','saltar','singular'),numero('bebéis','beber','plural')]),
('persona','Completa la conjugación del verbo saltar.',[conjuga('saltar','yo','salto'),conjuga('saltar','tú','saltas'),conjuga('saltar','él','salta'),conjuga('saltar','nosotros','saltamos'),conjuga('saltar','ellos','saltan')]),
('onomatopeya','Las onomatopeyas. ¿Cuál de estas palabras es una onomatopeya?',[esono('¡guau!',['perro','¡guau!','ladrar']),esono('tic-tac',['reloj','pared','tic-tac']),esono('¡crac!',['¡crac!','plato','romper']),
  fila('Las onomatopeyas son palabras que representan '+g('sonidos',['sonidos','acciones','animales']))]),
('onomatopeya','¿Qué sonido hace cada animal?',[
  ono('El perro 🐶','guau',['guau','miau','muuu']),ono('La vaca 🐄','muuu',['pío, pío','muuu','beee']),
  ono('La rana 🐸','croac',['quiquiriquí','croac','guau']),ono('El gallo 🐓','quiquiriquí',['quiquiriquí','beee','miau'])]),
('cuento','Lee el cuento y di qué parte es cada trozo.',[
  texto('A — Por fin, una lechuza le enseñó una canción para dormir. Desde entonces, Pincho duerme cada noche como un tronco.'),
  texto('B — Érase una vez, hace muchos años, un erizo llamado Pincho que vivía en un bosque.'),
  texto('C — De repente, una noche, Pincho no pudo dormir. Daba vueltas y vueltas y no paraba de bostezar.'),
  fila(b('A')+' '+g('Desenlace',PARTES)),fila(b('B')+' '+g('Inicio',PARTES)),fila(b('C')+' '+g('Nudo',PARTES))]),
('cuento','El cuento de Pincho. Elige la respuesta.',[
  fila('¿Quién es el protagonista? '+g('el erizo Pincho',['el erizo Pincho','la lechuza','el bosque'])),
  fila('¿Dónde ocurre la historia? '+g('en un bosque',['en un bosque','en el mar','en una ciudad'])),
  fila('¿Cuándo ocurre? '+g('hace muchos años',['hace muchos años','mañana','el año que viene'])),
  fila('¿Qué problema tenía Pincho? '+g('no podía dormir',['no podía dormir','tenía hambre','se perdió'])),
  fila('¿Qué frase especial usa el desenlace? '+g('Por fin',['Érase una vez','Por fin','De repente']))]),
]

E2=[
('descripcion','Estás haciendo la ficha de la abeja 🐝. ¿En qué apartado va cada frase?',[
  ficha('Tiene alas y antenas.','Cómo es'),ficha('Vuela de flor en flor.','Cómo se desplaza'),
  ficha('Se alimenta del néctar de las flores.','Qué come'),ficha('Vive en una colmena.','Dónde vive'),
  ficha('No echando venenos en las flores del jardín.','Cómo puedo protegerlo')]),
('descripcion','Lee la ficha y adivina el animal.',[
  texto('Cómo es: tiene plumas, pico y alas, pero no puede volar. Cómo se desplaza: camina y nada muy bien. Qué come: peces. Dónde vive: en lugares con mucho hielo y en el mar.'),
  fila('¿Qué animal es? '+g('el pingüino 🐧',['el pingüino 🐧','el tiburón 🦈','la gallina 🐔'])),
  fila('«Tiene plumas» va en el apartado '+g('Cómo es',FICHA))]),
('verbo','¿De qué conjugación es cada infinitivo?',[conjugacion('nadar','1.ª conjugación'),conjugacion('beber','2.ª conjugación'),conjugacion('dormir','3.ª conjugación'),conjugacion('saltar','1.ª conjugación'),conjugacion('aprender','2.ª conjugación')]),
('verbo','Completa el esquema del verbo.',[
  fila('Los verbos son palabras que indican '+g('acciones',['acciones','sonidos','colores'])),
  fila('El infinitivo se forma añadiendo '+g('-ar, -er o -ir',['-ar, -er o -ir','-a, -e o -i','-mos o -is'])),
  fila('El infinitivo es la forma que usamos para '+g('nombrar al verbo',['nombrar al verbo','hablar de varias personas','imitar un sonido'])),
  fila('Si la acción la realiza una persona, el verbo está en '+g('singular',NUM)),
  fila('Si la acción la realizan varias personas, el verbo está en '+g('plural',NUM)),
  fila('El conjunto de todas las formas de un verbo se llama '+g('conjugación',['conjugación','infinitivo','onomatopeya']))]),
('persona','¿En qué persona y número está cada verbo?',[*persona('canto','cantar','1.ª persona','singular'),*persona('escribes','escribir','2.ª persona','singular'),*persona('corremos','correr','1.ª persona','plural'),*persona('viven','vivir','3.ª persona','plural')]),
('persona','Completa la conjugación del verbo comer.',[conjuga('comer','yo','como'),conjuga('comer','tú','comes'),conjuga('comer','ella','come'),conjuga('comer','vosotros','coméis'),conjuga('comer','ellas','comen')]),
('onomatopeya','¿Qué onomatopeya va con cada cosa?',[
  ono('El reloj ⏰','tic-tac',['tic-tac','ring, ring','boing']),ono('Aplaudir 👏','plas, plas',['ñam, ñam','plas, plas','crac']),
  ono('Comer algo rico 😋','ñam, ñam',['ñam, ñam','tic-tac','plas, plas']),ono('Una pelota que bota ⚽','boing',['crac','boing','ring, ring']),
  ono('El teléfono 📞','ring, ring',['ring, ring','tic-tac','ñam, ñam'])]),
('onomatopeya','¿Cómo ladra un perro inglés? 🐶',[
  fila('En castellano, el perro dice '+g('guau',['guau','woof','miau'])),
  fila('En inglés, el perro dice '+g('woof',['guau','woof','muuu'])),
  fila('¿El sonido de un animal se escribe igual en todos los idiomas? '+g('No',SN))]),
('cuento','¿En qué parte del cuento usarías cada frase?',[parte('Hace muchos años…','Inicio'),parte('De pronto…','Nudo'),parte('Por fin…','Desenlace'),parte('Entonces…','Nudo'),parte('Y fueron felices y comieron perdices.','Desenlace')]),
('cuento','Ordena el cuento: 1, 2 o 3.',[
  fila('De pronto, empezó a llover y la hormiga se quedó atrapada en una hoja que flotaba en un charco. '+g('2',['1','2','3'])),
  fila('Finalmente, un pájaro la llevó hasta la orilla y la hormiga volvió feliz a su casa. '+g('3',['1','2','3'])),
  fila('Había una vez una hormiga muy trabajadora que vivía en un jardín. '+g('1',['1','2','3']))]),
]

E3=[
('descripcion','¿En qué apartado de la ficha va cada palabra?',[voc('alas','Cómo es'),voc('camina','Cómo se desplaza'),voc('flores','Qué come'),voc('ciudad','Dónde vive'),voc('caparazón','Cómo es'),voc('salta','Cómo se desplaza')]),
('descripcion','Estás haciendo la ficha del búho 🦉. ¿En qué apartado va cada frase?',[
  ficha('Tiene plumas y unos ojos muy grandes.','Cómo es'),ficha('Se desplaza volando.','Cómo se desplaza'),
  ficha('Come ratones e insectos.','Qué come'),ficha('Puede girar la cabeza 270 grados.','Curiosidades'),
  ficha('Evitando cortar los árboles del bosque.','Cómo puedo protegerlo')]),
('verbo','Cómo plantar una semilla 🌱. Escribe el infinitivo de cada verbo.',[
  texto('Primero, llena una maceta de tierra. Luego, mete la semilla. Después, riégala. Por último, pon la maceta al sol y espera.'),
  infinitivo('llena','llenar'),infinitivo('mete','meter'),infinitivo('riégala','regar'),infinitivo('pon','poner'),infinitivo('espera','esperar')]),
('verbo','Descubre la palabra misteriosa. Es un verbo, su infinitivo termina en -er y está en 3.ª persona del plural.',[
  fila(g('corren',['corren','saltan','carrera','comes']),'data-misteriosa="er|3|plural"')]),
('persona','Busca los verbos del texto y di su persona y número.',[texto('Yo paseo a mi perro por el parque. Mi hermana y yo lo cuidamos. Tú le cepillas el pelo y él salta de alegría.'),*persona('paseo','pasear','1.ª persona','singular'),*persona('cuidamos','cuidar','1.ª persona','plural'),*persona('cepillas','cepillar','2.ª persona','singular'),*persona('salta','saltar','3.ª persona','singular')]),
('persona','Completa la conjugación del verbo vivir.',[conjuga('vivir','yo','vivo'),conjuga('vivir','tú','vives'),conjuga('vivir','él','vive'),conjuga('vivir','nosotros','vivimos'),conjuga('vivir','vosotros','vivís')]),
('onomatopeya','Elige la onomatopeya de cada verbo.',[
  ono('traquetear','¡traca, traca!',['¡traca, traca!','¡chas!','¡muuu!']),ono('chasquear','¡chas!',['¡pío, pío!','¡chas!','¡plas, plas!']),
  ono('mugir','¡muuu!',['¡chap, chap!','¡traca, traca!','¡muuu!']),ono('chapotear','¡chap, chap!',['¡chap, chap!','¡pío, pío!','¡chas!'])]),
('onomatopeya','¿Cuál de estas palabras es una onomatopeya?',[esono('miau',['gato','miau','maullar']),esono('boing',['pelota','boing','botar']),esono('pío, pío',['pájaro','pío, pío','volar']),esono('beee',['beee','oveja','lana'])]),
('cuento','El cuento.',[
  fila('En un cuento se narra una historia que les sucede a unos '+g('personajes',['personajes','verbos','números'])+' en un lugar y un tiempo concretos.'),
  fila('¿Cuántas partes tiene un cuento? '+g('tres',['dos','tres','cinco'])),
  fila('En el inicio se cuenta '+g('dónde, cuándo y quién',['dónde, cuándo y quién','qué ocurre y cómo se complica','cómo se resuelve y cómo acaba'])),
  fila('En el desenlace se cuenta '+g('cómo se resuelve y cómo acaba',['dónde, cuándo y quién','qué ocurre y cómo se complica','cómo se resuelve y cómo acaba']))]),
('cuento','Lee el cuento y responde.',[
  texto('Hace muchos años, en un país muy lejano, vivía un dragón que no sabía echar fuego. De repente, un día de invierno, el dragón estornudó y… ¡le salió una llama! Y así concluyó la historia del dragón: desde entonces calienta a todo el pueblo.'),
  fila('¿Quién es el protagonista? '+g('un dragón',['un dragón','el pueblo','el invierno'])),
  fila('¿Cuándo ocurre? '+g('hace muchos años',['hace muchos años','hoy','dentro de un mes'])),
  fila('¿Dónde ocurre? '+g('en un país muy lejano',['en un país muy lejano','en el mar','en un colegio'])),
  fila('¿Cuál es el problema? '+g('no sabía echar fuego',['no sabía echar fuego','tenía frío','estaba enfermo'])),
  fila('¿Con qué frase empieza el desenlace? '+g('Y así concluyó',['Y así concluyó','De repente','Hace muchos años']))]),
]

for n,E in [(1,E1),(2,E2),(3,E3)]:
    assert len(E)==10,(n,len(E))
    d=os.path.join(RAIZ,'examen%d'%n);os.makedirs(d,exist_ok=True)
    open(os.path.join(d,'index.html'),'w').write(pagina(n,E))
print('ok')
