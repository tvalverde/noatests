import os, html, json
AQUI=os.path.dirname(os.path.abspath(__file__))
V=json.load(open(os.path.join(AQUI,'version.json')))['version']  # versión de los archivos comunes (?v=N); la cambia herramientas/subir-version.js
RAIZ=os.path.join(AQUI,'..','ingles/unit2-eat-well')
# Comida que se cuenta (countable) y que no (uncountable), como en las tablas de las páginas 23 y 27 del libro
CONTABLE={'pancakes':True,'strawberries':True,'mushrooms':True,'sandwiches':True,'biscuits':True,'vegetables':True,'crisps':True,
          'pasta':False,'rice':False,'chocolate':False,'salad':False,'cheese':False,'bread':False,'fruit':False,'chicken':False,
          'ice cream':False,'tuna':False,'tomato sauce':False}
FRASES=["There's some","There are some","There isn't any","There aren't any"]
RESPUESTAS=['Yes, there is.',"No, there isn't.",'Yes, there are.',"No, there aren't."]
YN=['Yes','No'];TF=['True','False'];ORDEN=['First','Next','Finally']

def g(r,ops):
    assert r in ops,(r,ops);assert len(set(o.lower() for o in ops))==len(ops),ops
    return '<span class="grupo" data-r="%s">%s</span>'%(html.escape(r),''.join('<span class="opcion">%s</span>'%html.escape(o) for o in ops))
def i(r):return '<input type="text" data-r="%s">'%html.escape(r)
def fila(t,attrs=''):return '  <div class="fila"%s>%s</div>'%((' '+attrs) if attrs else '',t)
def L(x):return '<b>%s</b>'%x
H='<span class="raya">_____</span>'  # hueco que se ve en la frase; las opciones van después
def preg(n,tipo,titulo,cuerpo):
    return '<div class="pregunta" data-tipo="%s">\n  <h2><span class="num">%d</span>%s</h2>\n%s\n</div>\n'%(tipo,n,html.escape(titulo),'\n'.join(cuerpo))

# ---- piezas cuya respuesta sale de los datos ----
def comidas(letras):return '  <div class="comidas" data-letras="%s"></div>'%';'.join('%s=%s'%x for x in letras)
def bandeja(hay,titulo,estilo):return '  <div class="bandeja" data-hay="%s" data-titulo="%s" data-estilo="%s"></div>'%(','.join(hay),html.escape(titulo),estilo)
def elige_letra(letras,opciones):return [fila(L(l)+' is '+g(v,opciones)) for l,v in letras]
def escribe_letra(letras):return [fila(L(l)+' '+i(v)) for l,v in letras]
def frase_some_any(comida,hay):
    c=CONTABLE[comida];si=comida in hay
    r=("There are some" if c else "There's some") if si else ("There aren't any" if c else "There isn't any")
    return fila(H+' '+html.escape(comida)+'. '+g(r,FRASES),'data-comida="%s"'%comida)
def pregunta_hay(comida,hay):
    c=CONTABLE[comida];si=comida in hay
    r=('Yes, there are.' if si else "No, there aren't.") if c else ('Yes, there is.' if si else "No, there isn't.")
    return fila(('Are' if c else 'Is')+' there any '+html.escape(comida)+'? '+g(r,RESPUESTAS),'data-pregunta="%s"'%comida)
def is_are(comida):return fila(H+' there any '+html.escape(comida)+'? '+g('Are' if CONTABLE[comida] else 'Is',['Is','Are']),'data-isare="%s"'%comida)
def contar(comida):return fila('<span class="comida" data-comida="%s"></span> Can you count it? '%comida+g('Yes' if CONTABLE[comida] else 'No',YN),'data-contar="%s"'%comida)
def some_o_any(antes,comida):
    r='any' if "n't" in antes else 'some'
    return fila(html.escape(antes)+' '+H+' '+html.escape(comida)+'. '+g(r,['some','any']),'data-someany="%s"'%comida)
def hueco_letra(palabra,pos):
    assert palabra[pos] in 'cs'
    return fila('<b class="palabra">'+html.escape(palabra[:pos])+'_'+html.escape(palabra[pos+1:])+'</b> '+g(palabra[pos],['c','s']),'data-palabra="%s" data-pos="%d"'%(palabra,pos))
def pasos(frases):  # frases sin la palabra de orden; la respuesta es First, Next, Finally por posición
    assert len(frases)==3
    return [fila('%d. '%(k+1)+H+', '+html.escape(f)+' '+g(ORDEN[k],ORDEN),'data-paso="%d"'%(k+1)) for k,f in enumerate(frases)]
def numera(frases):  # frases que empiezan por First/Next/Finally, desordenadas; la respuesta es su posición
    return [fila(html.escape(f)+' '+g(str(ORDEN.index(f.split(',')[0])+1),['1','2','3']),'data-orden="1"') for f in frases]
def texto(t):return '  <div class="fila texto-ingles" style="background:#fff8e7;border-radius:12px;padding:10px 12px;line-height:1.6">%s</div>'%html.escape(t)

def pagina(num,P):
    cuerpo='\n'.join(preg(k+1,*p) for k,p in enumerate(P))
    return f'''<!DOCTYPE html>
<html lang="es" data-voz="en-GB" style="--materia:#c0392b;--materia-borde:#c0392b">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ejercicio {num} · Inglés · Ejercicios de Noa</title>
<link rel="manifest" href="../../../manifest.json">
<meta name="theme-color" content="#c0392b">
<link rel="stylesheet" href="../../../comun/examen.css?v={V}">
</head>
<body>
<header>
  <nav class="migas"><a href="../../../">Inicio</a> › <a href="../../">Inglés</a> › <a href="../">Unit 2</a> › <span>Ejercicio {num}</span></nav>
  <h1>Ejercicio {num}</h1>
  <p>Unit 2 · Eat well</p>
  <p class="formato">Toca la respuesta correcta o escríbela en inglés</p>
</header>
<main>

{cuerpo}
<button class="principal" id="corregir">¡He terminado!</button>

</main>
<script src="../../../sync.js?v={V}"></script>
<script src="../../dibujos.js?v={V}"></script>
<script src="../../../comun/examen.js?v={V}"></script>
<script src="../../../sw-registro.js"></script>
</body>
</html>
'''

# ---------------- Ejercicio 1 ----------------
LEO=[('tuna sandwiches'),('strawberries'),('chocolate ice cream')]
H1=['pasta','strawberries','salad']
B1=['fruit','biscuits','chicken']
E1=[
('vocabulario','Look and choose.',[comidas([('A','pancakes'),('B','strawberries'),('C','mushrooms'),('D','cheese')]),
  *elige_letra([('A','pancakes'),('B','strawberries'),('C','mushrooms'),('D','cheese')],['pancakes','strawberries','mushrooms','cheese','pasta'])]),
('vocabulario','Look and write.',[comidas([('A','pasta'),('B','rice'),('C','bread')]),*escribe_letra([('A','pasta'),('B','rice'),('C','bread')])]),
('some-any',"Look at Sam's lunch and choose.",[bandeja(H1,"Sam's lunch",'bandeja'),
  frase_some_any('pasta',H1),frase_some_any('strawberries',H1),frase_some_any('chocolate',H1),frase_some_any('mushrooms',H1)]),
('some-any','Can you count this food?',[contar('rice'),contar('pancakes'),contar('chocolate'),contar('sandwiches')]),
('is-there-any',"What's in the shopping bag? Look and answer.",[bandeja(B1,'The shopping bag','bolsa'),
  pregunta_hay('ice cream',B1),pregunta_hay('biscuits',B1),pregunta_hay('fruit',B1),pregunta_hay('crisps',B1)]),
('is-there-any','Is or Are?',[is_are('vegetables'),is_are('chicken'),is_are('strawberries'),is_are('chocolate')]),
('pedir-comida','At the café. Choose the right words.',[
  fila('A: What would you like?'),fila('B: '+H+' chicken and rice, please? '+g('Could I have',['Could I have','Here you are','What would you like'])),
  fila('A: Would you like some tomato sauce?'),fila('B: '+g('Yes, please.',['Yes, please.','Here you are.',"I'd like."])),
  fila('A: What would you like to drink?'),fila('B: '+H+' orange juice, please. '+g("I'd like",["I'd like",'Here you are','Would you like'])),
  fila('A: '+g('Here you are.',['Here you are.','What would you like?','Yes, please.'])),fila('B: Thank you very much.')]),
('lectura',"Read Leo's blog and answer.",[
  texto("Hi! I'm Leo. On Saturday, I have a picnic in the park with my grandma. First, we have %s. Next, we have some %s. Finally, we have %s. I drink orange juice."%tuple(LEO)),
  fila('Who does Leo have a picnic with? '+g('his grandma',['his grandma','his dad','his friends'])),
  fila('What do they have first? '+g(LEO[0],LEO)),
  fila('What do they have at the end? '+g(LEO[2],LEO)),
  fila('What does Leo drink? '+g('orange juice',['orange juice','mango juice','a fizzy drink']))]),
('orden','My favourite lunch. Choose First, Next or Finally.',pasos(['we have some pasta.','we have chicken with salad.','we have strawberries.'])),
('deletreo','Say and spell. c or s?',[hueco_letra('juice',3),hueco_letra('sandwich',0),hueco_letra('nice',2),hueco_letra('salad',0)]),
]

# ---------------- Ejercicio 2 ----------------
H2=['rice','mushrooms','cheese']
T2=['bread','biscuits','pasta','rice','vegetables']
E2=[
('vocabulario','Look and choose.',[comidas([('A','chocolate'),('B','sandwiches'),('C','salad'),('D','bread')]),
  *elige_letra([('A','chocolate'),('B','sandwiches'),('C','salad'),('D','bread')],['chocolate','sandwiches','salad','bread','rice'])]),
('vocabulario','Food and colours. Choose.',[
  fila('Which food is red? '+g('strawberries',['strawberries','rice','bread'])),
  fila('Which food is white? '+g('rice',['chocolate','rice','salad'])),
  fila('Which food is brown? '+g('chocolate',['cheese','chocolate','strawberries'])),
  fila('Which food is green? '+g('salad',['rice','pancakes','salad'])),
  fila('Which food is yellow? '+g('cheese',['cheese','chocolate','strawberries']))]),
('some-any',"Look at Ana's lunch and choose.",[bandeja(H2,"Ana's lunch",'bandeja'),
  frase_some_any('rice',H2),frase_some_any('mushrooms',H2),frase_some_any('strawberries',H2),frase_some_any('bread',H2)]),
('some-any','some or any?',[some_o_any('There are','pancakes'),some_o_any("There isn't",'chocolate'),some_o_any("There aren't",'biscuits'),some_o_any("There's",'tuna')]),
('is-there-any','Look in the shop. Answer.',[bandeja(T2,'The shop','tienda'),
  pregunta_hay('ice cream',T2),pregunta_hay('vegetables',T2),pregunta_hay('rice',T2),pregunta_hay('strawberries',T2)]),
('is-there-any','Is or Are?',[is_are('biscuits'),is_are('fruit'),is_are('crisps'),is_are('ice cream')]),
('lectura','The wrong sandwich. True or false?',[
  fila("Mia makes a sandwich for a competition. "+g('True',TF)),
  fila("Mia's sunshine sandwich has got cheese, salad and banana in it. "+g('True',TF)),
  fila("Mia puts her sandwich in a blue lunch box. "+g('False',TF)),
  fila("There are tuna sandwiches in the lunch box at the competition. "+g('True',TF)),
  fila("Mia wins the prize. "+g('False',TF))]),
('pedir-comida','At the café. Choose the answer.',[
  fila('What would you like? '+g('Could I have some pasta, please?',['Could I have some pasta, please?','Yes, please.','Here you are.'])),
  fila('Would you like some cheese? '+g('Yes, please.',['Yes, please.',"I'd like orange juice.",'Here you are.'])),
  fila('What would you like to drink? '+g("I'd like orange juice, please.",["I'd like orange juice, please.",'Could I have some pancakes, please?','Here you are.'])),
  fila('Could I have some salad, please? '+g('Sure, here you are.',['Sure, here you are.',"I'd like salad.",'Yes, there is.']))]),
('orden','How I make my sandwich. Choose First, Next or Finally.',pasos(['I get some bread.','I put on some cheese and tomato sauce.','I put on some salad.'])),
('lectura',"Read Tom's blog and answer.",[
  texto("Hi, I'm Tom. On Sunday, I have lunch with my aunt and my cousins. First, there's a big salad with cheese. Next, we have chicken with rice. Finally, we have fruit. I don't like fruit, so I eat some chocolate."),
  fila('Who does Tom have lunch with? '+g('his aunt and his cousins',['his aunt and his cousins','his mum and dad','his grandparents'])),
  fila('What do they have first? '+g('a big salad',['a big salad','chicken with rice','fruit'])),
  fila('What do they have with the chicken? '+g('rice',['rice','pasta','bread'])),
  fila('What does Tom eat at the end? '+g('chocolate',['chocolate','fruit','ice cream']))]),
]

# ---------------- Ejercicio 3 ----------------
C3=['sandwiches','fruit','chicken']
N3=['cheese','vegetables','ice cream']
E3=[
('vocabulario','Look and write.',[comidas([('A','chicken'),('B','rice'),('C','cheese')]),*escribe_letra([('A','chicken'),('B','rice'),('C','cheese')])]),
('vocabulario','Look and choose.',[comidas([('A','fruit'),('B','vegetables'),('C','biscuits'),('D','pancakes')]),
  *elige_letra([('A','fruit'),('B','vegetables'),('C','biscuits'),('D','pancakes')],['fruit','vegetables','biscuits','pancakes','crisps'])]),
('some-any','Look at the picnic basket and choose.',[bandeja(C3,'The picnic basket','cesta'),
  frase_some_any('sandwiches',C3),frase_some_any('chicken',C3),frase_some_any('ice cream',C3),frase_some_any('biscuits',C3)]),
('some-any','Can you count this food?',[contar('strawberries'),contar('pasta'),contar('biscuits'),contar('ice cream')]),
('is-there-any',"What's in the fridge? Look and answer.",[bandeja(N3,'The fridge','nevera'),
  pregunta_hay('cheese',N3),pregunta_hay('mushrooms',N3),pregunta_hay('ice cream',N3),pregunta_hay('pancakes',N3)]),
('is-there-any','Is or Are?',[is_are('mushrooms'),is_are('tuna'),is_are('sandwiches'),is_are('cheese')]),
('pedir-comida','At the café. Choose the right words.',[
  fila('A: Hello, '+g('what would you like?',['what would you like?','here you are.','thank you very much.'])),
  fila('B: '+H+' some pasta with tomato sauce, please? '+g('Could I have',['Could I have','Here you are','Would you like'])),
  fila('A: Sure, '+g('here you are.',['here you are.','yes, please.',"I'd like."])),
  fila('A: Would you like some juice?'),fila('B: '+g('Yes, please.',['Yes, please.','Here you are.','What would you like?']))]),
('lectura',"Sally's Super Sandwiches. Who is it? Choose.",[
  fila('Who puts onion in their sandwich? '+g('Jack',['Jack','Arusha','Maria'])),
  fila('Who eats a sandwich called the Super‑dooper? '+g('Maria',['Jack','Arusha','Maria'])),
  fila('Who loves potato cheese sandwiches? '+g('Arusha',['Jack','Arusha','Maria'])),
  fila('Where is Arusha from? '+g('India',['New Zealand','India','the USA']))]),
('orden','Put the sentences in order: 1, 2 or 3?',numera(['Next, we have chicken with vegetables.','Finally, we have chocolate ice cream.',"First, there's a big salad."])),
('deletreo','Say and spell. c or s?',[hueco_letra('salad',0),hueco_letra('nice',2),hueco_letra('sandwich',0),hueco_letra('juice',3)]),
]

for n,E in [(1,E1),(2,E2),(3,E3)]:
    assert len(E)==10,(n,len(E))
    d=os.path.join(RAIZ,'examen%d'%n);os.makedirs(d,exist_ok=True)
    open(os.path.join(d,'index.html'),'w').write(pagina(n,E))
print('ok')
