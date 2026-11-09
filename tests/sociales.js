/* Comprueba los exámenes de ciencias sociales:
   - 10 preguntas con tipo conocido, y con las respuestas correctas se obtiene 10,00 (y con una mal, menos)
   - cada dibujo se pinta, y cada letra de data-letras aparece en el dibujo y tiene un valor válido
   - si una fila pregunta por una letra (<b>A</b>), la respuesta coincide con lo que el dibujo pone en esa letra
   - horizonte (sol o estrella polar), plano de calles, plano del hospital, mapa del tiempo y fechas:
     la respuesta se calcula a partir de los datos del dibujo y debe coincidir con la del examen
   - el plano de calles: las calles que cita el enunciado rodean la manzana y "al norte de…" es cierto
   - toda pregunta cuyo enunciado habla de un dibujo (plano, mapa, globo, árbol…) lo muestra
   Uso: node tests/sociales.js */
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const raiz=path.join(__dirname,'..');
const examenes=[];
(function busca(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())busca(p);else if(e.name==='index.html'&&/\/examen\d+\/index\.html$/.test(p))examenes.push(p);}})(path.join(raiz,'sociales'));
let errores=0;const fallo=m=>{console.error('  ✗ '+m);errores++;};
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
const TIPOS=['tierra','estaciones','globo','planisferio','mapas','planos','orientacion'];
// valores permitidos en data-letras de cada dibujo
const VALORES={'.globo':['polo norte','polo sur','ecuador','eje terrestre','hemisferio norte','hemisferio sur'],'.orbita':['sol','tierra','luna','rotacion','traslacion'],
  '.dia-noche':['dia','noche'],'.arboles':['invierno','primavera','verano','otono'],'.representaciones':['globo terraqueo','planisferio'],
  '.planisferio':['america','europa','asia','africa','oceania','antartida'],'.mapa':['titulo','leyenda','escala','marca de orientacion','toponimia'],
  '.mapas-tipos':['fisico','politico','tematico'],'.monte':['umbria','solana'],'.rosa':['norte','sur','este','oeste']};
const DIBUJOS=Object.keys(VALORES).concat(['.calles','.edificio','.horizonte']);
// respuestas que equivalen al valor del dibujo
const EQUIV={umbria:['umbria','norte'],solana:['solana','sur']};
const equivalentes=v=>EQUIV[norm(v)]||[norm(v)];
// palabras del enunciado → dibujo que debe mostrar la pregunta
const PALABRAS={plano:'.calles,.edificio',mapa:'.mapa,.mapas-tipos,.planisferio',globo:'.globo,.representaciones',planisferio:'.planisferio,.representaciones',
  dibujo:'svg',dibujos:'svg','árbol':'.arboles','árboles':'.arboles','brújula':'.rosa',isla:'.mapa,.mapas-tipos','estrella polar':'.horizonte',montaña:'.monte',letra:'svg',letras:'svg'};
const CARD=['norte','este','sur','oeste'];const gira=(c,n)=>CARD[(CARD.indexOf(c)+n+4)%4];
function estacionDe(ddmm){const [d,m]=ddmm.split('-').map(Number);const k=m*100+d;
  if(k>=1221||k<321)return 'invierno';if(k<621)return 'primavera';if(k<922)return 'verano';return 'otono';}
const respuestaDe=f=>{const g=f.querySelector('.grupo');const i=f.querySelector('input[data-r]');return g?g.dataset.r:i?i.dataset.r:null;};
const huecosDe=f=>f.querySelectorAll('.grupo,input[data-r]').length;

for(const f of examenes.sort()){
  const rel=path.relative(raiz,f);console.log(rel);
  const html=fs.readFileSync(f,'utf8').replace(/<script src="[^"]*"><\/script>/g,'');
  const abrir=()=>{const dom=new JSDOM(html,{url:'https://x.test/noatests/'+rel.replace('index.html',''),runScripts:'outside-only',pretendToBeVisual:true});
    const w=dom.window;const store={};
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length;}}});
    w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.requestAnimationFrame=()=>0;w.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},save(){},restore(){},translate(){},rotate(){}});
    w.eval(fs.readFileSync(path.join(raiz,'sociales/dibujos.js'),'utf8'));w.eval(fs.readFileSync(path.join(raiz,'comun/examen.js'),'utf8'));return w;};
  let w;try{w=abrir();}catch(e){fallo('no carga: '+e.message);continue;}
  const d=w.document;const preguntas=[...d.querySelectorAll('.pregunta')];const S=w.noatestsSociales;
  if(preguntas.length!==10)fallo('tiene '+preguntas.length+' preguntas, no 10');
  // enlaces a los scripts con versión
  (fs.readFileSync(f,'utf8').match(/<(?:script src|link rel="stylesheet" href)="[^"]+"/g)||[]).forEach(s=>{if(!/sw-registro/.test(s)&&!/\?v=\d+"/.test(s))fallo('enlace sin versión: '+s);});
  let nLetras=0,nDerivadas=0;
  preguntas.forEach((q,i)=>{
    const P='pregunta '+(i+1)+': ';
    if(!TIPOS.includes(q.dataset.tipo))fallo(P+'tipo desconocido "'+q.dataset.tipo+'"');
    const h2=(q.querySelector('h2')?.textContent||'').toLowerCase();
    if(!q.dataset.sinDibujo)for(const p in PALABRAS){if(new RegExp('(^|[^a-záéíóúñ])'+p+'($|[^a-záéíóúñ])').test(h2)&&!q.querySelector(PALABRAS[p]))fallo(P+'el enunciado habla de "'+p+'" y no lo muestra');}
    // --- letras: mapa letra → valor ---
    const mapa={};
    q.querySelectorAll(DIBUJOS.join(',')).forEach(div=>{
      const sel=DIBUJOS.find(s=>div.matches(s));const svg=div.querySelector('svg');
      if(!svg){fallo(P+sel+' no se ha dibujado');return;}
      const enSvg=[...svg.querySelectorAll('g.letra text')].map(t=>t.textContent);
      const ls=(div.dataset.letras||'').split(';').filter(Boolean).map(p=>p.split('=').map(x=>x.trim()));
      ls.forEach(([L,v])=>{
        if(VALORES[sel]&&!VALORES[sel].includes(norm(v)))fallo(P+sel+': valor "'+v+'" no válido');
        if(!enSvg.includes(L))fallo(P+sel+': la letra '+L+' no aparece en el dibujo');
        if(mapa[L])fallo(P+'la letra '+L+' está repetida');mapa[L]=v;});
      if(sel==='.horizonte'){
        const pos={};(div.dataset.pos||'').split(';').filter(Boolean).forEach(p=>{const [L,v]=p.split('=').map(x=>x.trim());pos[L]=norm(v);if(!enSvg.includes(L))fallo(P+'horizonte: falta la letra '+L);});
        const en=pos[div.dataset.en];if(!en){fallo(P+'horizonte: data-en no es una letra del dibujo');return;}
        const card={amanecer:'este',atardecer:'oeste',polar:'norte'}[div.dataset.astro];if(!card){fallo(P+'horizonte: astro desconocido');return;}
        const frente=en==='centro'?card:en==='izquierda'?gira(card,1):gira(card,-1);
        for(const L in pos){if(mapa[L])fallo(P+'la letra '+L+' está repetida');mapa[L]={izquierda:gira(frente,-1),centro:frente,derecha:gira(frente,1)}[pos[L]];}
        if(div.dataset.astro!=='polar'&&!svg.querySelector('circle[fill="#f7d21c"]'))fallo(P+'horizonte: no se ve el sol');
      }
      if(sel==='.calles'){
        const nl=(div.dataset.edificios||'').split(';').filter(x=>/,letra,/.test(x)).length;if(enSvg.length!==nl)fallo(P+'calles: '+enSvg.length+' letras dibujadas y '+nl+' declaradas');
        const ch=div.dataset.callesH.split('|'),cv=div.dataset.callesV.split('|');
        if(ch.length!==+div.dataset.rows+1||cv.length!==+div.dataset.cols+1)fallo(P+'calles: número de calles incorrecto');
      }
      if(sel!=='.horizonte'&&sel!=='.calles'&&enSvg.length!==ls.length)fallo(P+sel+': '+enSvg.length+' letras dibujadas y '+ls.length+' declaradas');
    });
    // --- filas ---
    q.querySelectorAll('.fila,label').forEach(fi=>{
      const t=fi.textContent.replace(/\s+/g,' ').trim();const r=respuestaDe(fi);
      const comprobar=(esperado,que)=>{nDerivadas++;if(r==null){fallo(P+'"'+t.slice(0,50)+'" no tiene hueco');return;}if(!esperado.map(norm).includes(norm(r)))fallo(P+que+': la respuesta es "'+r+'" y según el dibujo debería ser "'+esperado.join('" o "')+'"');};
      const b=[...fi.querySelectorAll('b')].find(x=>/^[A-Z]$/.test(x.textContent.trim()));
      if(b){const L=b.textContent.trim();nLetras++;if(huecosDe(fi)!==1)fallo(P+'la fila de la letra '+L+' debe tener un solo hueco');
        if(!(L in mapa))fallo(P+'pregunta por la letra '+L+' y no está en el dibujo');else comprobar(equivalentes(mapa[L]),'letra '+L);}
      if(fi.dataset.fecha)comprobar([estacionDe(fi.dataset.fecha)],'fecha '+fi.dataset.fecha);
      if(fi.dataset.mirando){const F=fi.dataset.mirando,B=fi.dataset.busca;comprobar([{0:'delante',1:'derecha',2:'espalda',3:'izquierda'}[(CARD.indexOf(B)-CARD.indexOf(F)+4)%4]],'mirando al '+F);}
      // plano de calles
      const cal=q.querySelector('.calles');
      if(cal&&(fi.dataset.bloque||fi.dataset.desde)){
        const ch=cal.dataset.callesH.split('|').map(norm),cv=cal.dataset.callesV.split('|').map(norm);
        const ed={};cal.dataset.edificios.split(';').filter(Boolean).forEach(p=>{const [rr,cc,tipo,nombre]=p.split(',');ed[rr+','+cc]=tipo==='letra'?nombre:(nombre||S.EDIF[tipo]);});
        if(fi.dataset.bloque){const [rr,cc]=fi.dataset.bloque.split(',').map(Number);if(!ed[rr+','+cc])fallo(P+'la manzana '+fi.dataset.bloque+' está vacía');else comprobar([ed[rr+','+cc]],'manzana '+fi.dataset.bloque);
          const tn=norm(t);const alrededor=[ch[rr],ch[rr+1],cv[cc],cv[cc+1]];
          const nombres=ch.concat(cv).filter(n=>n);const citadas=nombres.filter(n=>tn.includes(n.replace(/^calle /,'')));
          citadas.forEach(n=>{if(!alrededor.includes(n))fallo(P+'cita la '+n+' y no rodea la manzana '+fi.dataset.bloque);});
          for(const [dir,calle] of [['norte',ch[rr+1]],['sur',ch[rr]],['este',cv[cc]],['oeste',cv[cc+1]]]){const m=tn.match(new RegExp('al '+dir+' de (?:la |el )?((?:calle|avenida) [a-z]+)'));if(m&&m[1]!==calle)fallo(P+'dice "al '+dir+' de '+m[1]+'" pero la manzana está al '+dir+' de '+calle);}
          if(!citadas.length)fallo(P+'la fila de la manzana '+fi.dataset.bloque+' no cita ninguna calle');}
        if(fi.dataset.desde){const [r1,c1]=fi.dataset.desde.split(',').map(Number),[r2,c2]=fi.dataset.hacia.split(',').map(Number);
          if(r1!==r2&&c1!==c2)fallo(P+'origen y destino en diagonal: la respuesta no sería un solo punto cardinal');
          else comprobar([r2<r1?'norte':r2>r1?'sur':c2>c1?'este':'oeste'],'dirección '+fi.dataset.desde+' → '+fi.dataset.hacia);
          const tn=norm(t);if(!tn.includes(norm(ed[r1+','+c1]))||!tn.includes(norm(ed[r2+','+c2])))fallo(P+'la fila no nombra "'+ed[r1+','+c1]+'" y "'+ed[r2+','+c2]+'"');}
      }
      // plano del hospital
      const edi=q.querySelector('.edificio');
      if(edi&&fi.dataset.sala){const bl=edi.dataset.bloques.split(';').map(p=>p.split(':')).find(([,s])=>s.split('|').map(norm).includes(norm(fi.dataset.sala)));
        if(!bl)fallo(P+'la sala '+fi.dataset.sala+' no está en el plano');else{
          if(!norm(t).includes(norm(fi.dataset.sala)))fallo(P+'la fila no nombra la sala '+fi.dataset.sala);
          const puertas={};edi.dataset.puertas.split(';').forEach(p=>{const [x,n]=p.split('=');puertas[x.trim()]=n.trim();});
          const r0=respuestaDe(fi);if(/^bloque/i.test(r0))comprobar(['Bloque '+bl[0].trim()],'bloque de '+fi.dataset.sala);else if(/^puerta/i.test(r0))comprobar(['Puerta '+puertas[bl[0].trim()]],'puerta de '+fi.dataset.sala);else fallo(P+'respuesta del hospital sin bloque ni puerta');}}
      // mapa del tiempo
      const mt=q.querySelector('.mapa[data-tiempo]');
      if(mt&&(fi.dataset.zona||fi.dataset.tiempo)){const tz={};mt.dataset.tiempo.split(';').forEach(p=>{const [z,v]=p.split('=');tz[z.trim()]=v.trim();});
        if(fi.dataset.zona)comprobar([S.TIEMPOS[tz[fi.dataset.zona]]],'tiempo en el '+fi.dataset.zona);
        if(fi.dataset.tiempo){const zs=Object.keys(tz).filter(z=>tz[z]===fi.dataset.tiempo);if(zs.length!==1)fallo(P+'"'+fi.dataset.tiempo+'" sale en '+zs.length+' zonas: la pregunta no tiene una sola respuesta');else comprobar(zs,'dónde hay '+fi.dataset.tiempo);}}
    });
    // opciones: la respuesta está entre ellas y no hay dos iguales (sin tildes ni mayúsculas)
    q.querySelectorAll('.grupo').forEach(g=>{const ops=[...g.querySelectorAll('.opcion')].map(o=>norm(o.textContent));if(!ops.includes(norm(g.dataset.r)))fallo(P+'la respuesta "'+g.dataset.r+'" no está entre las opciones');if(new Set(ops).size!==ops.length)fallo(P+'opciones repetidas: '+ops.join(' / '));});
    q.querySelectorAll('input[data-r]').forEach(inp=>{if(!inp.dataset.r.trim())fallo(P+'hueco sin respuesta');});
  });
  d.querySelectorAll('input[type=text]').forEach(i=>{if(i.getAttribute('autocorrect')!=='off'||i.getAttribute('spellcheck')!=='false'||i.getAttribute('autocomplete')!=='off')fallo('campo de texto con autocorrector activo');});
  // todo bien → 10; una mal → menos de 10
  const rellenar=(d,fallar)=>{d.querySelectorAll('input[data-r]').forEach(i=>i.value=i.dataset.r);
    d.querySelectorAll('.grupo').forEach((g,k)=>{const ops=[...g.querySelectorAll('.opcion')];const o=k===fallar?ops.find(o=>norm(o.textContent)!==norm(g.dataset.r)):ops.find(o=>norm(o.textContent)===norm(g.dataset.r));if(o)o.click();});
    d.getElementById('corregir').click();return d.getElementById('r-nota').textContent;};
  const nota=rellenar(d,-1);
  if(!nota.startsWith('10,00'))fallo('con todo correcto da '+nota);
  const w2=abrir();const nota2=rellenar(w2.document,0);if(nota2.startsWith('10,00'))fallo('con una respuesta mal sigue dando 10');
  if(!errores)console.log('  ✓ 10,00 · '+d.getElementById('r-sub').textContent+' · dibujos: '+d.querySelectorAll('.pregunta svg').length+' · '+nLetras+' letras y '+nDerivadas+' respuestas comprobadas con el dibujo');
}
if(errores){console.error('\n'+errores+' error(es)');process.exit(1);}else console.log('\nTodo correcto ('+examenes.length+' exámenes de sociales).');
