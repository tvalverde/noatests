import os, html, json
AQUI=os.path.dirname(os.path.abspath(__file__))
V=json.load(open(os.path.join(AQUI,'version.json')))['version']  # versión de los archivos comunes (?v=N); la cambia herramientas/subir-version.js
RAIZ=os.path.join(AQUI,'..','lengua/tema2-animales')
SN=['Sí','No'];VF=['Verdadero','Falso'];NUM=['singular','plural']
PARTES=['Inicio','Nudo','Desenlace']
PERS=['1.ª persona del singular','2.ª persona del singular','3.ª persona del singular','1.ª persona del plural','2.ª persona del plural','3.ª persona del plural']
CONJ=['1.ª conjugación','2.ª conjugación','3.ª conjugación']
VOC=['Cómo es','Cómo se desplaza','Qué come','Dónde vive']

def g(r,ops):
    assert r in ops,(r,ops);assert len(set(o.lower() for o in ops))==len(ops),ops
    return '<span class="grupo" data-r="%s">%s</span>'%(html.escape(r),''.join('<span class="opcion">%s</span>'%html.escape(o) for o in ops))
def i(r):return '<input type="text" data-r="%s">'%html.escape(r)
def fila(t,attrs=''):return '  <div class="fila"%s>%s</div>'%((' '+attrs) if attrs else '',t)
def b(x):return '<b>%s</b>'%html.escape(x)
H='<span style="display:inline-block;min-width:3.2em;border-bottom:3px solid #2a8f8f;margin:0 2px">&nbsp;</span>'
def texto(t):return '  <div class="fila" style="background:#eef7f7;border-radius:12px;padding:10px 12px;line-height:1.6">%s</div>'%html.escape(t)
def preg(n,tipo,titulo,cuerpo):
    return '<div class="pregunta" data-tipo="%s">\n  <h2><span class="num">%d</span>%s</h2>\n%s\n</div>\n'%(tipo,n,html.escape(titulo),'\n'.join(cuerpo))

# piezas que el test recalcula con sus propias tablas
def infinitivo(forma,inf):return fila(b(forma)+' → '+i(inf),'data-inf="%s"'%forma)
def conjugacion(inf,r):return fila(b(inf)+' '+g(r,CONJ),'data-conj="%s"'%inf)
def numero(forma,r):return fila(b(forma)+' '+g(r,NUM),'data-num="%s"'%forma)
def persona(forma,per,num):return [fila(b(forma)+' '+g(per,['1.ª persona','2.ª persona','3.ª persona']),'data-per="%s"'%forma),fila('y está en '+g(num,NUM),'data-num="%s"'%forma)]
def ono(cosa,r,ops):return fila(html.escape(cosa)+' '+g(r,ops),'data-ono="%s"'%cosa)
def parte(frase,r):return fila('«'+html.escape(frase)+'» '+g(r,PARTES),'data-parte="%s"'%frase)
def voc(palabra,r):return fila(b(palabra)+' '+g(r,VOC),'data-voc="%s"'%palabra)
def animal(forma,r,ops):return fila(b(forma)+' '+g(r,ops),'data-animal="%s"'%forma)
def conjuga(inf,pron,r):return fila('('+html.escape(pron)+') '+i(r),'data-conjuga="%s|%s"'%(inf,pron))

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
('comprension','Monos en peligro. Completa la ficha del tití pigmeo 🐒.',[
  fila('Su cuerpo mide '+g('12 cm',['12 cm','17 cm','5 cm'])),
  fila('Su cola mide '+g('17 cm',['12 cm','17 cm','50 cm'])),
  fila('Puede saltar hasta '+g('5 metros',['5 metros','15 metros','50 metros'])),
  fila('Puede girar la cabeza '+g('180°',['90°','180°','270°']))]),
('comprension','Monos en peligro. ¿Verdadero o falso?',[
  fila('El tití pigmeo puede saltar hasta 15 metros. '+g('Falso',VF)),
  fila('El tití pigmeo come insectos. '+g('Verdadero',VF)),
  fila('Los monos ayudan a regenerar la selva. '+g('Verdadero',VF)),
  fila('Los árboles consumen mucho oxígeno. '+g('Falso',VF))]),
('descripcion','Para describir un animal, ¿en qué apartado de la ficha va cada palabra?',[
  voc('escamas','Cómo es'),voc('repta','Cómo se desplaza'),voc('río','Dónde vive'),voc('frutas','Qué come'),voc('pezuñas','Cómo es')]),
('descripcion','Lee la ficha y adivina el animal.',[
  texto('Tiene dientes, aletas, cola y la piel resistente y gruesa. Se desplaza nadando. Es carnívoro: come peces, cangrejos y calamares. Vive en los mares y océanos. Si se le cae un diente, le vuelve a crecer.'),
  fila('¿Qué animal es? '+g('el tiburón',['el tiburón','la tortuga','el ciervo'])),
  fila('Para protegerlo es importante '+g('no contaminar el mar',['no contaminar el mar','darle de comer','sacarlo del agua']))]),
('verbo','¿Cuáles de estas palabras son verbos?',[
  fila(b('cantar')+' '+g('Sí',SN),'data-esverbo="cantar"'),fila(b('abridor')+' '+g('No',SN),'data-esverbo="abridor"'),
  fila(b('piar')+' '+g('Sí',SN),'data-esverbo="piar"'),fila(b('billar')+' '+g('No',SN),'data-esverbo="billar"'),
  fila(b('aburrir')+' '+g('Sí',SN),'data-esverbo="aburrir"')]),
('verbo','Escribe el infinitivo de estos verbos.',[infinitivo('pía','piar'),infinitivo('subirá','subir'),infinitivo('comían','comer'),infinitivo('duerme','dormir')]),
('persona','¿Quién hace la acción: una persona o varias? Elige singular o plural.',[
  numero('pide','singular'),numero('paseaban','plural'),numero('salimos','plural'),numero('entrenarás','singular'),numero('sumó','singular')]),
('onomatopeya','Elige la onomatopeya de cada verbo.',[
  ono('aplaudir','¡plas, plas!',['¡plas, plas!','¡chap, chap!','¡pío, pío!']),
  ono('chapotear','¡chap, chap!',['¡muuu!','¡chap, chap!','¡chas!']),
  ono('piar','¡pío, pío!',['¡pío, pío!','¡traca, traca!','¡plas, plas!']),
  ono('mugir','¡muuu!',['¡chas!','¡pío, pío!','¡muuu!'])]),
('cuento','Pulgarcito. Ordena las partes del cuento: 1, 2 o 3.',[
  fila('Pulgarcito ayudó al rey gracias a su valentía y a las botas mágicas. Él y sus hermanos vivieron felices en palacio. '+g('3',['1','2','3']),'data-pulgarcito="3"'),
  fila('Un día su padre los abandonó en el bosque y los niños llegaron a la casa de un ogro. Pulgarcito se puso las botas del ogro, que eran mágicas. '+g('2',['1','2','3']),'data-pulgarcito="2"'),
  fila('Había una vez un niño diminuto, como un dedo pulgar. Vivía con sus padres y sus seis hermanos mayores en una cabaña muy pobre. '+g('1',['1','2','3']),'data-pulgarcito="1"')]),
('cuento','Las partes del cuento. ¿En qué parte…?',[
  fila('…se cuenta dónde y cuándo ocurre y quiénes son los protagonistas? '+g('Inicio',PARTES)),
  fila('…aparece el problema y se complica? '+g('Nudo',PARTES)),
  fila('…se resuelve el problema y acaba la historia? '+g('Desenlace',PARTES))]),
]

E2=[
('comprension','La deforestación. Elige la respuesta.',[
  fila('Una de las mayores amenazas para los monos es '+g('la pérdida de sus hábitats',['la pérdida de sus hábitats','el frío','los otros monos'])),
  fila('Los monos ayudan a que la selva se regenere porque '+g('en sus heces hay semillas de los frutos que comen',['en sus heces hay semillas de los frutos que comen','plantan árboles con las manos','beben mucha agua'])),
  fila('Los árboles producen mucho '+g('oxígeno',['oxígeno','humo','agua'])),
  fila('¿Cuál es la finalidad de los dos textos de «Monos en peligro»? '+g('Dar información',['Contar una historia','Dar información','Dar consejos']))]),
('comprension','Los animales se comunican entre sí. Elige la respuesta.',[
  fila('Koko es una gorila famosa porque aprendió '+g('lengua de signos',['lengua de signos','a leer','a cantar'])),
  fila('Las lechuzas se comunican de un modo muy educado, '+g('respetando los turnos',['respetando los turnos','gritando','bailando'])),
  fila('El «cri cri» de los grillos se produce por el roce de sus '+g('alas',['alas','patas','antenas'])),
  fila('Las abejas hacen una especie de baile para avisar de que hay '+g('polen',['polen','peligro','lluvia']))]),
('descripcion','La lagartija 🦎. Elige la respuesta.',[
  fila('Tiene el cuerpo cubierto de '+g('escamas',['escamas','plumas','pelo'])),
  fila('Se desplaza '+g('caminando',['caminando','volando','nadando'])+' y corre muy rápido.'),
  fila('Come '+g('mosquitos, arañas y moscas',['mosquitos, arañas y moscas','frutas y flores','peces y cangrejos'])),
  fila('Si pierde la cola, '+g('le vuelve a crecer',['le vuelve a crecer','no puede andar','se queda sin cola'])),
  fila('¿Tiene veneno? '+g('No',SN))]),
('descripcion','Cómo podemos proteger a los animales.',[
  fila('En un centro de recuperación de animales los curan '+g('hasta que pueden volver a vivir en libertad',['hasta que pueden volver a vivir en libertad','para tenerlos siempre allí','para venderlos'])),
  fila('¿Cuál es una forma de proteger a los animales? '+g('Cuidar los espacios donde viven',['Cuidar los espacios donde viven','Tirar bolsas al bosque','Cazarlos'])),
  fila('¿Y otra? '+g('Evitar contaminar el aire y el agua',['Evitar contaminar el aire y el agua','Cortar los árboles','Hacer mucho ruido']))]),
('verbo','¿De qué conjugación es cada infinitivo?',[conjugacion('cantar','1.ª conjugación'),conjugacion('comer','2.ª conjugación'),conjugacion('subir','3.ª conjugación'),conjugacion('ladrar','1.ª conjugación'),conjugacion('correr','2.ª conjugación')]),
('verbo','¿Qué animal hace cada sonido?',[
  animal('croa','la rana 🐸',['la rana 🐸','la vaca 🐄','el león 🦁']),
  animal('mugía','la vaca 🐄',['la gallina 🐔','la vaca 🐄','la oveja 🐑']),
  animal('cacarea','la gallina 🐔',['la gallina 🐔','el cerdo 🐷','la rana 🐸']),
  animal('rugieron','el león 🦁',['la oveja 🐑','el león 🦁','la vaca 🐄']),
  animal('balaban','la oveja 🐑',['la oveja 🐑','la gallina 🐔','el cerdo 🐷'])]),
('persona','Completa la conjugación del verbo cuidar.',[conjuga('cuidar','yo','cuido'),conjuga('cuidar','tú','cuidas'),conjuga('cuidar','nosotros','cuidamos'),conjuga('cuidar','vosotros','cuidáis'),conjuga('cuidar','ellos','cuidan')]),
('persona','El delfín Moko 🐬. Completa el texto con el verbo que falta.',[
  fila('Dos cachalotes se '+H+' atrapados en una playa de Nueva Zelanda. '+g('quedaron',['quedaron','apareció','logró'])),
  fila('Las ballenas no '+H+' cómo volver a aguas profundas. '+g('sabían',['sabían','tranquilizó','siguieron'])),
  fila('Hasta que '+H+' Moko, un delfín. '+g('apareció',['apareció','quedaron','sabían'])),
  fila('Las ballenas '+H+' al delfín mar adentro. '+g('siguieron',['siguieron','logró','apareció']))]),
('onomatopeya','¿Qué onomatopeya va con cada cosa?',[
  ono('Un plato que se rompe','¡Crac!',['¡Crac!','Tic-tac','Ring, ring']),
  ono('El teléfono','Ring, ring',['Tic-tac','Ring, ring','¡Crac!']),
  ono('El reloj','Tic-tac',['¡Crac!','Ring, ring','Tic-tac']),
  fila('¿Cómo ladra un perro inglés? '+g('woof',['woof','guau','miau']),'data-ono="Un perro inglés"')]),
('cuento','Guille y el ciervo 🦌. Elige la respuesta.',[
  fila('A Guille '+g('todo le daba miedo',['todo le daba miedo','nada le daba miedo','no le gustaban los animales'])),
  fila('Guille se fue de campamento '+g('a la sierra con su clase',['a la sierra con su clase','a la playa con su familia','a la ciudad con Germán'])),
  fila('El ciervo no apareció el segundo día porque '+g('tenía enganchada en la cornamenta la bolsa de plástico',['tenía enganchada en la cornamenta la bolsa de plástico','estaba dormido','se fue a otro bosque'])),
  fila('Guille liberó al ciervo con '+g('una rama',['una rama','sus manos','una cuerda'])),
  fila('Al final, todos juntos organizaron '+g('una campaña para limpiar el bosque',['una campaña para limpiar el bosque','una fiesta','una carrera']))]),
]

E3=[
('comprension','El tití pigmeo 🐒. Elige la respuesta.',[
  fila('Arborícola quiere decir '+g('que vive en los árboles',['que vive en los árboles','que come árboles','que planta árboles'])),
  fila('Tiene el tamaño de '+g('un hámster',['un hámster','un perro','un gato'])),
  fila('Pesa lo mismo que '+g('una baraja de cartas',['una baraja de cartas','una botella de agua','una mochila'])),
  fila('Bebe '+g('la savia dulce de algunos árboles',['la savia dulce de algunos árboles','leche','zumo de frutas'])),
  fila('En el texto del tití pigmeo predominan las '+g('descripciones',['narraciones','descripciones','instrucciones']))]),
('comprension','¿En qué parte de la lectura aparece cada idea?',[
  fila('Gracias a ellos, brotan nuevos árboles y la selva se regenera. '+g('La deforestación',['Tití pigmeo','La deforestación'])),
  fila('Pueden moverse por las ramas finas gracias a su tamaño y sus uñas afiladas. '+g('Tití pigmeo',['Tití pigmeo','La deforestación'])),
  fila('Los monos luchan por encontrar lugares donde vivir, comer y jugar. '+g('La deforestación',['Tití pigmeo','La deforestación'])),
  fila('Saben recolectar la savia dulce de ciertos árboles. '+g('Tití pigmeo',['Tití pigmeo','La deforestación']))]),
('descripcion','¿En qué apartado de la ficha va cada palabra?',[
  voc('plumas','Cómo es'),voc('vuela','Cómo se desplaza'),voc('plantas','Qué come'),voc('bosque','Dónde vive'),voc('nada (en el agua)','Cómo se desplaza'),voc('antenas','Cómo es')]),
('descripcion','Piensa cómo son estos animales y elige.',[
  fila('El cisne 🦢 tiene '+g('plumas',['plumas','escamas','caparazón'])),
  fila('El cisne 🦢 tiene '+g('pico',['pico','cuernos','aletas'])),
  fila('El cangrejo 🦀 tiene '+g('pinzas',['pinzas','plumas','alas'])),
  fila('El ciervo 🦌 tiene '+g('cuernos',['cuernos','aletas','escamas']))]),
('verbo','Cómo hacer un comedero para pájaros 🐦. Escribe el infinitivo.',[infinitivo('seca','secar'),infinitivo('introduce','introducir'),infinitivo('mete','meter'),infinitivo('recibirás','recibir'),infinitivo('haz','hacer')]),
('verbo','El verbo.',[
  fila('Los verbos son las palabras que indican '+g('acciones',['acciones','nombres','colores'])),
  fila('Los infinitivos terminan en '+g('-ar, -er o -ir',['-ar, -er o -ir','-a, -e o -i','-ando o -iendo'])),
  fila('La palabra misteriosa es un verbo de la 3.ª conjugación, es el sonido de un animal y está en 2.ª persona del singular: '+g('ruges',['ruges','muge','subes','ladramos']))]),
('persona','¿En qué persona y número está cada verbo?',[*persona('entiendes','2.ª persona','singular'),*persona('dice','3.ª persona','singular'),*persona('responsabilizamos','1.ª persona','plural'),*persona('estáis','2.ª persona','plural')]),
('onomatopeya','Las onomatopeyas.',[
  fila('Las onomatopeyas son palabras que representan '+g('sonidos',['sonidos','acciones','colores'])),
  ono('chasquear','¡chas!',['¡chas!','¡muuu!','¡pío, pío!']),
  ono('traquetear','¡traca, traca!',['¡plas, plas!','¡traca, traca!','¡chap, chap!']),
  ono('El gato','miau',['guau','miau','muuu']),
  ono('La vaca','muuu',['muuu','pío, pío','miau'])]),
('cuento','¿En qué parte del cuento usarías cada frase?',[
  parte('Érase una vez…','Inicio'),parte('De repente…','Nudo'),parte('En un país muy lejano…','Inicio'),parte('Finalmente…','Desenlace'),parte('Y colorín colorado, este cuento se ha acabado.','Desenlace')]),
('cuento','Los tres cerditos 🐷. Elige la respuesta.',[
  fila('En el inicio, los tres cerditos vivían felices '+g('en la granja',['en la granja','en la ciudad','en un castillo'])),
  fila('En el nudo, un lobo '+g('quiso comerse a los cerditos',['quiso comerse a los cerditos','ayudó a los cerditos','construyó una casa'])),
  fila('El lobo no pudo tirar la casa '+g('de ladrillo',['de paja','de madera','de ladrillo'])),
  fila('En el desenlace, los tres cerditos vivieron juntos '+g('en la casa de ladrillo',['en la casa de ladrillo','en la granja','en la casa de paja']))]),
]

for n,E in [(1,E1),(2,E2),(3,E3)]:
    assert len(E)==10,(n,len(E))
    d=os.path.join(RAIZ,'examen%d'%n);os.makedirs(d,exist_ok=True)
    open(os.path.join(d,'index.html'),'w').write(pagina(n,E))
print('ok')
