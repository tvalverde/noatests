import os, html, json
AQUI=os.path.dirname(os.path.abspath(__file__))
V=json.load(open(os.path.join(AQUI,'version.json')))['version']  # versión de los archivos comunes (?v=N); la cambia herramientas/subir-version.js
RAIZ=os.path.join(AQUI,'..','matematicas/temas4-5-sumar-restar-y-problemas')
def fmt(n): return f'{n:,}'.replace(',','.')
def g(r,ops):
    r=str(r);ops=[str(o) for o in ops];assert r in ops,(r,ops);assert len(set(o.lower() for o in ops))==len(ops)
    return '<span class="grupo" data-r="%s">%s</span>'%(html.escape(r),''.join('<span class="opcion">%s</span>'%html.escape(o) for o in ops))
def i(n):
    r=fmt(n) if isinstance(n,int) else n
    return '<input type="text" inputmode="decimal" data-r="%s">'%html.escape(r)
def fila(t,attrs=''): return '  <div class="fila"%s>%s</div>'%((' '+attrs) if attrs else '',t)
SN=['sí','no'];nw=lambda t:'<span style="white-space:nowrap">'+t+'</span>'; VF=['Verdadero','Falso']
def cuenta(op,nums,ocultar=None,mal=None):
    ocultar=ocultar or {}
    res=sum(nums) if op=='+' else nums[0]-sum(nums[1:])
    assert res>0
    filas=nums+[res];most=[]
    for k,v in enumerate(filas):
        d=str(mal if (k==len(nums) and mal is not None) else v)
        o=ocultar.get(k,[])
        if o=='todo': d='?'*len(d)
        else: d=''.join('?' if j in o else c for j,c in enumerate(d))
        most.append(d)
    a=' data-mal="1"' if mal is not None else ''
    return res,'  <div class="cuenta" data-op="%s" data-numeros="%s" data-resultado="%s" data-mostrado="%s"%s></div>'%(op,'|'.join(fmt(n) for n in nums),fmt(res),'|'.join(most),a)
def tabla(cab,val,titulo=None):
    t='  <table class="datos">'
    if titulo: t='  <table class="datos vertical"><tr><th>%s</th><th>%s</th></tr>%s</table>'%(titulo[0],titulo[1],''.join('<tr><th>%s</th><td>%s</td></tr>'%(c,fmt(v)) for c,v in zip(cab,val)))
    else: t+='<tr>%s</tr><tr>%s</tr></table>'%(''.join('<th>%s</th>'%c for c in cab),''.join('<td>%s</td>'%fmt(v) for v in val))
    return t
def preg(n,tipo,titulo,cuerpo):
    return '<div class="pregunta" data-tipo="%s">\n  <h2><span class="num">%d</span>%s</h2>\n%s\n</div>\n'%(tipo,n,titulo,'\n'.join(cuerpo))
def pagina(num,P):
    cuerpo='\n'.join(preg(k+1,*p) for k,p in enumerate(P))
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Examen {num} · Matemáticas · Exámenes de Noa</title>
<link rel="manifest" href="../../../manifest.json">
<meta name="theme-color" content="#f7a823">
<link rel="stylesheet" href="../../../comun/examen.css?v={V}">
</head>
<body>
<header>
  <nav class="migas"><a href="../../../">Inicio</a> › <a href="../../">Matemáticas</a> › <a href="../">Temas 4 y 5</a> › <span>Examen {num}</span></nav>
  <h1>Examen {num}</h1>
  <p>Temas 4 y 5 · Sumar, restar y problemas</p>
  <p class="formato">Escribe los números con punto de millar, por ejemplo: 1.234. En las cuentas, una cifra en cada casilla.</p>
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

# ---------------- Examen 1 ----------------
r2a,c2a=cuenta('+',[2638,795],{2:'todo'})
r2b,c2b=cuenta('+',[1457,2386],{2:'todo'})
r5a,c5a=cuenta('-',[1673,416],{2:'todo'})
r5b,c5b=cuenta('-',[4564,716],{2:'todo'})
assert 635-248!=397
E1=[
('sumar','Vera ha representado con bloques las hormigas de dos hormigueros.',[
  fila('Hormiguero 1:'),'  <div class="bloques" data-c="2" data-d="4" data-u="6"></div>',
  fila('Hormiguero 2:'),'  <div class="bloques" data-c="3" data-d="1" data-u="8"></div>',
  fila('En el hormiguero 1 hay '+i(246)+' hormigas y en el 2 hay '+i(318)+'.'),
  fila('Al juntar los cubitos sueltos (6 + 8) se forma una decena nueva: '+g('sí',SN)),
  fila('En total hay '+i(246+318)+' hormigas.')]),
('sumar','Calcula estas sumas. Escribe una cifra en cada casilla.',[c2a,c2b]),
('terminos','Los términos de la suma y de la resta.',[
  fila('En 1.265 + 909 = 2.174, los números 1.265 y 909 son los '+g('sumandos',['sumandos','minuendos','sustraendos'])),
  fila('y 2.174 es la '+g('suma',['suma','diferencia','resta'])),
  fila('En 843 − 365 = 478, el 843 es el '+g('minuendo',['minuendo','sustraendo','sumando'])),
  fila('el 365 es el '+g('sustraendo',['minuendo','sustraendo','sumando'])),
  fila('y el 478 es la '+g('diferencia',['suma','diferencia']))]),
('propiedades','Las propiedades de la suma.',[
  fila('Sin calcular, ¿qué suma da lo mismo que 28 + 19? '+g('19 + 28',['19 + 28','82 + 91','28 + 91'])),
  fila('Cambiar el orden de dos sumandos es la propiedad '+g('conmutativa',['conmutativa','asociativa'])),
  fila('Calcula 14 + 8 + 22 sumando primero 8 + 22 = '+i(30)),
  fila('Después le sumas el 14. El resultado es '+i(44)),
  fila('Agrupar de otra forma tres sumandos es la propiedad '+g('asociativa',['conmutativa','asociativa']))]),
('restar','Calcula estas restas. Escribe una cifra en cada casilla.',[c5a,c5b]),
('prueba-resta','Sergio ha hecho esta resta: 635 − 248 = 397. Haz la prueba.',[
  fila('La prueba de la resta es: sustraendo + diferencia = '+g('minuendo',['minuendo','sumando','sustraendo'])),
  fila('248 + 397 = '+i(248+397)),
  fila('¿Está bien hecha la resta de Sergio? '+g('no',SN)),
  fila('El resultado correcto de 635 − 248 es '+i(635-248))]),
('termino-falta','Averigua el número que falta.',[
  fila('254 + '+i(391-254)+' = 391'),
  fila(i(902-467)+' + 467 = 902'),
  fila('860 − '+i(860-395)+' = 395'),
  fila(i(1256+489)+' − 1.256 = 489')]),
('tablas','Esta tabla muestra los animales que viven en una pradera de la reserva.',[
  tabla(['Ciervos','Jabalíes','Linces','Águilas'],[73,128,49,36]),
  fila('¿Cuántos jabalíes hay? '+i(128),'data-calc="Jabalíes"'),
  fila('¿Cuántos ciervos y linces hay entre los dos? '+i(73+49),'data-calc="Ciervos+Linces"'),
  fila('¿Cuántos jabalíes más que ciervos hay? '+i(128-73),'data-calc="Jabalíes-Ciervos"'),
  fila('Hay menos linces que ciervos: '+g('Verdadero',VF))]),
('problemas','Para llegar a la zona de los linces hay que recorrer 345 m. Ya hemos recorrido 176 m. Mira el modelo de barras.',[
  '  <div class="modelo-barras" data-total="345" data-partes="176|?" data-etiquetas="Recorrido|Falta"></div>',
  fila('¿Qué operación resuelve el problema? '+g('345 − 176',['345 + 176','345 − 176'])),
  fila('Nos faltan '+i(345-176)+' metros.')]),
('dinero','Andrea tiene este dinero en su hucha.',[
  '  <div class="dinero" data-valores="20,10,5,2,1,1"></div>',
  fila('¿Cuánto dinero tiene? '+i(39)+' €','data-dinero="1"'),
  fila('Se compra un peluche de 18 €. ¿Cuánto le queda? '+i(39-18)+' €'),
  fila('Para pagar 28 € justos con los menos billetes y monedas posibles, Andrea usaría: '+g('20 € + 5 € + 2 € + 1 €',['20 € + 5 € + 2 € + 1 €','10 € + 10 € + 5 € + 2 € + 1 €','20 € + 5 € + 1 € + 1 € + 1 €']))]),
]

# ---------------- Examen 2 ----------------
r1,c1=cuenta('+',[5058,3763],{2:'todo'})
r4,c4=cuenta('-',[3119,747],mal=2362)
r7a,c7a=cuenta('+',[3225,4533],{0:[2],1:[1,3]})
r7b,c7b=cuenta('-',[6479,2654],{0:[2,3],1:[0,1]})
assert r7b==3825 and r7a==7758
E2=[
('sumar','Las hormigas de fuego viven en hormigueros enormes: en uno hay 5.058 y en otro 3.763. ¿Cuántas hay en total?',[c1,
  fila('¿Qué has sumado primero? '+g('las unidades',['las unidades','las unidades de millar'])),
  fila('¿Y en último lugar? '+g('las unidades de millar',['las unidades','las unidades de millar']))]),
('sumar','Suma tres números.',[
  fila('365 + 425 + 1.129 = '+i(365+425+1129)),
  fila('876 + 256 + 1.303 = '+i(876+256+1303))]),
('estimar','Redondea los sumandos a las centenas y estima el resultado.',[
  fila('2.629 + 634 → '+i(2600)+nw(' + '+i(600))+nw(' = '+i(3200))),
  fila('1.512 + 389 → '+i(1500)+nw(' + '+i(400))+nw(' = '+i(1900)))]),
('restar','Un cuidador ha contado los grillos con esta resta, pero se ha equivocado.',[c4,
  fila('¿Está bien el resultado? '+g('no',SN)),
  fila('El resultado correcto de 3.119 − 747 es '+i(r4))]),
('termino-falta','Calcula los términos que faltan en estas restas.',[
  fila('734 − '+i(734-109)+' = 109'),
  fila(i(1477+356)+' − 1.477 = 356'),
  fila('Para hallar el minuendo se suman el sustraendo y la '+g('diferencia',['diferencia','suma']))]),
('propiedades','¿Qué operaciones dan el mismo resultado?',[
  fila('87 + 17 + 25 da lo mismo que '+g('17 + 25 + 87',['17 + 25 + 87','57 + 22 + 13','88 + 42'])),
  fila('42 + 88 da lo mismo que '+g('88 + 42',['88 + 42','42 + 86'])),
  fila('En 42 + 88 = 88 + 42 se usa la propiedad '+g('conmutativa',['conmutativa','asociativa'])),
  fila('¿Da lo mismo 9 − 4 que 4 − 9? '+g('no',SN))]),
('termino-falta','Averigua las cifras que faltan. Escribe una cifra en cada casilla.',[c7a,c7b]),
('tablas','Precios de algunos regalos de la tienda de la reserva.',[
  tabla(['Estuche','Peluche','Taza','Llavero','Cuaderno'],[16,19,12,6,9],titulo=('Regalo','Precio (€)')),
  fila('Adolfo ha comprado un peluche y otro regalo, y ha gastado 25 €. ¿Qué otro regalo compró? '+g('Llavero',['Estuche','Taza','Llavero','Cuaderno']),'data-busca="25-Peluche"'),
  fila('Andrea ha comprado dos regalos iguales y ha gastado 24 €. ¿Qué regalo compró dos veces? '+g('Taza',['Estuche','Taza','Llavero','Cuaderno']),'data-busca="12"'),
  fila('¿Cuánto cuestan el estuche y el cuaderno juntos? '+i(25)+' €','data-calc="Estuche+Cuaderno"')]),
('problemas','El viernes visitaron la reserva 156 personas. El sábado fueron 38 personas más que el viernes y el domingo, 27 personas menos que el sábado.',[
  fila('¿Cuántas personas fueron el sábado? '+i(156+38)),
  fila('¿Cuántas personas fueron el domingo? '+i(156+38-27)),
  fila('¿Cuántas personas fueron entre los tres días? '+i(156+(156+38)+(156+38-27)))]),
('dinero','Juana tiene que pagar 28 € y paga con un billete de 50 €.',[
  fila('¿Cuánto le tienen que devolver? '+i(50-28)+' €'),
  fila('El dependiente le devuelve esto:'),'  <div class="dinero" data-valores="20,2"></div>',
  fila('¿Cuánto dinero es? '+i(22)+' €','data-dinero="1"'),
  fila('¿Le ha devuelto bien? '+g('sí',SN)),
  fila('Para pagar 37 € justos con los menos billetes y monedas posibles usarías: '+g('20 € + 10 € + 5 € + 2 €',['20 € + 10 € + 5 € + 2 €','20 € + 10 € + 5 € + 1 € + 1 €','10 € + 10 € + 10 € + 5 € + 2 €']))]),
]

# ---------------- Examen 3 ----------------
r1,c1=cuenta('+',[1348,876],{2:'todo'})
r3a,c3a=cuenta('-',[865,659],{2:'todo'})
r3b,c3b=cuenta('-',[2214,1076],{2:'todo'})
E3=[
('sumar','Calcula la suma. Escribe una cifra en cada casilla.',[c1,
  fila('Al sumar las unidades (8 + 6) obtienes '+i(14)+', así que escribes un 4 y te llevas '+i(1))]),
('tablas','Observa los cromos que tiene cada niño y contesta.',[
  tabla(['Adrián','Víctor','Daniela','Claudia'],[457,615,569,518]),
  fila('¿Cuántos cromos tienen Daniela y Adrián juntos? '+i(569+457),'data-calc="Daniela+Adrián"'),
  fila('¿Cuántos cromos tiene Adrián menos que Claudia? '+i(518-457),'data-calc="Claudia-Adrián"'),
  fila('¿Cuántos cromos tienen entre los cuatro? '+i(457+615+569+518),'data-calc="Adrián+Víctor+Daniela+Claudia"')]),
('restar','Calcula estas restas. Escribe una cifra en cada casilla.',[c3a,c3b]),
('prueba-resta','Comprueba estas restas con la prueba de la resta.',[
  fila('4.321 − 3.908 = 413. Prueba: 3.908 + 413 = '+i(3908+413)),
  fila('¿Está bien? '+g('sí',SN)),
  fila('207 − 78 = 139. Prueba: 78 + 139 = '+i(78+139)),
  fila('¿Está bien? '+g('no',SN)),
  fila('El resultado correcto de 207 − 78 es '+i(207-78))]),
('termino-falta','Mira los modelos de barras y averigua lo que falta.',[
  fila('En un refugio hay 98 abejas: 79 están fuera. ¿Cuántas están dentro?'),
  '  <div class="modelo-barras" data-total="98" data-partes="79|?" data-etiquetas="Fuera|Dentro"></div>',
  fila('Dentro hay '+i(98-79)+' abejas.'),
  fila('De otra colmena se fueron 82 abejas y ahora quedan 179. ¿Cuántas había antes?'),
  '  <div class="modelo-barras" data-total="?" data-partes="179|82" data-etiquetas="Quedan|Se fueron"></div>',
  fila('Antes había '+i(179+82)+' abejas.')]),
('estimar','Redondea a las decenas y resta.',[
  fila('526 − 342 → '+i(530)+nw(' − '+i(340))+nw(' = '+i(190))),
  fila('318 − 64 → '+i(320)+nw(' − '+i(60))+nw(' = '+i(260)))]),
('propiedades','Calcula 16 + 9 + 21 de dos formas distintas.',[
  fila('Primero 16 + 9 = '+i(25)+nw(' y después le sumas 21: '+i(46))),
  fila('Primero 9 + 21 = '+i(30)+nw(' y después le sumas 16: '+i(46))),
  fila('¿Has obtenido el mismo resultado? '+g('sí',SN)),
  fila('Es la propiedad '+g('asociativa',['conmutativa','asociativa']))]),
('problemas','Resuelve estos problemas.',[
  fila('Nerea tiene 951 canicas. De ellas, 562 son lisas y el resto son de rayas. ¿Cuántas son de rayas? '+i(951-562)),
  fila('¿De qué tipo tiene más canicas? '+g('lisas',['lisas','de rayas'])),
  fila('En una carrera de bicis había 479 niños apuntados y el último día se apuntaron 43 más. ¿Cuántos empezaron la carrera? '+i(479+43)),
  fila('Ya han llegado a la meta 316. ¿Cuántos faltan por llegar? '+i(479+43-316))]),
('problemas','Carla corre en la carrera solidaria del colegio. Mira el dibujo.',[
  '  <div class="recorrido" data-hecho="2.620" data-total="5.703" data-unidad="m"></div>',
  fila('¿Qué operación tienes que hacer? '+g('5.703 − 2.620',['5.703 + 2.620','5.703 − 2.620'])),
  fila('Le faltan '+i(5703-2620)+' metros para llegar a la meta.')]),
('tablas','Unos alumnos han contado los jabalíes que ha visto cada uno. ¿Qué preguntas se pueden resolver con la tabla?',[
  tabla(['Javier','Ana','Lucía','Martín'],[25,18,16,22]),
  fila('¿Cuántos jabalíes han visto Javier y Lucía en total? ¿Se puede resolver? '+g('sí',SN)+nw(' Respuesta: '+i(41)),'data-calc="Javier+Lucía"'),
  fila('¿Cuántos jabalíes ha visto Martín más que Ana? ¿Se puede resolver? '+g('sí',SN)+nw(' Respuesta: '+i(4)),'data-calc="Martín-Ana"'),
  fila('¿Cuántos jabalíes ha visto Cristina? ¿Se puede resolver? '+g('no',SN))]),
]
for n,E in [(1,E1),(2,E2),(3,E3)]:
    assert len(E)==10
    d=os.path.join(RAIZ,'examen%d'%n);os.makedirs(d,exist_ok=True)
    open(os.path.join(d,'index.html'),'w').write(pagina(n,E))
print('ok')
