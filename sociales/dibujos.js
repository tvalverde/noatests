/* Dibujos SVG para los exámenes de ciencias sociales. Se declaran en el HTML y se pintan al cargar.
   Las letras (data-letras="A=valor;B=valor") ponen una letra roja en el sitio de ese valor: el dibujo sale
   de los mismos datos que la respuesta, así no pueden contradecirse (los tests lo comprueban).
   <div class="globo" data-letras="A=polo norte;B=ecuador" data-nombres="1"></div>
        valores: polo norte, polo sur, eje terrestre, ecuador, hemisferio norte, hemisferio sur. data-nombres pone el nombre de lo que no lleva letra
   <div class="orbita" data-letras="A=sol;D=rotación" data-nombres="1"></div>        valores: sol, tierra, luna, rotación, traslación
   <div class="dia-noche" data-sol="izquierda" data-letras="A=día;B=noche"></div>
   <div class="arboles" data-letras="A=invierno;B=verano;C=otoño;D=primavera"></div> un árbol por estación, sin su nombre
   <div class="representaciones" data-letras="A=globo terráqueo;B=planisferio"></div>
   <div class="planisferio" data-nombres="1" data-letras="A=África" data-espana="1"></div> continentes y océanos
   <div class="mapa" data-clase="tiempo|fisico|politico" data-tiempo="norte=lluvia;sur=sol;este=nubes;oeste=nieve;centro=solnubes"
        data-letras="A=título;B=leyenda;C=escala;D=marca de orientación;E=toponimia"></div>
   <div class="mapas-tipos" data-letras="A=físico;B=político;C=temático"></div>       tres mapas pequeños de la misma isla
   <div class="calles" data-cols="3" data-rows="2" data-calles-h="Calle Negro|Avenida Azul|Calle Naranja" data-calles-v="Calle Verde|Calle Violeta|Calle Rosa|Calle Gris"
        data-edificios="0,0,hospital;0,1,colegio;1,2,letra,A;1,0,casa,Casa de Noa"></div>
        filas de arriba (norte) abajo y columnas de izquierda (oeste) a derecha. calles-h: rows+1 nombres; calles-v: cols+1 ('' = sin nombre)
        tipos: hospital, salud, colegio, bomberos, farmacia, biblioteca, casa, mercado, parque, polideportivo, letra
   <div class="edificio" data-bloques="A:Urgencias|Sala de curas;B:Cafetería|Laboratorio" data-puertas="A=2;B=1"></div> plano de un hospital
   <div class="horizonte" data-astro="amanecer|atardecer|polar" data-en="A" data-pos="A=izquierda;B=derecha"></div>
        lo que ve una niña (de espaldas) mirando al horizonte; el sol o la estrella polar está sobre la letra data-en
   <div class="monte" data-letras="A=umbría;B=solana"></div>                         la primera letra es la ladera izquierda
   <div class="rosa" data-letras="A=este;B=sur" data-estilo="brujula"></div>        lo que no lleva letra sale con su inicial (N, S, E, O)
*/
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
let uid=0;
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function svg(w,h){const s=el('svg',{viewBox:`0 0 ${w} ${h}`,width:'100%',style:`max-width:${w}px;display:block;margin:8px auto`});s.setAttribute('xmlns',NS);return s;}
function texto(s,x,y,t,attrs){const e=el('text',Object.assign({x,y,'font-family':'Arial, sans-serif','font-size':15,fill:'#333','text-anchor':'middle'},attrs||{}),s);e.textContent=t;return e;}
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
// "A=polo norte;B=ecuador" → [{letra:'A',valor:'polo norte'}]
function letras(div,attr){return (div.dataset[attr||'letras']||'').split(';').map(p=>p.trim()).filter(Boolean).map(p=>{const i=p.indexOf('=');return {letra:p.slice(0,i).trim(),valor:p.slice(i+1).trim()};});}
function letraDe(div,valor){const l=letras(div).find(x=>norm(x.valor)===norm(valor));return l?l.letra:null;}
// letra roja en un círculo blanco
function letra(s,x,y,L){const g=el('g',{class:'letra'},s);el('circle',{cx:x,cy:y,r:14,fill:'#fff',stroke:'#e4452c','stroke-width':3},g);texto(g,x,y+6,L,{'font-size':18,'font-weight':'bold',fill:'#e4452c'});return g;}
// etiqueta: letra si la tiene; nombre si data-nombres; si no, nada
function etiqueta(s,div,valor,x,y,nombre,attrs){const L=letraDe(div,valor);if(L)return letra(s,x,y,L);if(div.dataset.nombres)return texto(s,x,y+5,nombre||valor,Object.assign({'font-size':15,'font-weight':'bold'},attrs||{}));return null;}
const tieneEtiqueta=(div,valor)=>!!letraDe(div,valor)||!!div.dataset.nombres;
function flecha(s,x1,y1,x2,y2,color,ancho){
  el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':ancho||3,'stroke-linecap':'round'},s);
  const a=Math.atan2(y2-y1,x2-x1),L=12;
  el('polygon',{points:`${x2},${y2} ${x2-L*Math.cos(a-0.45)},${y2-L*Math.sin(a-0.45)} ${x2-L*Math.cos(a+0.45)},${y2-L*Math.sin(a+0.45)}`,fill:color},s);
}

// ---------- Tierras (longitud, latitud), muy simplificadas ----------
const TIERRAS={
  americaNorte:[[-168,66],[-155,71],[-130,70],[-110,73],[-90,74],[-80,70],[-65,62],[-55,50],[-67,45],[-76,36],[-81,30],[-80,25],[-84,30],[-90,29],[-97,27],[-97,20],[-92,16],[-86,12],[-79,8],[-84,10],[-92,15],[-105,20],[-112,30],[-117,33],[-124,40],[-125,48],[-135,58],[-150,60],[-165,60]],
  groenlandia:[[-55,60],[-42,60],[-22,70],[-20,80],[-40,83],[-60,80],[-70,77],[-55,70]],
  americaSur:[[-80,8],[-75,11],[-62,10],[-50,0],[-35,-5],[-38,-13],[-40,-22],[-48,-27],[-58,-38],[-65,-42],[-67,-55],[-73,-50],[-74,-40],[-71,-30],[-70,-18],[-76,-12],[-81,-5],[-80,0],[-78,5]],
  eurasia:[[-9,37],[-9,43],[-2,44],[-5,48],[2,51],[8,54],[8,57],[5,61],[12,66],[20,70],[30,71],[42,67],[60,70],[80,73],[100,77],[130,72],[160,70],[180,67],[175,62],[160,58],[158,52],[142,47],[130,38],[122,31],[121,23],[108,20],[106,10],[101,3],[98,9],[95,16],[90,22],[81,16],[78,8],[73,18],[67,24],[57,25],[52,16],[43,13],[35,28],[35,36],[28,37],[26,40],[23,37],[20,40],[19,42],[16,38],[12,44],[8,44],[3,42],[0,39],[-5,36]],
  reinoUnido:[[-5,50],[1,51],[-2,57],[-6,58],[-5,54]],
  africa:[[-17,21],[-17,15],[-13,8],[-8,4],[5,5],[9,4],[10,-2],[13,-10],[12,-17],[15,-25],[18,-34],[25,-34],[32,-28],[35,-20],[40,-15],[40,-5],[43,0],[51,12],[43,12],[37,20],[33,31],[25,32],[20,31],[10,33],[10,37],[0,36],[-6,36],[-10,30],[-13,27]],
  madagascar:[[44,-13],[50,-15],[47,-25],[43,-22]],
  japon:[[130,31],[140,35],[142,42],[140,40],[135,34]],
  indonesia:[[95,5],[105,-6],[115,-8],[120,-5],[110,0],[100,3]],
  australia:[[114,-22],[114,-34],[130,-32],[140,-38],[150,-38],[153,-28],[145,-15],[142,-11],[136,-12],[130,-12],[122,-18]],
  nuevaZelanda:[[172,-35],[178,-38],[174,-42],[167,-46],[170,-43]],
  antartida:(()=>{const p=[];for(let l=-180;l<=180;l+=20)p.push([l,-66-((l/20)%2?3:0)]);p.push([180,-90],[-180,-90]);return p;})()
};
const TIERRA_COLOR='#f2c94c',TIERRA_BORDE='#b8941f',MAR='#bfe3f7';
// Proyección ortográfica centrada en (lon0, 0). Los puntos de la cara oculta se pegan al borde.
function ortografica(lon,lat,lon0,R){
  const f=lat*Math.PI/180,d=(lon-lon0)*Math.PI/180;
  const y=-R*Math.sin(f);let x=R*Math.cos(f)*Math.sin(d);const vis=Math.cos(f)*Math.cos(d)>0;
  if(!vis)x=(Math.sin(d)>=0?1:-1)*Math.sqrt(Math.max(0,R*R-y*y));
  return {x,y,vis};
}
// Esfera con tierras, paralelos y meridianos. Devuelve el grupo.
function esfera(s,cx,cy,R,lon0,opc){
  opc=opc||{};const id='clip'+(++uid);
  const defs=el('defs',{},s);const cp=el('clipPath',{id},defs);el('circle',{cx,cy,r:R},cp);
  el('circle',{cx,cy,r:R,fill:MAR,stroke:'#2b6cd9','stroke-width':2},s);
  const g=el('g',{'clip-path':`url(#${id})`},s);
  for(const k in TIERRAS){const pts=TIERRAS[k].map(([lo,la])=>ortografica(lo,la,lon0,R));if(!pts.some(p=>p.vis))continue;
    el('polygon',{points:pts.map(p=>`${(cx+p.x).toFixed(1)},${(cy+p.y).toFixed(1)}`).join(' '),fill:TIERRA_COLOR,stroke:TIERRA_BORDE,'stroke-width':1},g);}
  if(opc.rejilla!==false){
    [-60,-30,30,60].forEach(la=>{const y=cy-R*Math.sin(la*Math.PI/180),w=R*Math.cos(la*Math.PI/180);el('line',{x1:cx-w,y1:y,x2:cx+w,y2:y,stroke:'#2b8a8a','stroke-width':1},g);});
    [-60,-30,30,60].forEach(d=>el('ellipse',{cx,cy,rx:Math.abs(R*Math.sin(d*Math.PI/180)),ry:R,fill:'none',stroke:'#2b8a8a','stroke-width':1},g));
    el('line',{x1:cx,y1:cy-R,x2:cx,y2:cy+R,stroke:'#2b8a8a','stroke-width':1},g);
  }
  return g;
}
// Planisferio (proyección equirectangular) dentro del rectángulo x,y,w,h. Latitudes de 82 a -80.
const LAT_N=82,LAT_S=-80;
function planoMundo(s,x,y,w,h,opc){
  opc=opc||{};const px=lo=>x+(lo+180)/360*w,py=la=>y+(LAT_N-la)/(LAT_N-LAT_S)*h;
  el('rect',{x,y,width:w,height:h,fill:MAR,stroke:'#2b6cd9','stroke-width':2},s);
  for(const k in TIERRAS)el('polygon',{points:TIERRAS[k].map(([lo,la])=>`${px(lo).toFixed(1)},${py(Math.max(LAT_S,la)).toFixed(1)}`).join(' '),fill:TIERRA_COLOR,stroke:TIERRA_BORDE,'stroke-width':1},s);
  for(let lo=-150;lo<180;lo+=30)el('line',{x1:px(lo),y1:y,x2:px(lo),y2:y+h,stroke:'#2b8a8a','stroke-width':.8},s);
  [-60,-30,30,60].forEach(la=>el('line',{x1:x,y1:py(la),x2:x+w,y2:py(la),stroke:'#2b8a8a','stroke-width':.8},s));
  el('line',{x1:x,y1:py(0),x2:x+w,y2:py(0),stroke:'#1a3d9e','stroke-width':opc.ecuadorFino?1.5:2.5},s);
  return {px,py};
}

// ---------- Globo terráqueo con sus elementos ----------
function dibujarGlobo(div){
  const W=560,H=430,cx=275,cy=215,R=150;const s=svg(W,H);
  esfera(s,cx,cy,R,-5);
  el('line',{x1:cx-R,y1:cy,x2:cx+R+40,y2:cy,stroke:'#1a3d9e','stroke-width':4},s); // ecuador
  el('line',{x1:cx,y1:cy-R-40,x2:cx,y2:cy+R+40,stroke:'#333','stroke-width':3},s); // eje
  el('circle',{cx,cy:cy-R,r:5,fill:'#333'},s);el('circle',{cx,cy:cy+R,r:5,fill:'#333'},s);
  // polos y eje
  if(tieneEtiqueta(div,'polo norte')){el('line',{x1:cx+5,y1:cy-R-2,x2:cx+60,y2:cy-R-22,stroke:'#999','stroke-width':1.5},s);etiqueta(s,div,'polo norte',cx+(letraDe(div,'polo norte')?75:105),cy-R-22,'Polo norte');}
  if(tieneEtiqueta(div,'polo sur')){el('line',{x1:cx+5,y1:cy+R+2,x2:cx+60,y2:cy+R+22,stroke:'#999','stroke-width':1.5},s);etiqueta(s,div,'polo sur',cx+(letraDe(div,'polo sur')?75:95),cy+R+22,'Polo sur');}
  if(tieneEtiqueta(div,'eje terrestre')){el('line',{x1:cx-3,y1:cy+R+34,x2:cx-50,y2:cy+R+34,stroke:'#999','stroke-width':1.5},s);etiqueta(s,div,'eje terrestre',cx-(letraDe(div,'eje terrestre')?66:105),cy+R+34,'Eje terrestre');}
  if(tieneEtiqueta(div,'ecuador'))etiqueta(s,div,'ecuador',cx+R+(letraDe(div,'ecuador')?62:84),cy,'Ecuador');
  // hemisferios: llave a la izquierda
  const llave=(y1,y2,valor,nombre)=>{if(!tieneEtiqueta(div,valor))return;const x=cx-R-18;
    el('path',{d:`M${x+8},${y1} L${x},${y1} L${x},${y2} L${x+8},${y2}`,fill:'none',stroke:'#c47a1a','stroke-width':2.5},s);
    el('line',{x1:x,y1:(y1+y2)/2,x2:x-14,y2:(y1+y2)/2,stroke:'#c47a1a','stroke-width':2.5},s);
    const L=letraDe(div,valor);if(L)letra(s,x-32,(y1+y2)/2,L);else{texto(s,x-50,(y1+y2)/2-4,'Hemisferio',{'font-size':14,'font-weight':'bold'});texto(s,x-50,(y1+y2)/2+14,nombre,{'font-size':14,'font-weight':'bold'});}};
  llave(cy-R+4,cy-4,'hemisferio norte','norte');llave(cy+4,cy+R-4,'hemisferio sur','sur');
  div.appendChild(s);
}

// ---------- Globo terráqueo y planisferio ----------
function dibujarRepresentaciones(div){
  const ls=letras(div);const P=330;const W=ls.length*P,H=250;const s=svg(W,H);
  ls.forEach((l,i)=>{const x0=i*P;
    el('rect',{x:x0+8,y:8,width:P-16,height:H-16,rx:14,fill:'#fff',stroke:'#ccc','stroke-width':2},s);
    if(norm(l.valor).startsWith('globo')){
      // soporte del globo
      el('path',{d:`M${x0+P/2+95},${60} A100,100 0 0,1 ${x0+P/2+60},${215}`,fill:'none',stroke:'#444','stroke-width':6},s);
      el('rect',{x:x0+P/2-30,y:220,width:60,height:12,rx:4,fill:'#444'},s);el('rect',{x:x0+P/2-5,y:205,width:10,height:16,fill:'#444'},s);
      esfera(s,x0+P/2,128,82,10);
    }else planoMundo(s,x0+22,62,P-44,(P-44)*0.45);
    letra(s,x0+30,32,l.letra);
  });
  div.appendChild(s);
}

// ---------- Planisferio con continentes y océanos ----------
const CONTINENTES={'américa':[-82,15],'europa':[18,52],'asia':[90,48],'áfrica':[18,6],'oceanía':[134,-26],'antártida':[0,-74]};
const OCEANOS={'océano pacífico':[-145,-15],'océano atlántico':[-35,-22],'océano índico':[78,-22]};
function dibujarPlanisferio(div){
  const W=700,mw=660,mh=mw*(LAT_N-LAT_S)/360;const H=mh+40;const s=svg(W,H);
  const {px,py}=planoMundo(s,20,20,mw,mh);
  texto(s,px(-25),py(0)-6,'Ecuador',{'font-size':12,fill:'#1a3d9e','font-weight':'bold'});
  for(const c in CONTINENTES){const [lo,la]=CONTINENTES[c];const L=letraDe(div,c);
    if(L)letra(s,px(lo),py(la),L);else if(div.dataset.nombres)texto(s,px(lo),py(la)+5,c.toUpperCase(),{'font-size':15,'font-weight':'bold','letter-spacing':2});}
  if(div.dataset.nombres)for(const o in OCEANOS){const [lo,la]=OCEANOS[o];texto(s,px(lo),py(la),o.toUpperCase(),{'font-size':12,'font-style':'italic',fill:'#1a5fa0','letter-spacing':1});}
  if(div.dataset.espana){el('circle',{cx:px(-4),cy:py(40),r:5,fill:'#e4452c',stroke:'#fff','stroke-width':1.5},s);texto(s,px(-4)-34,py(40)+4,'España',{'font-size':12,'font-weight':'bold',fill:'#e4452c'});}
  rosaPequena(s,58,H-62,22);
  div.appendChild(s);
}
function rosaPequena(s,x,y,r){
  el('circle',{cx:x,cy:y,r:r+12,fill:'#fff',opacity:.85},s);
  el('polygon',{points:`${x},${y-r} ${x+5},${y} ${x},${y+r} ${x-5},${y}`,fill:'#333'},s);
  el('polygon',{points:`${x-r},${y} ${x},${y-5} ${x+r},${y} ${x},${y+5}`,fill:'#777'},s);
  texto(s,x,y-r-2,'N',{'font-size':12,'font-weight':'bold'});
}

// ---------- La Tierra, el Sol y la Luna ----------
function estrellas(s,W,H,n){let z=7;const r=()=>(z=(z*9301+49297)%233280)/233280;for(let i=0;i<n;i++)el('circle',{cx:(r()*W).toFixed(0),cy:(r()*H).toFixed(0),r:(r()*1.4+.5).toFixed(1),fill:'#fff',opacity:.8},s);}
function sol(s,x,y,r){for(let i=0;i<12;i++){const a=i*Math.PI/6;el('line',{x1:x+Math.cos(a)*(r+4),y1:y+Math.sin(a)*(r+4),x2:x+Math.cos(a)*(r+Math.min(16,r*.5+4)),y2:y+Math.sin(a)*(r+Math.min(16,r*.5+4)),stroke:'#f7a823','stroke-width':4,'stroke-linecap':'round'},s);}el('circle',{cx:x,cy:y,r,fill:'#f7d21c',stroke:'#f58a1f','stroke-width':3},s);}
function dibujarOrbita(div){
  const W=700,H=330;const s=svg(W,H);
  el('rect',{x:0,y:0,width:W,height:H,rx:16,fill:'#14213d'},s);estrellas(s,W,H,50);
  const ox=390,oy=165,rx=290,ry=115;el('ellipse',{cx:ox,cy:oy,rx,ry,fill:'none',stroke:'#cfd8ea','stroke-width':2,'stroke-dasharray':'2 0'},s);
  sol(s,ox+20,oy,46);
  const pt=t=>[ox+rx*Math.cos(t*Math.PI/180),oy+ry*Math.sin(t*Math.PI/180)];
  const [tx,ty]=pt(200);
  // flecha de traslación a lo largo de la órbita
  const arco=[];for(let t=165;t>=118;t-=3)arco.push(pt(t));
  el('polyline',{points:arco.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#2bb3d9','stroke-width':7,'stroke-linecap':'round'},s);
  const [ax,ay]=pt(115),[bx,by]=pt(119);flecha(s,bx,by,ax,ay,'#2bb3d9',7);
  // la Tierra y su giro
  esfera(s,tx,ty,30,0,{rejilla:false});
  el('path',{d:`M${tx-44},${ty-6} A44,44 0 0,1 ${tx+40},${ty-18}`,fill:'none',stroke:'#f7a823','stroke-width':4},s);
  flecha(s,tx+36,ty-24,tx+42,ty-12,'#f7a823',4);
  // la Luna
  el('circle',{cx:tx+68,cy:ty+32,r:9,fill:'#ccc',stroke:'#999','stroke-width':1.5},s);
  const et=(valor,x,y,nombre)=>{const L=letraDe(div,valor);if(L)return letra(s,x,y,L);if(div.dataset.nombres){el('rect',{x:x-nombre.length*4.6-8,y:y-13,width:nombre.length*9.2+16,height:26,rx:8,fill:'#fff'},s);texto(s,x,y+5,nombre,{'font-size':15,'font-weight':'bold'});}};
  et('sol',ox+20,oy+82,'Sol');et('tierra',tx-58,ty+44,'Tierra');et('luna',tx+98,ty+46,'Luna');
  et('rotación',tx-4,ty-66,'Rotación');et('traslación',pt(140)[0]+10,pt(140)[1]+38,'Traslación');
  div.appendChild(s);
}

// ---------- El día y la noche ----------
function dibujarDiaNoche(div){
  const W=620,H=280;const s=svg(W,H);const izq=(div.dataset.sol||'izquierda')==='izquierda';
  el('rect',{x:0,y:0,width:W,height:H,rx:16,fill:'#14213d'},s);estrellas(s,W,H,30);
  const sx=izq?70:W-70,ex=izq?400:220,ey=145,R=105;
  sol(s,sx,ey,44);
  for(let k=-2;k<=2;k++)flecha(s,sx+(izq?62:-62),ey+k*34,ex+(izq?-R-14:R+14),ey+k*40,'#f7d21c',2);
  esfera(s,ex,ey,R,10,{rejilla:false});
  // mitad en sombra (la que no mira al sol)
  el('path',{d:izq?`M${ex},${ey-R} A${R},${R} 0 0,1 ${ex},${ey+R} Z`:`M${ex},${ey-R} A${R},${R} 0 0,0 ${ex},${ey+R} Z`,fill:'#0a1030',opacity:.7},s);
  letras(div).forEach(l=>{const dia=norm(l.valor)==='dia';const lado=(dia===izq)?-1:1;const yy=ey+(dia?-15:25);
    el('circle',{cx:ex+lado*55,cy:yy,r:6,fill:'#e4452c',stroke:'#fff','stroke-width':2},s);letra(s,ex+lado*55,yy-26,l.letra);});
  div.appendChild(s);
}

// ---------- Un árbol en cada estación ----------
function arbol(s,x,y,estacion){
  const e=norm(estacion);
  const cielo={invierno:'#dfe8f0',primavera:'#d8f1fb',verano:'#9fdcf7',otono:'#f6e3c4'}[e];
  const suelo={invierno:'#ffffff',primavera:'#8bc34a',verano:'#4caf50',otono:'#c9a25a'}[e];
  el('rect',{x,y,width:150,height:190,rx:12,fill:cielo,stroke:'#999','stroke-width':1.5},s);
  el('rect',{x:x+1,y:y+150,width:148,height:39,fill:suelo},s);
  if(e==='verano')sol(s,x+124,y+28,13);
  // tronco de abedul
  el('rect',{x:x+68,y:y+75,width:14,height:80,fill:'#f4f4f4',stroke:'#555','stroke-width':1.5},s);
  [[85,6],[100,8],[118,5],[135,7]].forEach(([dy,w])=>el('rect',{x:x+(dy%2?68:76),y:y+dy,width:w,height:3,fill:'#333'},s));
  if(e==='invierno'){
    [[-1,1],[1,1],[-1,.6],[1,.6]].forEach(([sx,k])=>{el('line',{x1:x+75,y1:y+95-30*(1-k),x2:x+75+sx*40*k,y2:y+45-20*(1-k),stroke:'#555','stroke-width':3,'stroke-linecap':'round'},s);});
    el('line',{x1:x+75,y1:y+80,x2:x+75,y2:y+30,stroke:'#555','stroke-width':3},s);
    [[30,30],[110,50],[50,70],[125,95],[20,110],[95,20]].forEach(([dx,dy])=>texto(s,x+dx,y+dy,'❄',{'font-size':14,fill:'#7aa7d9'}));
  }else{
    const copa={primavera:'#a5d66b',verano:'#2e8b3e',otono:'#e8952b'}[e];
    [[75,55,42],[48,72,28],[102,72,28],[75,85,30]].forEach(([dx,dy,r])=>el('circle',{cx:x+dx,cy:y+dy,r,fill:copa,stroke:'#0002','stroke-width':1},s));
    if(e==='primavera')[[60,45],[90,40],[50,75],[100,80],[75,65],[110,60],[42,60]].forEach(([dx,dy])=>el('circle',{cx:x+dx,cy:y+dy,r:4,fill:'#f48fb1',stroke:'#fff'},s));
    if(e==='otono')[[25,120],[120,130],[40,160],[105,165],[130,105],[60,172]].forEach(([dx,dy])=>el('ellipse',{cx:x+dx,cy:y+dy,rx:6,ry:3,fill:['#e4452c','#f7a823','#c47a1a'][dx%3],transform:`rotate(${dx} ${x+dx} ${y+dy})`},s));
  }
}
function dibujarArboles(div){
  const ls=letras(div);const W=ls.length*165+5,H=205;const s=svg(W,H);
  ls.forEach((l,i)=>{arbol(s,5+i*165,8,l.valor);letra(s,5+i*165+20,30,l.letra);});
  div.appendChild(s);
}

// ---------- Mapas de una isla inventada (Isla Redonda) ----------
const TIEMPOS={sol:'Soleado',solnubes:'Sol y nubes',nubes:'Nublado',lluvia:'Lluvia',nieve:'Nieve'};
function icono(s,tipo,x,y,k){
  k=k||1;const nube=(dx,dy)=>{[[0,0,13],[14,-6,15],[28,0,12]].forEach(([a,b,r])=>el('circle',{cx:x+(dx+a-14)*k,cy:y+(dy+b)*k,r:r*k,fill:'#cfd6de',stroke:'#7b8794','stroke-width':1.5},s));el('rect',{x:x+(dx-14)*k,y:y+dy*k,width:28*k,height:12*k,fill:'#cfd6de'},s);};
  if(tipo==='sol')sol(s,x,y,12*k);
  else if(tipo==='solnubes'){sol(s,x+8*k,y-8*k,10*k);nube(-4,4);}
  else if(tipo==='nubes')nube(0,0);
  else if(tipo==='lluvia'){nube(0,-6);[-10,0,10].forEach(d=>el('line',{x1:x+d*k,y1:y+10*k,x2:x+(d-4)*k,y2:y+22*k,stroke:'#2b6cd9','stroke-width':2.5*k,'stroke-linecap':'round'},s));}
  else if(tipo==='nieve'){nube(0,-6);[-10,0,10].forEach(d=>texto(s,x+d*k,y+24*k,'✱',{'font-size':12*k,fill:'#2b6cd9'}));}
}
function isla(cx,cy){const p=[];for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const r=1+.08*Math.sin(3*a)+.05*Math.cos(5*a);p.push([cx+Math.cos(a)*190*r,cy+Math.sin(a)*135*r]);}return p;}
const ZONAS={norte:[0,-82],sur:[0,82],este:[125,0],oeste:[-125,0],centro:[0,0]};
function mapaIsla(s,div,clase,x0,y0){
  // dibuja en un lienzo de 600x470 desplazado a x0,y0; la isla va un poco reducida para que quepa la leyenda con letra grande
  const g=el('g',{transform:`translate(${x0} ${y0})`},s);const cx=225,cy=255,K=.82;
  const gi=el('g',{transform:`translate(${cx} ${cy}) scale(${K}) translate(${-cx} ${-cy})`},g);
  el('rect',{x:0,y:0,width:600,height:470,rx:14,fill:'#9fd3f2',stroke:'#2b6cd9','stroke-width':2},g);
  g.insertBefore(g.lastChild,gi);const pts=isla(cx,cy).map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ');
  const tit={tiempo:'Predicción del tiempo de Isla Redonda',fisico:'Relieve de Isla Redonda',politico:'Regiones de Isla Redonda'}[clase];
  let ley=[];
  if(clase==='fisico'){
    el('polygon',{points:pts,fill:'#9ccc65',stroke:'#2e5e1a','stroke-width':2},gi);
    el('path',{d:`M${cx-90},${cy-20} C${cx-60},${cy-90} ${cx+50},${cy-95} ${cx+80},${cy-30} C${cx+100},${cy+20} ${cx+20},${cy+50} ${cx-40},${cy+30} C${cx-80},${cy+20} ${cx-100},${cy+5} ${cx-90},${cy-20} Z`,fill:'#c8955a',stroke:'#8a5a2a','stroke-width':1.5},gi);
    el('path',{d:`M${cx+10},${cy-10} C${cx+40},${cy+50} ${cx+90},${cy+80} ${cx+110},${cy+130}`,fill:'none',stroke:'#2b6cd9','stroke-width':4},gi);
    el('polygon',{points:`${cx-12},${cy-30} ${cx},${cy-52} ${cx+12},${cy-30}`,fill:'#b0306a'},gi);
    texto(gi,cx,cy-60,'Pico Alto',{'font-size':18,'font-weight':'bold'});
    ley=[['rect','#9ccc65','Llanuras'],['rect','#c8955a','Montañas'],['linea','#2b6cd9','Río'],['pico','#b0306a','Pico']];
  }else if(clase==='politico'){
    el('polygon',{points:pts,fill:'#f8bbd0',stroke:'#333','stroke-width':2},gi);
    const id='isla'+(++uid);const cp=el('clipPath',{id},el('defs',{},gi));el('polygon',{points:pts},cp);
    const gc=el('g',{'clip-path':`url(#${id})`},gi);
    el('polygon',{points:`${cx-20},0 700,0 700,${cy+20} ${cx+40},${cy+10}`,fill:'#fff59d'},gc);
    el('polygon',{points:`0,${cy+40} ${cx+40},${cy+10} 700,${cy+20} 700,430 0,430`,fill:'#d1c4e9'},gc);
    el('polyline',{points:`${cx-20},0 ${cx+40},${cy+10} 700,${cy+20}`,fill:'none',stroke:'#555','stroke-width':2,'stroke-dasharray':'8 5'},gc);
    el('polyline',{points:`0,${cy+40} ${cx+40},${cy+10}`,fill:'none',stroke:'#555','stroke-width':2,'stroke-dasharray':'8 5'},gc);
    [['ALBA',cx-95,cy-40],['BRISA',cx+120,cy-50],['CORAL',cx+20,cy+85]].forEach(([n,x,y])=>texto(gi,x,y,n,{'font-size':20,'font-weight':'bold','letter-spacing':2}));
    [[cx-90,cy-10,'Villa Alba'],[cx+110,cy-20,'Puerto Brisa'],[cx+30,cy+115,'Coralia']].forEach(([x,y,n])=>{el('circle',{cx:x,cy:y,r:5,fill:'#333'},gi);texto(gi,x,y+22,n,{'font-size':17});});
    ley=[['punto','#333','Capital'],['raya','#555','Límite de región']];
  }else{
    el('polygon',{points:pts,fill:'#fff59d',stroke:'#8a7a1a','stroke-width':2},gi);
    const t={};(div.dataset.tiempo||'').split(';').filter(Boolean).forEach(p=>{const [z,v]=p.split('=');t[z.trim()]=v.trim();});
    for(const z in ZONAS)if(t[z])icono(gi,t[z],cx+ZONAS[z][0],cy+ZONAS[z][1],1.3);
    ley=Object.keys(TIEMPOS).map(k=>['icono',k,TIEMPOS[k]]);
  }
  // toponimia: un pueblo de la costa
  if(clase!=='politico'){el('circle',{cx:cx-120,cy:cy+55,r:5,fill:'#333'},g);texto(g,cx-120,cy+76,'Puerto Sal',{'font-size':16,'font-weight':'bold'});}
  // título
  el('rect',{x:12,y:12,width:tit.length*9.6+20,height:36,rx:8,fill:'#fff',stroke:'#333','stroke-width':1.5},g);
  texto(g,22,36,tit,{'font-size':17,'font-weight':'bold','text-anchor':'start'});
  // leyenda
  const lx=394,ly=140,lh=ley.length*40+40;
  el('rect',{x:lx,y:ly,width:200,height:lh,rx:8,fill:'#fff',stroke:'#333','stroke-width':1.5},g);
  texto(g,lx+100,ly+25,'Leyenda',{'font-size':17,'font-weight':'bold'});
  ley.forEach(([tipo,c,n],i)=>{const y=ly+58+i*40;
    if(tipo==='rect')el('rect',{x:lx+10,y:y-10,width:22,height:16,fill:c,stroke:'#333'},g);
    else if(tipo==='linea')el('line',{x1:lx+10,y1:y-2,x2:lx+32,y2:y-2,stroke:c,'stroke-width':4},g);
    else if(tipo==='pico')el('polygon',{points:`${lx+12},${y+4} ${lx+21},${y-12} ${lx+30},${y+4}`,fill:c},g);
    else if(tipo==='punto')el('circle',{cx:lx+21,cy:y-2,r:5,fill:c},g);
    else if(tipo==='raya')el('line',{x1:lx+8,y1:y-2,x2:lx+34,y2:y-2,stroke:c,'stroke-width':2,'stroke-dasharray':'6 4'},g);
    else icono(g,c,lx+26,y-6,.8);
    texto(g,lx+56,y+4,n,{'font-size':16,'text-anchor':'start'});});
  // escala
  el('rect',{x:440,y:436,width:50,height:7,fill:'#333'},g);el('rect',{x:490,y:436,width:50,height:7,fill:'#fff',stroke:'#333'},g);
  ['0','10','20 km'].forEach((t,i)=>texto(g,440+i*50,428,t,{'font-size':15}));
  // marca de orientación
  const rx0=548,ry0=88;el('polygon',{points:`${rx0},${ry0-34} ${rx0+8},${ry0} ${rx0},${ry0+34} ${rx0-8},${ry0}`,fill:'#333'},g);
  el('polygon',{points:`${rx0-34},${ry0} ${rx0},${ry0-8} ${rx0+34},${ry0} ${rx0},${ry0+8}`,fill:'#888'},g);
  texto(g,rx0,ry0-40,'N',{'font-size':17,'font-weight':'bold'});
  // letras sobre los elementos
  const pos={'titulo':[Math.min(tit.length*9.6+50,500),30],'leyenda':[lx+200,ly],'escala':[418,440],'marca de orientacion':[rx0-52,ry0+30],'toponimia':[cx-120,cy+104]};
  letras(div).forEach(l=>{const p=pos[norm(l.valor)];if(p)letra(g,p[0],p[1],l.letra);});
  return g;
}
function dibujarMapa(div){const s=svg(600,470);mapaIsla(s,div,div.dataset.clase||'tiempo',0,0);div.appendChild(s);}
function dibujarMapasTipos(div){
  const ls=letras(div);const k=.8,P=470*k+16;const W=600*k+60,H=ls.length*P;const s=svg(W,H);
  const falso={dataset:{tiempo:'norte=lluvia;sur=sol;este=nubes;oeste=solnubes;centro=nubes'}};
  ls.forEach((l,i)=>{const clase={fisico:'fisico',politico:'politico',tematico:'tiempo'}[norm(l.valor)];
    const g=el('g',{transform:`translate(52 ${i*P+8}) scale(${k})`},s);mapaIsla(g,falso,clase,0,0);letra(s,22,i*P+30,l.letra);});
  div.appendChild(s);
}

// ---------- Plano de calles ----------
const EDIF={hospital:'Hospital',salud:'Centro de salud',colegio:'Colegio',bomberos:'Bomberos',farmacia:'Farmacia',biblioteca:'Biblioteca',casa:'Casa',mercado:'Mercado',parque:'Parque',polideportivo:'Polideportivo'};
function edificioIcono(s,tipo,x,y){ // centrado en x,y, unos 56 px
  const caja=(w,h,c)=>el('rect',{x:x-w/2,y:y+24-h,width:w,height:h,fill:c,stroke:'#333','stroke-width':1.5},s);
  const ventanas=(w,h,f,c)=>{for(let i=0;i<f;i++)for(let j=0;j<c;j++)el('rect',{x:x-w/2+8+j*((w-16)/c),y:y+24-h+8+i*14,width:(w-16)/c-6,height:8,fill:'#bfe3f7',stroke:'#555','stroke-width':.6},s);};
  if(tipo==='hospital'){caja(60,56,'#fff');ventanas(60,56,2,3);el('rect',{x:x-14,y:y-6,width:28,height:22,fill:'#e4452c'},s);texto(s,x,y+11,'H',{'font-size':18,'font-weight':'bold',fill:'#fff'});}
  else if(tipo==='salud'){caja(56,40,'#fff');el('rect',{x:x-4,y:y-12,width:8,height:24,fill:'#e4452c'},s);el('rect',{x:x-12,y:y-4,width:24,height:8,fill:'#e4452c'},s);}
  else if(tipo==='farmacia'){caja(50,38,'#fff');el('rect',{x:x-4,y:y-10,width:8,height:24,fill:'#2e9d47'},s);el('rect',{x:x-12,y:y-2,width:24,height:8,fill:'#2e9d47'},s);}
  else if(tipo==='colegio'){caja(62,40,'#f7d21c');ventanas(62,40,1,3);el('rect',{x:x-6,y:y+8,width:12,height:16,fill:'#8a5a00'},s);el('line',{x1:x+22,y1:y-16,x2:x+22,y2:y-36,stroke:'#333','stroke-width':2},s);el('polygon',{points:`${x+22},${y-36} ${x+36},${y-31} ${x+22},${y-26}`,fill:'#e4452c'},s);}
  else if(tipo==='bomberos'){caja(62,44,'#e4452c');el('rect',{x:x-22,y:y-2,width:44,height:26,fill:'#fff',stroke:'#333'},s);for(let i=1;i<4;i++)el('line',{x1:x-22,y1:y-2+i*6.5,x2:x+22,y2:y-2+i*6.5,stroke:'#999'},s);}
  else if(tipo==='biblioteca'){caja(60,42,'#b39ddb');el('path',{d:`M${x-16},${y-8} L${x},${y-4} L${x+16},${y-8} L${x+16},${y+12} L${x},${y+16} L${x-16},${y+12} Z`,fill:'#fff',stroke:'#333'},s);el('line',{x1:x,y1:y-4,x2:x,y2:y+16,stroke:'#333'},s);}
  else if(tipo==='casa'){el('polygon',{points:`${x-28},${y-2} ${x},${y-26} ${x+28},${y-2}`,fill:'#e4452c',stroke:'#333','stroke-width':1.5},s);caja(44,26,'#fde9a8');el('rect',{x:x-5,y:y+10,width:10,height:14,fill:'#8a5a00'},s);}
  else if(tipo==='mercado'){caja(62,34,'#fff');for(let i=0;i<6;i++)el('rect',{x:x-31+i*10.3,y:y-16,width:10.3,height:12,fill:i%2?'#fff':'#2bb3d9',stroke:'#333','stroke-width':.6},s);}
  else if(tipo==='polideportivo'){caja(64,34,'#8bc34a');el('circle',{cx:x,cy:y+8,r:10,fill:'#fff',stroke:'#333'},s);el('line',{x1:x-10,y1:y+8,x2:x+10,y2:y+8,stroke:'#333'},s);}
}
function dibujarCalles(div){
  const cols=+div.dataset.cols,rows=+div.dataset.rows;const B=124,S=38,M=10,TOP=78;
  const ch=div.dataset.callesH.split('|'),cv=div.dataset.callesV.split('|');
  const W=M*2+cols*B+(cols+1)*S,H=M*2+TOP+rows*B+(rows+1)*S;const s=svg(W,H);
  const gx=M,gy=M+TOP,gw=cols*B+(cols+1)*S,gh=rows*B+(rows+1)*S;
  el('rect',{x:gx,y:gy,width:gw,height:gh,fill:'#d9d9d9',rx:6},s);
  const bx=c=>gx+S+c*(B+S),by=r=>gy+S+r*(B+S);
  // nombres de las calles
  ch.forEach((n,i)=>{if(n.trim())texto(s,gx+gw/2,gy+i*(B+S)+S/2+5,n.trim(),{'font-size':17,'font-weight':'bold',fill:'#333'});});
  cv.forEach((n,i)=>{if(!n.trim())return;const x=gx+i*(B+S)+S/2+5,y=gy+gh/2;texto(s,x,y,n.trim(),{'font-size':17,'font-weight':'bold',fill:'#333',transform:`rotate(-90 ${x} ${y})`});});
  // manzanas
  const ed={};(div.dataset.edificios||'').split(';').filter(Boolean).forEach(p=>{const [r,c,tipo,nombre]=p.split(',');ed[r+','+c]={tipo:tipo.trim(),nombre:(nombre||'').trim()};});
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=bx(c),y=by(r);const e=ed[r+','+c];
    if(e&&e.tipo==='parque'){el('rect',{x,y,width:B,height:B,rx:10,fill:'#4caf50',stroke:'#2e5e1a','stroke-width':1.5},s);
      [[30,28],[70,22],[102,40],[38,64],[92,72]].forEach(([dx,dy])=>{el('circle',{cx:x+dx,cy:y+dy,r:14,fill:'#2e7d32',stroke:'#1b5e20'},s);});
      texto(s,x+B/2,y+B-12,e.nombre||EDIF.parque,{'font-size':16,'font-weight':'bold',fill:'#fff'});continue;}
    el('rect',{x,y,width:B,height:B,rx:10,fill:'#f1ead2',stroke:'#b9a77a','stroke-width':1.5},s);
    if(!e)continue;
    if(e.tipo==='letra'){letra(s,x+B/2,y+B/2,e.nombre);continue;}
    edificioIcono(s,e.tipo,x+B/2,y+B/2-14);
    const nom=e.nombre||EDIF[e.tipo]||e.tipo;const pal=nom.split(' ');const lin=nom.length>14&&pal.length>1?[pal.slice(0,Math.ceil(pal.length/2)).join(' '),pal.slice(Math.ceil(pal.length/2)).join(' ')]:[nom];
    lin.forEach((t,i)=>texto(s,x+B/2,y+B-26+i*16+(lin.length===1?8:0),t,{'font-size':16,'font-weight':'bold'}));
  }
  // marca de orientación
  const rx0=gx+gw-44,ry0=M+38;
  el('polygon',{points:`${rx0},${ry0-24} ${rx0+6},${ry0} ${rx0},${ry0+24} ${rx0-6},${ry0}`,fill:'#333'},s);
  el('polygon',{points:`${rx0-24},${ry0} ${rx0},${ry0-6} ${rx0+24},${ry0} ${rx0},${ry0+6}`,fill:'#888'},s);
  [['N',0,-28],['S',0,42],['E',34,6],['O',-34,6]].forEach(([t,dx,dy])=>texto(s,rx0+dx,ry0+dy,t,{'font-size':16,'font-weight':'bold'}));
  div.appendChild(s);
}

// ---------- Plano de un hospital ----------
function dibujarEdificio(div){
  const bloques=div.dataset.bloques.split(';').map(p=>{const [b,salas]=p.split(':');return {b:b.trim(),salas:salas.split('|').map(x=>x.trim())};});
  const puertas={};(div.dataset.puertas||'').split(';').filter(Boolean).forEach(p=>{const [b,n]=p.split('=');puertas[b.trim()]=n.trim();});
  const CW=160,G=12,RH=74;const maxS=Math.max(...bloques.map(b=>b.salas.length));
  const W=bloques.length*(CW+G)+G+60,H=70+maxS*RH+84;const s=svg(W,H);const x0=30,y0=50;
  const colores=['#d1c4e9','#ffccbc','#fff59d','#c8e6c9','#b3e5fc','#f8bbd0'];
  el('rect',{x:x0,y:y0,width:bloques.length*(CW+G)+G,height:maxS*RH+30,fill:'#eee',stroke:'#555','stroke-width':3},s);
  bloques.forEach((bl,i)=>{const x=x0+G+i*(CW+G);
    texto(s,x+CW/2,y0-12,'Bloque '+bl.b,{'font-size':19,'font-weight':'bold'});
    bl.salas.forEach((n,j)=>{const y=y0+14+j*RH;el('rect',{x,y,width:CW,height:RH-6,rx:6,fill:colores[(i*2+j)%colores.length],stroke:'#555','stroke-width':1.5},s);
      const pal=n.split(' ');const lin=n.length>11&&pal.length>1?[pal.slice(0,Math.ceil(pal.length/2)).join(' '),pal.slice(Math.ceil(pal.length/2)).join(' ')]:[n];
      lin.forEach((t,k)=>texto(s,x+CW/2,y+RH/2+3+(k-(lin.length-1)/2)*21,t,{'font-size':19,'font-weight':'bold'}));});
    if(puertas[bl.b]){const yb=y0+maxS*RH+30;el('rect',{x:x+CW/2-26,y:yb-4,width:52,height:8,fill:'#fff'},s);
      flecha(s,x+CW/2,yb+38,x+CW/2,yb+6,'#2b8a3e',4);texto(s,x+CW/2,yb+60,'Puerta '+puertas[bl.b],{'font-size':19,'font-weight':'bold',fill:'#2b8a3e'});}
  });
  for(let k=0;k<6;k++){el('circle',{cx:12,cy:y0+20+k*(maxS*RH)/6,r:9,fill:'#66bb6a'},s);el('circle',{cx:W-12,cy:y0+20+k*(maxS*RH)/6,r:9,fill:'#66bb6a'},s);}
  div.appendChild(s);
}

// ---------- Mirando al horizonte: sol o estrella polar ----------
const POS_X={izquierda:110,centro:350,derecha:590};
function dibujarHorizonte(div){
  const astro=div.dataset.astro||'amanecer',noche=astro==='polar';const W=700,H=300,HY=185;const s=svg(W,H);
  const pos={};letras(div,'pos').forEach(l=>pos[l.letra]=norm(l.valor));
  el('rect',{x:0,y:0,width:W,height:HY,fill:noche?'#0b1d3a':astro==='amanecer'?'#ffd9a8':'#f7b48a'},s);
  if(noche)estrellas(s,W,HY,45);
  el('path',{d:`M0,${HY} Q120,${HY-40} 240,${HY} Q360,${HY-25} 470,${HY} Q590,${HY-45} 700,${HY} L700,${H} L0,${H} Z`,fill:noche?'#1f3d2a':'#7cb342'},s);
  const xa=POS_X[pos[div.dataset.en]]||350;
  if(noche){
    // Osa Mayor: sus dos últimas estrellas apuntan a la polar
    const osa=[[xa-150,140],[xa-115,130],[xa-85,128],[xa-55,120],[xa-40,95],[xa-75,88],[xa-60,62]];
    el('polyline',{points:osa.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#9fb3d9','stroke-width':1,'stroke-dasharray':'3 3'},s);
    osa.forEach(([x,y])=>el('circle',{cx:x,cy:y,r:3,fill:'#fff'},s));
    el('line',{x1:xa-60,y1:62,x2:xa-8,y2:38,stroke:'#9fb3d9','stroke-width':1,'stroke-dasharray':'3 3'},s);
    el('polygon',{points:Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?6:16;return `${xa+r*Math.cos(a)},${34+r*Math.sin(a)}`;}).join(' '),fill:'#fff59d',stroke:'#fff'},s);
    texto(s,xa+56,40,'Estrella polar',{'font-size':14,fill:'#fff','font-weight':'bold'});
  }else{
    const id='cielo'+(++uid);const cp=el('clipPath',{id},el('defs',{},s));el('rect',{x:0,y:0,width:W,height:HY-14},cp);
    const g=el('g',{'clip-path':`url(#${id})`},s);sol(g,xa,HY-14,34);
  }
  texto(s,16,30,noche?'De noche':astro==='amanecer'?'Al amanecer':'Al atardecer',{'font-size':17,'font-weight':'bold',fill:noche?'#fff':'#333','text-anchor':'start'});
  // letras en el suelo
  for(const L in pos)letra(s,POS_X[pos[L]],HY+22,L);
  // niña de espaldas mirando al horizonte
  const nx=350,ny=276;el('rect',{x:nx-14,y:ny-14,width:28,height:36,rx:8,fill:'#2bb3d9'},s);el('circle',{cx:nx,cy:ny-28,r:15,fill:'#8a5a2a'},s);
  el('line',{x1:nx-14,y1:ny-6,x2:nx-26,y2:ny+14,stroke:'#f2c9a0','stroke-width':6,'stroke-linecap':'round'},s);el('line',{x1:nx+14,y1:ny-6,x2:nx+26,y2:ny+14,stroke:'#f2c9a0','stroke-width':6,'stroke-linecap':'round'},s);
  div.appendChild(s);
}

// ---------- Umbría y solana ----------
function dibujarMonte(div){
  const ls=letras(div);const W=640,H=280;const s=svg(W,H);
  const izqUmbria=ls.length&&norm(ls[0].valor)==='umbria';
  el('rect',{x:0,y:0,width:W,height:H,rx:14,fill:'#d8f1fb'},s);
  el('path',{d:`M20,250 L320,50 L320,250 Z`,fill:izqUmbria?'#2e7d32':'#d9b25f'},s);
  el('path',{d:`M320,50 L620,250 L320,250 Z`,fill:izqUmbria?'#d9b25f':'#2e7d32'},s);
  el('path',{d:`M20,250 L320,50 L620,250`,fill:'none',stroke:'#5d4a2a','stroke-width':3},s);
  const arboles=(lado)=>{for(let i=0;i<14;i++){const t=(i%7+1)/8,fila=Math.floor(i/7);const x=320+lado*(300*t-10-fila*30),y=50+200*t+fila*14-4;if(y>240)continue;el('polygon',{points:`${x-9},${y+10} ${x},${y-14} ${x+9},${y+10}`,fill:'#1b5e20',stroke:'#0d3d10'},s);}};
  const matas=(lado)=>{[[.4],[.7],[.85]].forEach(([t])=>{const x=320+lado*300*t,y=50+200*t;el('circle',{cx:x,cy:y-2,r:5,fill:'#8d9a3a'},s);});};
  arboles(izqUmbria?-1:1);matas(izqUmbria?1:-1);
  sol(s,izqUmbria?560:80,60,24);
  ls.slice(0,2).forEach((l,i)=>letra(s,i?470:170,200,l.letra));
  div.appendChild(s);
}

// ---------- Rosa de los vientos / brújula ----------
function dibujarRosa(div){
  const W=300,H=300,cx=150,cy=150;const s=svg(W,H);s.style.maxWidth='230px';const brujula=div.dataset.estilo==='brujula';
  if(brujula){el('circle',{cx,cy,r:128,fill:'#f7d21c',stroke:'#8a6d00','stroke-width':4},s);el('circle',{cx,cy,r:110,fill:'#fff',stroke:'#555','stroke-width':2},s);
    for(let i=0;i<36;i++){const a=i*Math.PI/18;el('line',{x1:cx+Math.cos(a)*100,y1:cy+Math.sin(a)*100,x2:cx+Math.cos(a)*(i%9?94:88),y2:cy+Math.sin(a)*(i%9?94:88),stroke:'#555','stroke-width':1.5},s);}
    el('polygon',{points:`${cx},${cy-70} ${cx+9},${cy} ${cx-9},${cy}`,fill:'#e4452c'},s);el('polygon',{points:`${cx},${cy+70} ${cx+9},${cy} ${cx-9},${cy}`,fill:'#90a4ae'},s);el('circle',{cx,cy,r:6,fill:'#333'},s);
  }else{
    el('polygon',{points:`${cx},${cy-110} ${cx+16},${cy} ${cx},${cy+110} ${cx-16},${cy}`,fill:'#333'},s);
    el('polygon',{points:`${cx-110},${cy} ${cx},${cy-16} ${cx+110},${cy} ${cx},${cy+16}`,fill:'#888'},s);
    el('circle',{cx,cy,r:8,fill:'#fff',stroke:'#333','stroke-width':2},s);
  }
  const d=brujula?78:132;const P={norte:[0,-1,'N'],sur:[0,1,'S'],este:[1,0,'E'],oeste:[-1,0,'O']};
  for(const k in P){const [dx,dy,ini]=P[k];const x=cx+dx*d,y=cy+dy*d;const L=letraDe(div,k);
    if(L)letra(s,x,y,L);else texto(s,x,y+7,ini,{'font-size':20,'font-weight':'bold'});}
  div.appendChild(s);
}

const PINTORES={'.globo':dibujarGlobo,'.representaciones':dibujarRepresentaciones,'.planisferio':dibujarPlanisferio,'.orbita':dibujarOrbita,'.dia-noche':dibujarDiaNoche,
  '.arboles':dibujarArboles,'.mapa':dibujarMapa,'.mapas-tipos':dibujarMapasTipos,'.calles':dibujarCalles,'.edificio':dibujarEdificio,'.horizonte':dibujarHorizonte,'.monte':dibujarMonte,'.rosa':dibujarRosa};
for(const sel in PINTORES)document.querySelectorAll(sel).forEach(PINTORES[sel]);
window.noatestsSociales={TIEMPOS,ZONAS,EDIF};
})();
