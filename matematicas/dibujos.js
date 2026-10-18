/* Dibujos SVG para los exámenes de matemáticas. Se declaran en el HTML y se pintan al cargar:
   <div class="bloques" data-um="2" data-c="4" data-d="1" data-u="8"></div>      → bloques multibase
   <div class="tapones" data-torres="2" data-cajas="3" data-bolsas="4" data-sueltos="5"></div>   → tapones en torres, cajas, bolsitas y sueltos
   <div class="recta" data-min="0" data-max="350" data-paso="50" data-letras="A=150;B=300" data-puntos="120"></div>
   <div class="tarjetas" data-valores="1.000,400,70,5"></div>                     → tarjetas de composición
   <div class="plano" data-cols="3" data-rows="3" data-salas="0,0,Planetario,gris;..." data-calles-h="Calle Nieve|..." data-calles-v="..." data-persona="2,1,arriba" data-marca="0,2"></div>
   <div class="figuras" data-figura="gota" data-opciones="traslada;gira;agranda" data-etiquetas="a;b;c"></div> → figura original + opciones
   <div class="tabla-posiciones" data-cifras="2,1,7,4"></div>                    → tabla UM C D U
   <div class="venn" data-a="Plano 1" data-b="Plano 2" data-solo-a="…" data-comun="…" data-solo-b="…"></div>
   <div class="barras" data-valores="Juanita=788;Berta=783" data-unidad="m"></div> → comparar alturas (montañas); data-tipo="distancia" → distancias al bosque; data-tipo="cantidad" → barras horizontales simples
*/
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const COLORES={amarillo:'#f7d21c',verde:'#8bc34a',rojo:'#e4452c',azul:'#2b6cd9',gris:'#bdbdbd',rosa:'#f48fb1',naranja:'#f58a1f',celeste:'#7fd3ee',morado:'#b39ddb',verdeoscuro:'#4caf50',lila:'#e9dcf5'};
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function svg(w,h){const s=el('svg',{viewBox:`0 0 ${w} ${h}`,width:'100%',style:`max-width:${w}px;display:block;margin:8px auto`});s.setAttribute('xmlns',NS);return s;}
const num=v=>Number(String(v).replace(/\./g,'').replace(',','.'));
const fmt=v=>String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
function texto(s,x,y,t,attrs){const e=el('text',Object.assign({x,y,'font-family':'Arial, sans-serif','font-size':14,fill:'#333','text-anchor':'middle'},attrs||{}),s);e.textContent=t;return e;}

// ---------- Bloques multibase ----------
function cubo(s,x,y,t){ // cubo grande (1.000)
  const d=t*0.35;
  el('polygon',{points:`${x},${y+d} ${x+t},${y+d} ${x+t},${y+d+t} ${x},${y+d+t}`,fill:'#f7d21c',stroke:'#b8960a','stroke-width':1.5},s);
  el('polygon',{points:`${x},${y+d} ${x+d},${y} ${x+t+d},${y} ${x+t},${y+d}`,fill:'#fbe67a',stroke:'#b8960a','stroke-width':1.5},s);
  el('polygon',{points:`${x+t},${y+d} ${x+t+d},${y} ${x+t+d},${y+t} ${x+t},${y+d+t}`,fill:'#d9b514',stroke:'#b8960a','stroke-width':1.5},s);
  for(let i=1;i<10;i++){const k=t*i/10;el('line',{x1:x+k,y1:y+d,x2:x+k,y2:y+d+t,stroke:'#b8960a','stroke-width':.5},s);el('line',{x1:x,y1:y+d+k,x2:x+t,y2:y+d+k,stroke:'#b8960a','stroke-width':.5},s);}
}
function placa(s,x,y,t){ // placa (100)
  el('rect',{x,y,width:t,height:t,fill:'#8bc34a',stroke:'#4b7a1e','stroke-width':1.5},s);
  for(let i=1;i<10;i++){const k=t*i/10;el('line',{x1:x+k,y1:y,x2:x+k,y2:y+t,stroke:'#4b7a1e','stroke-width':.5},s);el('line',{x1:x,y1:y+k,x2:x+t,y2:y+k,stroke:'#4b7a1e','stroke-width':.5},s);}
}
function barra(s,x,y,t){ // barra (10)
  const w=t/6;el('rect',{x,y,width:w,height:t,fill:'#e4452c',stroke:'#8f2415','stroke-width':1.5},s);
  for(let i=1;i<10;i++){const k=t*i/10;el('line',{x1:x,y1:y+k,x2:x+w,y2:y+k,stroke:'#8f2415','stroke-width':.6},s);}
  return w;
}
function unidad(s,x,y,t){const w=t/6;el('rect',{x,y,width:w,height:w,fill:'#2b6cd9',stroke:'#173d80','stroke-width':1.2},s);return w;}
function dibujarBloques(div){
  const um=+div.dataset.um||0,c=+div.dataset.c||0,d=+div.dataset.d||0,u=+div.dataset.u||0;
  const T=60,gap=16,sep=24;let x=10;const y=10,yBase=y+T*0.35,yLey=yBase+T+20;
  const s=svg(200,yLey+14);
  const eti=(x0,x1,t)=>texto(s,(x0+x1)/2,yLey,t,{'font-size':13,fill:'#555','font-weight':'bold'});
  for(let i=0;i<um;i++){cubo(s,x,y,T);eti(x,x+T,'1.000');x+=T*1.35+gap;}
  if(um)x+=sep;
  for(let i=0;i<c;i++){placa(s,x,yBase,T);eti(x,x+T,'100');x+=T+gap;}
  if(c)x+=sep;
  const wb=T/6;
  for(let i=0;i<d;i++){barra(s,x,yBase,T);eti(x,x+wb,'10');x+=wb+22;}
  if(d)x+=sep-10;
  const w=T/6;
  for(let i=0;i<u;i++){const col=Math.floor(i/5),fila=i%5;unidad(s,x+col*(w+6),yBase+fila*(w+2),T);}
  if(u){const cols=Math.ceil(u/5);eti(x,x+cols*(w+6)-6,'1');x+=cols*(w+6)-6;}
  const W=Math.max(x+10,200);s.setAttribute('viewBox',`0 0 ${W} ${yLey+14}`);s.style.maxWidth=W+'px';
  div.appendChild(s);
}

// ---------- Tapones (torres de 10 cajas, cajas de 100, bolsitas de 10, sueltos) ----------
function caja(s,x,y,w,h){el('rect',{x,y,width:w,height:h,rx:2,fill:'#d9a066',stroke:'#7a4a1a','stroke-width':1.2},s);el('line',{x1:x,y1:y+h/2,x2:x+w,y2:y+h/2,stroke:'#7a4a1a','stroke-width':.6,'stroke-dasharray':'3 2'},s);}
function tapon(s,x,y,r,color){el('circle',{cx:x,cy:y,r,fill:color,stroke:'#333','stroke-width':1},s);el('circle',{cx:x,cy:y,r:r*0.45,fill:'none',stroke:'#fff','stroke-width':1,opacity:.8},s);}
function dibujarTapones(div){
  const t=+div.dataset.torres||0,c=+div.dataset.cajas||0,b=+div.dataset.bolsas||0,u=+div.dataset.sueltos||0;
  const W=46,H=13,yBase=150,sep=28;let x=10;const s=svg(200,yBase+28);
  const colores=['#e4452c','#2b6cd9','#f7d21c','#4caf50','#f58a1f','#8a4fc9','#7fd3ee','#ff8ac4','#9e9e9e','#333'];
  const eti=(x0,x1,tx)=>texto(s,(x0+x1)/2,yBase+20,tx,{'font-size':13,fill:'#555','font-weight':'bold'});
  for(let i=0;i<t;i++){for(let k=0;k<10;k++)caja(s,x,yBase-(k+1)*H,W,H);eti(x,x+W,'torre');x+=W+14;}
  if(t)x+=sep;
  for(let i=0;i<c;i++){caja(s,x,yBase-H,W,H);eti(x,x+W,'caja');x+=W+14;}
  if(c)x+=sep;
  for(let i=0;i<b;i++){el('path',{d:`M${x+4},${yBase-30} q14,-14 28,0 l6,28 q-20,8 -40,0 z`,fill:'#e8f4fb',stroke:'#2b6cd9','stroke-width':1.2},s);
    for(let k=0;k<10;k++)tapon(s,x+10+(k%4)*7,yBase-22+Math.floor(k/4)*7,2.6,colores[k]);eti(x,x+40,'bolsita');x+=52;}
  if(b)x+=sep;
  const x0=x;for(let i=0;i<u;i++){tapon(s,x+10+(i%5)*20,yBase-10-Math.floor(i/5)*20,8,colores[i%colores.length]);}
  if(u){x+=Math.min(u,5)*20+4;eti(x0,x,'sueltos');}
  const Wt=Math.max(x+10,200);s.setAttribute('viewBox',`0 0 ${Wt} ${yBase+28}`);s.style.maxWidth=Wt+'px';
  div.appendChild(s);
}

// ---------- Recta numérica ----------
function dibujarRecta(div){
  const min=num(div.dataset.min),max=num(div.dataset.max),paso=num(div.dataset.paso);
  const letras={};(div.dataset.letras||'').split(';').filter(Boolean).forEach(p=>{const [l,v]=p.split('=');letras[num(v)]=l;});
  const puntos=(div.dataset.puntos||'').split(/[;,](?=\s*\d{1,3}(?:\.\d{3})*\s*(?:[;,]|$))/).filter(Boolean).map(num);
  const W=700,H=80,x0=40,x1=W-40;const s=svg(W,H);
  const px=v=>x0+(v-min)/(max-min)*(x1-x0);
  el('line',{x1:x0-20,y1:40,x2:x1+20,y2:40,stroke:'#2bb3d9','stroke-width':3},s);
  el('polygon',{points:`${x1+20},34 ${x1+32},40 ${x1+20},46`,fill:'#2bb3d9'},s);
  for(let v=min;v<=max+1e-9;v+=paso){
    const x=px(v);el('line',{x1:x,y1:32,x2:x,y2:48,stroke:'#2bb3d9','stroke-width':2},s);
    if(letras[v]!=null){el('circle',{cx:x,cy:40,r:7,fill:'#e4452c'},s);texto(s,x,22,letras[v],{'font-weight':'bold',fill:'#e4452c','font-size':16});}
    else texto(s,x,68,fmt(v),{'font-size':13});
  }
  puntos.forEach(v=>{const x=px(v);el('circle',{cx:x,cy:40,r:6,fill:'#f7a823',stroke:'#333'},s);});
  div.appendChild(s);
}

// ---------- Tarjetas de composición ----------
function dibujarTarjetas(div){
  const vals=div.dataset.valores.split(',');const W=Math.min(700,vals.length*120+20),H=80;const s=svg(W,H);
  vals.forEach((v,i)=>{const x=10+i*120;el('rect',{x,y:12,width:100,height:56,rx:8,fill:'#fff',stroke:'#333','stroke-width':2},s);
    el('rect',{x:x+6,y:18,width:88,height:44,rx:5,fill:['#fde9a8','#cdeab3','#f9c7bf','#c5d8f8'][i%4]},s);
    texto(s,x+50,48,v,{'font-size':22,'font-weight':'bold'});
    if(i<vals.length-1)texto(s,x+110,48,'+',{'font-size':22});});
  div.appendChild(s);
}

// ---------- Plano (salas y calles) ----------
function dibujarPlano(div){
  const cols=+div.dataset.cols,rows=+div.dataset.rows;const B=96,C=26,M=70;
  const W=M+cols*B+(cols+1)*C+M,H=40+rows*B+(rows+1)*C+30;const s=svg(W,H);
  el('rect',{x:0,y:0,width:W,height:H,fill:'#dff0c9',rx:12},s);
  const cx=c=>M+C+c*(B+C),cy=r=>40+C+r*(B+C);
  // calles
  const ch=(div.dataset.callesH||'').split('|'),cv=(div.dataset.callesV||'').split('|');
  for(let r=0;r<=rows;r++){const y=40+r*(B+C);el('rect',{x:M,y,width:W-2*M,height:C,fill:'#f1f1e6',stroke:'#999','stroke-dasharray':'6 4'},s);if(ch[r])texto(s,W/2,y+C/2+5,ch[r],{'font-size':12,fill:'#555'});}
  for(let c=0;c<=cols;c++){const x=M+c*(B+C);el('rect',{x,y:40,width:C,height:H-70,fill:'#f1f1e6',stroke:'#999','stroke-dasharray':'6 4'},s);
    if(cv[c]){const t=texto(s,x+C/2,H/2,cv[c],{'font-size':12,fill:'#555'});t.setAttribute('transform',`rotate(-90 ${x+C/2} ${H/2})`);}}
  // salas: "r,c,Nombre,color"
  (div.dataset.salas||'').split(';').filter(Boolean).forEach(p=>{const [r,c,nombre,color]=p.split(',');const x=cx(+c),y=cy(+r);
    el('rect',{x,y,width:B,height:B,rx:10,fill:COLORES[color]||'#efe7f7',stroke:'#333','stroke-width':1.5},s);
    const lineas=nombre.split(' ');lineas.forEach((l,i)=>texto(s,x+B/2,y+30-(lineas.length-1)*7+i*15,l,{'font-size':12,'font-weight':'bold'}));});
  // marca X
  if(div.dataset.marca){const [r,c]=div.dataset.marca.split(',').map(Number);const x=cx(c)+B-18,y=cy(r)+18;el('line',{x1:x-9,y1:y-9,x2:x+9,y2:y+9,stroke:'#e4452c','stroke-width':5,'stroke-linecap':'round'},s);el('line',{x1:x+9,y1:y-9,x2:x-9,y2:y+9,stroke:'#e4452c','stroke-width':5,'stroke-linecap':'round'},s);}
  // persona "r,c,dir"
  if(div.dataset.persona){const [r,c,dir]=div.dataset.persona.split(',');const esV=dir==='arriba'||dir==='abajo';const x=cx(+c)+(esV?B-22:B/2),y=cy(+r)+(dir==='arriba'?B-22:dir==='abajo'?B-36:B-22);
    el('circle',{cx:x,cy:y,r:13,fill:'#f7a823',stroke:'#333','stroke-width':2},s);
    const fl={arriba:[0,-1],abajo:[0,1],izquierda:[-1,0],derecha:[1,0]}[dir]||[0,-1];
    const L=esV?30:40;el('line',{x1:x+fl[0]*14,y1:y+fl[1]*14,x2:x+fl[0]*L,y2:y+fl[1]*L,stroke:'#e4452c','stroke-width':4,'stroke-linecap':'round'},s);
    el('polygon',{points:`${x+fl[0]*(L+8)},${y+fl[1]*(L+8)} ${x+fl[0]*(L-4)+fl[1]*7},${y+fl[1]*(L-4)+fl[0]*7} ${x+fl[0]*(L-4)-fl[1]*7},${y+fl[1]*(L-4)-fl[0]*7}`,fill:'#e4452c'},s);
    texto(s,x,y+5,'L',{'font-size':14,'font-weight':'bold'});}
  texto(s,W/2,24,div.dataset.titulo||'Plano',{'font-size':15,'font-weight':'bold',fill:'#2a6'});
  div.appendChild(s);
}

// ---------- Figuras: original + opciones (traslación / giro / tamaño / simetría) ----------
function figura(s,tipo,x,y,esc,giro){
  const g=el('g',{transform:`translate(${x} ${y}) rotate(${giro||0}) scale(${esc||1})`},s);
  if(tipo==='gota'){el('path',{d:'M0,-26 C10,-10 18,0 18,10 A18,18 0 1,1 -18,10 C-18,0 -10,-10 0,-26 Z',fill:'#7fd3ee',stroke:'#2b6cd9','stroke-width':2},g);}
  else if(tipo==='flecha'){el('polygon',{points:'-24,-8 8,-8 8,-18 26,0 8,18 8,8 -24,8',fill:'#f7a823',stroke:'#8a5a00','stroke-width':2},g);}
  else if(tipo==='casa'){el('polygon',{points:'-22,0 0,-24 22,0',fill:'#e4452c',stroke:'#333','stroke-width':2},g);el('rect',{x:-16,y:0,width:32,height:22,fill:'#fde9a8',stroke:'#333','stroke-width':2},g);el('rect',{x:-5,y:8,width:10,height:14,fill:'#8a5a00'},g);}
  else {el('rect',{x:-18,y:-12,width:36,height:24,fill:'#b39ddb',stroke:'#333','stroke-width':2},g);el('circle',{cx:10,cy:-4,r:4,fill:'#333'},g);}
  return g;
}
function dibujarFiguras(div){
  const tipo=div.dataset.figura||'gota';const ops=div.dataset.opciones.split(';');const et=(div.dataset.etiquetas||'a;b;c;d').split(';');
  const W=700,H=130;const s=svg(W,H);
  el('rect',{x:10,y:10,width:150,height:110,rx:10,fill:'#fff',stroke:'#2bb3d9','stroke-width':2},s);
  figura(s,tipo,85,72,1,0);texto(s,85,28,'Original',{'font-size':13,fill:'#666'});
  ops.forEach((o,i)=>{const x=200+i*125;el('rect',{x,y:10,width:110,height:110,rx:10,fill:'#fff',stroke:'#999','stroke-width':2},s);
    const p={traslada:[1,0],gira:[1,90],agranda:[1.6,0],encoge:[.55,0],voltea:[1,180]}[o]||[1,0];
    figura(s,tipo,x+55,72,p[0],p[1]);texto(s,x+55,28,et[i],{'font-size':16,'font-weight':'bold',fill:'#e4452c'});});
  div.appendChild(s);
}

// ---------- Tabla de posiciones UM | C | D | U (como el muro del libro) ----------
// <div class="tabla-posiciones" data-cifras="2,1,7,4"></div>  (vacío = hueco en blanco; puede llevar menos de 4 columnas: "1,4,5" → C D U)
function dibujarTablaPosiciones(div){
  const cifras=div.dataset.cifras.split(',');const n=cifras.length;const cab=['UM','C','D','U'].slice(4-n);
  const col=['#f7d21c','#4caf50','#e4452c','#2b6cd9'].slice(4-n);const W=70;const s=svg(n*W+4,96);
  cifras.forEach((c,i)=>{const x=2+i*W;
    el('rect',{x,y:2,width:W,height:34,fill:col[i],stroke:'#333','stroke-width':1.5},s);texto(s,x+W/2,25,cab[i],{'font-size':16,'font-weight':'bold',fill:'#fff'});
    el('rect',{x,y:36,width:W,height:56,fill:'#fff',stroke:'#333','stroke-width':1.5},s);if(c.trim())texto(s,x+W/2,74,c.trim(),{'font-size':30,'font-weight':'bold'});});
  div.appendChild(s);
}

// ---------- Diagrama de Venn (comparar dos cosas) ----------
// <div class="venn" data-a="Plano 1" data-b="Plano 2" data-solo-a="…;…" data-comun="…" data-solo-b="…"></div>
function dibujarVenn(div){
  const W=700,H=260;const s=svg(W,H);
  el('circle',{cx:250,cy:140,r:110,fill:'#2bb3d9',opacity:.35,stroke:'#2bb3d9','stroke-width':2},s);
  el('circle',{cx:450,cy:140,r:110,fill:'#f7a823',opacity:.35,stroke:'#f7a823','stroke-width':2},s);
  texto(s,200,24,div.dataset.a||'A',{'font-size':16,'font-weight':'bold'});texto(s,500,24,div.dataset.b||'B',{'font-size':16,'font-weight':'bold'});
  const lineas=(t,x)=>(t||'').split(';').filter(Boolean).forEach((l,i)=>texto(s,x,110+i*22,l.trim(),{'font-size':13}));
  lineas(div.dataset.soloA,190);lineas(div.dataset.comun,350);lineas(div.dataset.soloB,510);
  if(!(div.dataset.comun||'').trim())texto(s,350,142,'?',{'font-size':30,'font-weight':'bold',fill:'#e4452c'});
  div.appendChild(s);
}

// ---------- Barras comparativas (alturas, distancias) ----------
function dibujarDistancias(div){
  const pares=div.dataset.valores.split(';').map(p=>{const [n,v]=p.split('=');return [n,num(v)];});const uni=div.dataset.unidad||'';
  const W=700,H=pares.length*50+30;const s=svg(W,H);const max=Math.max(...pares.map(p=>p[1]));
  pares.forEach(([n,v],i)=>{const y=30+i*50;const L=420*v/max;
    el('rect',{x:120,y:y-6,width:L,height:12,rx:6,fill:'#c8b89a'},s);
    el('rect',{x:98,y:y-16,width:22,height:16,fill:'#e4452c',stroke:'#333'},s);el('polygon',{points:`98,${y-16} 109,${y-27} 120,${y-16}`,fill:'#8a5a00'},s);
    texto(s,50,y+5,n,{'font-size':14,'font-weight':'bold','text-anchor':'middle'});
    texto(s,120+L/2,y-12,fmt(v)+' '+uni,{'font-size':13});
    el('polygon',{points:`${120+L+8},${y+10} ${120+L+22},${y-16} ${120+L+36},${y+10}`,fill:'#4caf50',stroke:'#2e5e1a'},s);el('rect',{x:120+L+19,y:y+10,width:6,height:8,fill:'#8a5a00'},s);});
  texto(s,W-40,H-6,'= bosque',{'font-size':12,fill:'#666'});el('polygon',{points:`${W-74},${H-2} ${W-66},${H-18} ${W-58},${H-2}`,fill:'#4caf50'},s);
  div.appendChild(s);
}
function dibujarCantidades(div){
  const pares=div.dataset.valores.split(';').map(p=>{const [n,v]=p.split('=');return [n,num(v)];});const uni=div.dataset.unidad||'';
  const W=700,H=pares.length*46+16;const s=svg(W,H);const max=Math.max(...pares.map(p=>p[1]));
  pares.forEach(([n,v],i)=>{const y=14+i*46;const L=Math.max(30,470*v/max);
    texto(s,70,y+22,n,{'font-size':14,'font-weight':'bold','text-anchor':'middle'});
    el('rect',{x:140,y,width:L,height:30,rx:8,fill:['#8bc34a','#2bb3d9','#f7a823','#b39ddb','#f48fb1'][i%5],stroke:'#333','stroke-width':1},s);
    texto(s,140+L+10,y+21,fmt(v)+(uni?' '+uni:''),{'font-size':14,'text-anchor':'start','font-weight':'bold'});});
  div.appendChild(s);
}
function dibujarBarras(div){
  if(div.dataset.tipo==='distancia')return dibujarDistancias(div);
  if(div.dataset.tipo==='cantidad')return dibujarCantidades(div);
  const pares=div.dataset.valores.split(';').map(p=>{const [n,v]=p.split('=');return [n,num(v)];});const uni=div.dataset.unidad||'';
  const W=Math.min(700,pares.length*140+40),H=200;const s=svg(W,H);const max=Math.max(...pares.map(p=>p[1]));
  pares.forEach(([n,v],i)=>{const x=40+i*140;const h=120*v/max;
    el('polygon',{points:`${x},170 ${x+50},${170-h} ${x+100},170`,fill:['#8bc34a','#4caf50','#aed581','#7cb342'][i%4],stroke:'#2e5e1a','stroke-width':2},s);
    el('rect',{x:x+38,y:170-h-10,width:24,height:14,fill:'#e4452c',stroke:'#333'},s);el('polygon',{points:`${x+38},${170-h-10} ${x+50},${170-h-22} ${x+62},${170-h-10}`,fill:'#8a5a00'},s);
    texto(s,x+50,188,n,{'font-size':13,'font-weight':'bold'});texto(s,x+50,170-h-28,fmt(v)+' '+uni,{'font-size':14});});
  el('line',{x1:20,y1:170,x2:W-20,y2:170,stroke:'#333','stroke-width':2},s);
  div.appendChild(s);
}

document.querySelectorAll('.bloques').forEach(dibujarBloques);
document.querySelectorAll('.tapones').forEach(dibujarTapones);
document.querySelectorAll('.recta').forEach(dibujarRecta);
document.querySelectorAll('.tarjetas').forEach(dibujarTarjetas);
document.querySelectorAll('.plano').forEach(dibujarPlano);
document.querySelectorAll('.figuras').forEach(dibujarFiguras);
document.querySelectorAll('.barras').forEach(dibujarBarras);
document.querySelectorAll('.tabla-posiciones').forEach(dibujarTablaPosiciones);
document.querySelectorAll('.venn').forEach(dibujarVenn);
})();
