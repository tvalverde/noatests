import os, html, json
AQUI=os.path.dirname(os.path.abspath(__file__))
V=json.load(open(os.path.join(AQUI,'version.json')))['version']  # versión de los archivos comunes (?v=N); la cambia herramientas/subir-version.js
RAIZ=os.path.join(AQUI,'..','sociales/tema1-como-encontrar-lugares')
SEIS=['polo norte','polo sur','ecuador','eje terrestre','hemisferio norte','hemisferio sur']
EST=['invierno','primavera','verano','otoño']
CARD=['norte','sur','este','oeste']
VF=['Verdadero','Falso']

def g(r,ops):
    assert r in ops,(r,ops)
    return '<span class="grupo" data-r="%s">%s</span>'%(html.escape(r),''.join('<span class="opcion">%s</span>'%html.escape(o) for o in ops))
def i(r,num=False,largo=False):
    a=' inputmode="numeric"' if num else ''
    c=' class="largo"' if largo else ''
    return '<input type="text"%s%s data-r="%s">'%(a,c,html.escape(r))
def fila(t,attrs=''):
    return '  <div class="fila"%s>%s</div>'%((' '+attrs) if attrs else '',t)
def L(x):return '<b>%s</b>'%x
def preg(n,tipo,titulo,cuerpo,extra=''):
    return '<div class="pregunta" data-tipo="%s"%s>\n  <h2><span class="num">%d</span>%s</h2>\n%s\n</div>\n'%(tipo,(' '+extra) if extra else '',n,titulo,'\n'.join(cuerpo))

def pagina(num,preguntas):
    cuerpo=''.join(preg(k+1,*p) for k,p in enumerate(preguntas))
    return f'''<!DOCTYPE html>
<html lang="es" style="--materia:#3aa655;--materia-borde:#3aa655">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Examen {num} · Ciencias Sociales · Exámenes de Noa</title>
<link rel="manifest" href="../../../manifest.json">
<meta name="theme-color" content="#3aa655">
<link rel="stylesheet" href="../../../comun/examen.css?v={V}">
</head>
<body>
<header>
  <nav class="migas"><a href="../../../">Inicio</a> › <a href="../../">Ciencias Sociales</a> › <a href="../">Unidad 1</a> › <span>Examen {num}</span></nav>
  <h1>Examen {num}</h1>
  <p>Unidad 1 · Cómo encontrar lugares</p>
  <p class="formato">Toca la respuesta correcta o escríbela</p>
</header>
<main>

{cuerpo}
<button class="principal" id="corregir">¡Entregar examen!</button>

</main>
<script src="../../../sync.js?v={V}"></script>
<script src="../../dibujos.js?v={V}"></script>
<script src="../../../comun/examen.js?v={V}"></script>
<script src="../../../sw-registro.js"></script>
</body>
</html>
'''

E1=[
('tierra','Completa la ficha técnica de nuestro planeta.',[
  fila('Nombre: '+i('Tierra')),
  fila('Se encuentra en el Sistema '+i('solar')),
  fila('Su estrella más cercana es el '+i('Sol')),
  fila('Su satélite es la '+i('Luna')),
  fila('Forma: '+g('esférica',['plana','esférica','cuadrada']))]),
('tierra','Mira el dibujo del Sol, la Tierra y la Luna. ¿Qué es cada letra?',[
  '  <div class="orbita" data-letras="A=sol;B=tierra;C=luna;D=rotación;E=traslación"></div>',
  fila(L('A')+' es: '+g('Sol',['Sol','Tierra','Luna'])),
  fila(L('B')+' es: '+g('Tierra',['Sol','Tierra','Luna'])),
  fila(L('C')+' es: '+g('Luna',['Sol','Tierra','Luna'])),
  fila(L('D')+' es el movimiento de '+g('rotación',['rotación','traslación'])),
  fila(L('E')+' es el movimiento de '+g('traslación',['rotación','traslación']))]),
('tierra','El Sol solo ilumina una mitad de la Tierra. Fíjate en las letras del dibujo.',[
  '  <div class="dia-noche" data-sol="izquierda" data-letras="A=día;B=noche"></div>',
  fila(L('A')+' Allí es de '+g('día',['día','noche'])),
  fila(L('B')+' Allí es de '+g('noche',['día','noche'])),
  fila('El día y la noche se producen por el movimiento de '+g('rotación',['rotación','traslación'])),
  fila('La Tierra tarda en dar una vuelta sobre sí misma '+g('24 horas',['7 días','24 horas','365 días y 6 horas']))]),
('estaciones','Cada árbol está en una estación distinta. ¿En cuál está cada uno?',[
  '  <div class="arboles" data-letras="A=otoño;B=invierno;C=verano;D=primavera"></div>',
  fila(L('A')+' '+g('otoño',EST)),fila(L('B')+' '+g('invierno',EST)),fila(L('C')+' '+g('verano',EST)),fila(L('D')+' '+g('primavera',EST))]),
('estaciones','Las estaciones del año.',[
  fila('Hay '+i('4',True)+' estaciones y cada una dura '+i('3',True)+' meses.'),
  fila('El verano empieza el 21 de '+g('junio',['marzo','junio','septiembre','diciembre'])),
  fila('La estación más fría del año es el '+g('invierno',['invierno','otoño','verano'])),
  fila('Las estaciones se producen por el movimiento de '+g('traslación',['rotación','traslación']))]),
('globo','Observa el globo terráqueo. ¿Qué señala cada letra?',[
  '  <div class="globo" data-letras="A=polo norte;B=ecuador;C=hemisferio sur;D=eje terrestre"></div>',
  fila(L('A')+' '+g('polo norte',SEIS)),fila(L('B')+' '+g('ecuador',SEIS)),fila(L('C')+' '+g('hemisferio sur',SEIS)),fila(L('D')+' '+g('eje terrestre',SEIS))]),
('planisferio','Hay dos formas de representar la Tierra. Mira los dos dibujos.',[
  '  <div class="representaciones" data-letras="A=planisferio;B=globo terráqueo"></div>',
  fila(L('A')+' es un '+g('planisferio',['globo terráqueo','planisferio'])),
  fila(L('B')+' es un '+g('globo terráqueo',['globo terráqueo','planisferio'])),
  fila('¿Cuál representa la Tierra de forma más exacta? '+g('el globo terráqueo',['el globo terráqueo','el planisferio'])),
  fila('Las líneas horizontales del planisferio se llaman '+g('paralelos',['paralelos','meridianos']))]),
('mapas','Este es el mapa de una isla inventada. ¿Cómo se llama cada elemento señalado con una letra?',[
  '  <div class="mapa" data-clase="tiempo" data-tiempo="norte=lluvia;sur=sol;este=nubes;oeste=nieve;centro=solnubes" data-letras="A=título;B=leyenda;C=escala;D=marca de orientación"></div>',
  *[fila(L(x)+' '+g(v,['título','leyenda','escala','marca de orientación','toponimia'])) for x,v in [('A','título'),('B','leyenda'),('C','escala'),('D','marca de orientación')]],
  fila('Es un mapa '+g('temático',['físico','político','temático']))]),
('planos','Mira el plano del barrio de Noa.',[
  '  <div class="calles" data-cols="3" data-rows="2" data-calles-h="Calle Negro|Avenida Azul|Calle Naranja" data-calles-v="Calle Verde|Calle Violeta|Calle Rosa|Calle Gris" data-edificios="0,0,hospital;0,1,colegio;0,2,bomberos;1,0,casa,Casa de Noa;1,1,parque;1,2,salud"></div>',
  fila('¿Qué hay al norte de la Avenida Azul, entre la calle Violeta y la calle Rosa? '+g('Colegio',['Hospital','Colegio','Bomberos','Parque']),'data-bloque="0,1"'),
  fila('¿Qué hay en la esquina de la calle Gris con la calle Naranja? '+g('Centro de salud',['Bomberos','Centro de salud','Parque','Casa de Noa']),'data-bloque="1,2"'),
  fila('Desde la casa de Noa, ¿hacia qué punto cardinal está el hospital? '+g('norte',CARD),'data-desde="1,0" data-hacia="0,0"'),
  fila('Desde la casa de Noa, ¿hacia dónde tiene que caminar para ir al parque? '+g('este',CARD),'data-desde="1,0" data-hacia="1,1"')]),
('orientacion','Noa está de excursión y ve salir el sol. Fíjate en las letras.',[
  '  <div class="horizonte" data-astro="amanecer" data-en="A" data-pos="A=izquierda;B=derecha"></div>',
  fila(L('A')+' es el '+g('este',CARD)),
  fila(L('B')+' es el '+g('oeste',CARD)),
  '  <div class="rosa" data-estilo="brujula" data-letras="C=sur;D=este"></div>',
  fila('En la brújula, '+L('C')+' es el '+g('sur',CARD)),
  fila('En la brújula, '+L('D')+' es el '+g('este',CARD)),
  fila('La flecha imantada de la brújula siempre señala el '+g('norte',CARD))]),
]

E2=[
('tierra','¿Verdadero o falso?',[
  fila('La Tierra tarda 24 horas en dar una vuelta sobre sí misma. '+g('Verdadero',VF)),
  fila('El movimiento de traslación provoca el día y la noche. '+g('Falso',VF)),
  fila('El movimiento de traslación dura 2 años. '+g('Falso',VF)),
  fila('La Tierra es el único planeta conocido en el que hay vida. '+g('Verdadero',VF))]),
('tierra','Completa el texto.',[
  fila('Nuestro planeta se llama '+i('Tierra')+' y gira alrededor de una estrella llamada '+i('Sol')+'.'),
  fila('Tiene un satélite: la '+i('Luna')+'.'),
  fila('Una vuelta completa alrededor del Sol dura '+i('365',True)+' días y 6 horas, es decir, un '+i('año')+'.')]),
('estaciones','¿En qué estación del año cae cada fecha?',[
  fila('15 de enero: '+g('invierno',EST),'data-fecha="15-01"'),
  fila('10 de agosto: '+g('verano',EST),'data-fecha="10-08"'),
  fila('1 de noviembre: '+g('otoño',EST),'data-fecha="01-11"'),
  fila('30 de abril: '+g('primavera',EST),'data-fecha="30-04"')]),
('estaciones','Mira estos dos árboles.',[
  '  <div class="arboles" data-letras="A=primavera;B=otoño"></div>',
  fila(L('A')+' está en '+g('primavera',EST)),
  fila(L('B')+' está en '+g('otoño',EST)),
  fila('En primavera, los días empiezan a ser más '+g('largos',['largos','cortos'])),
  fila('En verano, los días son más '+g('largos',['largos','cortos'])+' que las noches.')]),
('globo','Observa el globo terráqueo.',[
  '  <div class="globo" data-letras="A=hemisferio norte;B=polo sur"></div>',
  fila(L('A')+' es el '+g('hemisferio norte',SEIS)),
  fila(L('B')+' es el '+g('polo sur',SEIS)),
  fila('La línea imaginaria que divide la Tierra en hemisferio norte y hemisferio sur es el '+g('ecuador',['ecuador','eje terrestre','polo norte'])),
  fila('España está en el hemisferio '+g('norte',['norte','sur']))]),
('planisferio','Mira el planisferio. El punto rojo es España.',[
  '  <div class="planisferio" data-letras="A=África;B=América;C=Oceanía" data-espana="1"></div>',
  *[fila(L(x)+' es '+g(v,['América','Europa','África','Oceanía'])) for x,v in [('A','África'),('B','América'),('C','Oceanía')]],
  fila('España está en el continente de '+g('Europa',['Europa','África','Asia'])),
  fila('El continente más al sur, junto al polo sur, es la '+g('Antártida',['Antártida','Oceanía','Asia']))]),
('mapas','Estos tres mapas son de la misma isla. ¿De qué tipo es cada uno?',[
  '  <div class="mapas-tipos" data-letras="A=político;B=físico;C=temático"></div>',
  *[fila(L(x)+' es un mapa '+g(v,['físico','político','temático'])) for x,v in [('A','político'),('B','físico'),('C','temático')]],
  fila('Los mapas del tiempo son mapas '+g('temáticos',['físicos','políticos','temáticos']))]),
('planos','¿Usarías un plano o un mapa para representar…?',[
  fila('…las habitaciones de tu casa: '+g('plano',['plano','mapa'])),
  fila('…las carreteras de tu comunidad autónoma: '+g('mapa',['plano','mapa'])),
  fila('…las partes de tu colegio: '+g('plano',['plano','mapa'])),
  fila('…las ciudades de España: '+g('mapa',['plano','mapa']))],'data-sin-dibujo="1"'),
('planos','Llegas al hospital y en la entrada ves este plano.',[
  '  <div class="edificio" data-bloques="A:Urgencias|Sala de curas|Sala de espera;B:Pediatría|Cafetería|Laboratorio;C:Diagnóstico|Ingreso hospitalario|Consultas" data-puertas="A=1;B=2;C=3"></div>',
  fila('Tienes que ir a Urgencias. ¿A qué bloque vas? '+g('Bloque A',['Bloque A','Bloque B','Bloque C']),'data-sala="Urgencias"'),
  fila('¿Por qué puerta entras para ir a Urgencias? '+g('Puerta 1',['Puerta 1','Puerta 2','Puerta 3']),'data-sala="Urgencias"'),
  fila('¿En qué bloque está Pediatría, la consulta de los niños? '+g('Bloque B',['Bloque A','Bloque B','Bloque C']),'data-sala="Pediatría"'),
  fila('¿Por qué puerta entras para ir al Laboratorio? '+g('Puerta 2',['Puerta 1','Puerta 2','Puerta 3']),'data-sala="Laboratorio"')]),
('orientacion','Es de noche y Noa ha encontrado la estrella polar. Fíjate en las letras.',[
  '  <div class="horizonte" data-astro="polar" data-en="C" data-pos="A=izquierda;C=centro;B=derecha"></div>',
  fila(L('C')+' es el '+g('norte',CARD)),
  fila(L('A')+' es el '+g('oeste',CARD)),
  fila(L('B')+' es el '+g('este',CARD)),
  fila('El GPS nos dice dónde estamos gracias a las señales de los '+g('satélites',['satélites','planetas','árboles'])),
  fila('Lola y Adolfo llamaron al número de emergencias: el '+i('112',True))]),
]

E3=[
('tierra','Mira el dibujo y contesta.',[
  '  <div class="orbita" data-nombres="1"></div>',
  fila('¿Cuánto tarda la Tierra en dar una vuelta completa alrededor del Sol? '+g('365 días y 6 horas',['24 horas','30 días','365 días y 6 horas'])),
  fila('La rotación es el giro de la Tierra '+g('sobre sí misma',['sobre sí misma','alrededor del Sol'])),
  fila('El movimiento de traslación produce '+g('las estaciones del año',['las estaciones del año','el día y la noche']))]),
('tierra','Ahora el Sol está al otro lado. Fíjate en las letras.',[
  '  <div class="dia-noche" data-sol="derecha" data-letras="A=noche;B=día"></div>',
  fila(L('A')+' Allí es de '+g('noche',['día','noche'])),
  fila(L('B')+' Allí es de '+g('día',['día','noche'])),
  fila('Un día completo, con su noche, dura '+i('24',True)+' horas.')]),
('estaciones','¿En qué estación está cada árbol?',[
  '  <div class="arboles" data-letras="A=verano;B=primavera;C=invierno;D=otoño"></div>',
  fila(L('A')+' '+g('verano',EST)),fila(L('B')+' '+g('primavera',EST)),fila(L('C')+' '+g('invierno',EST)),fila(L('D')+' '+g('otoño',EST)),
  fila('¿Cuál es la estación más fría del año, con los días más cortos que las noches? '+g('invierno',EST))]),
('estaciones','Completa las fechas en las que empieza cada estación.',[
  fila('La primavera empieza el 21 de '+i('marzo')),
  fila('El otoño empieza el 22 de '+i('septiembre')),
  fila('El invierno empieza el 21 de '+i('diciembre')),
  fila('Si tu cumpleaños es el 5 de julio, ¿en qué estación es? '+g('verano',EST),'data-fecha="05-07"')]),
('globo','El globo terráqueo.',[
  '  <div class="globo" data-letras="A=eje terrestre;B=polo sur"></div>',
  fila(L('A')+' es el '+g('eje terrestre',SEIS)),
  fila(L('B')+' es el '+g('polo sur',SEIS)),
  fila('El globo terráqueo representa la Tierra en forma de '+g('esfera',['esfera','rectángulo','triángulo'])),
  fila('A la Tierra la llamamos «planeta azul» porque '+g('tiene mucha agua',['tiene mucha agua','el cielo es azul','está pintada de azul']))]),
('planisferio','Lee lo que dicen. ¿Hablan de un globo terráqueo o de un planisferio?',[
  fila('Nerea: «Tengo uno que ocupa toda la pared de mi cuarto y voy clavando chinchetas en los países que he visitado». '+g('planisferio',['globo terráqueo','planisferio'])),
  fila('Víctor: «De un simple golpe de vista puedo ver todos los océanos del planeta». '+g('planisferio',['globo terráqueo','planisferio'])),
  fila('Manuela: «Cuando quiero saber dónde está un país, no paro de darle vueltas hasta que lo encuentro». '+g('globo terráqueo',['globo terráqueo','planisferio'])),
  fila('Daniel: «Me gusta más porque es una representación más real de nuestro planeta». '+g('globo terráqueo',['globo terráqueo','planisferio']))],'data-sin-dibujo="1"'),
('mapas','Los elementos de los mapas.',[
  fila('La escala nos indica '+g('las medidas reales',['las medidas reales','el significado de los símbolos','el título'])),
  fila('La leyenda muestra '+g('el significado de los símbolos',['las medidas reales','el significado de los símbolos','dónde está el norte'])),
  fila('Los nombres de ciudades, montañas u océanos que aparecen escritos en un mapa son la '+g('toponimia',['toponimia','escala','leyenda'])),
  fila('¿Sirve un mapa para conocer la distancia entre dos lugares? '+g('Sí',['Sí','No']))]),
('mapas','Este mapa del tiempo es de la isla inventada. Usa la leyenda y la marca de orientación.',[
  '  <div class="mapa" data-clase="tiempo" data-tiempo="norte=nieve;sur=sol;este=lluvia;oeste=nubes;centro=solnubes"></div>',
  fila('¿Qué tiempo hará en el norte de la isla? '+g('Nieve',['Soleado','Sol y nubes','Nublado','Lluvia','Nieve']),'data-zona="norte"'),
  fila('¿Y en el este? '+g('Lluvia',['Soleado','Sol y nubes','Nublado','Lluvia','Nieve']),'data-zona="este"'),
  fila('¿En qué parte de la isla estará soleado? '+g('sur',CARD),'data-tiempo="sol"'),
  fila('¿Qué elemento del mapa te dice qué significa cada dibujo? '+g('la leyenda',['la leyenda','la escala','el título']))]),
('planos','En este plano faltan tres edificios: el hospital, el colegio y el polideportivo. ¿En qué letra va cada uno?',[
  '  <div class="calles" data-cols="3" data-rows="2" data-calles-h="Calle Luna|Avenida Sol|Calle Estrella" data-calles-v="Calle Pino|Calle Roble|Calle Olmo|Calle Haya" data-edificios="0,0,letra,A;0,1,mercado;0,2,letra,B;1,0,biblioteca;1,1,letra,C;1,2,farmacia"></div>',
  fila('El polideportivo está al norte de la Avenida Sol, entre la calle Olmo y la calle Haya. '+g('B',['A','B','C']),'data-bloque="0,2"'),
  fila('El hospital está en la esquina de la calle Pino con la calle Luna. '+g('A',['A','B','C']),'data-bloque="0,0"'),
  fila('El colegio está al sur de la Avenida Sol, entre la calle Roble y la calle Olmo. '+g('C',['A','B','C']),'data-bloque="1,1"'),
  fila('Desde la farmacia, ¿hacia qué punto cardinal está la biblioteca? '+g('oeste',CARD),'data-desde="1,2" data-hacia="1,0"')]),
('orientacion','En el campo también podemos orientarnos. Mira la montaña.',[
  '  <div class="monte" data-letras="A=solana;B=umbría"></div>',
  fila(L('A')+' se llama '+g('solana',['umbría','solana'])),
  fila(L('B')+' mira hacia el '+g('norte',['norte','sur'])),
  fila('Por la tarde, el sol se pone por el '+g('oeste',CARD)),
  fila('Al amanecer te pones mirando hacia el sol. El norte queda a tu '+g('izquierda',['izquierda','derecha','espalda']),'data-mirando="este" data-busca="norte"')]),
]

for n,E in [(1,E1),(2,E2),(3,E3)]:
    assert len(E)==10,(n,len(E))
    d=os.path.join(RAIZ,'examen%d'%n);os.makedirs(d,exist_ok=True)
    open(os.path.join(d,'index.html'),'w').write(pagina(n,E))
print('ok')
