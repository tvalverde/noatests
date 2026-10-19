/* Comprueba todos los exámenes de matemáticas:
   - con las respuestas correctas se obtiene 10,00
   - cada pregunta tiene data-tipo
   - si el enunciado menciona un dibujo (bloques, plano, recta, tarjetas, bloques...) la pregunta lo contiene
   - todos los dibujos se pintan sin errores
   Uso: node tests/run.js  (necesita jsdom: npm install) */
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const raiz=path.join(__dirname,'..');
const examenes=[];
(function busca(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())busca(p);else if(e.name==='index.html'&&/matematicas\/.*\/examen\d+\/index\.html$/.test(p))examenes.push(p);}})(path.join(raiz,'matematicas'));
let errores=0;const fallo=m=>{console.error('  ✗ '+m);errores++;};
// Palabra del enunciado → dibujo que debe tener la pregunta
const PALABRAS={bloques:'.bloques',cubo:'.bloques',cubos:'.bloques',placa:'.bloques',placas:'.bloques',barra:'.bloques',barras:'.bloques',cubitos:'.bloques',
  torre:'.tapones',torres:'.tapones',caja:'.tapones',cajas:'.tapones',bolsita:'.tapones',bolsitas:'.tapones',tapones:'.tapones',
  plano:'.plano,.grid',recta:'.recta',tarjetas:'.tarjetas',cuadrícula:'.grid',dibujo:'svg,.grid',gota:'.figuras,.grid',casita:'.figuras,.grid',corazón:'.figuras,.grid',
  muro:'.tabla-posiciones,.fila',tabla:'.tabla-posiciones,table',montañas:'.barras',alturas:'.barras',distancias:'.barras'};
const num=v=>Number(String(v).replace(/\./g,'').replace(',','.'));
// Números citados en un texto (con punto de millar o sin él)
const numerosDe=t=>[...t.matchAll(/\d{1,3}(?:\.\d{3})+|\d+/g)].map(m=>num(m[0]));
for(const f of examenes.sort()){
  const rel=path.relative(raiz,f);console.log(rel);
  const html=fs.readFileSync(f,'utf8').replace(/<script src="[^"]*"><\/script>/g,'');
  const dom=new JSDOM(html,{url:'https://x.test/'+rel.replace('index.html',''),runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;const store={};
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length;}}});
  w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.requestAnimationFrame=()=>0;w.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},save(){},restore(){},translate(){},rotate(){}});
  try{w.eval(fs.readFileSync(path.join(raiz,'matematicas/dibujos.js'),'utf8'));}catch(e){fallo('dibujos.js: '+e.message);}
  try{w.eval(fs.readFileSync(path.join(raiz,'matematicas/examen.js'),'utf8'));}catch(e){fallo('examen.js: '+e.message);continue;}
  const d=w.document;const preguntas=[...d.querySelectorAll('.pregunta')];
  if(preguntas.length!==10)fallo('tiene '+preguntas.length+' preguntas, no 10');
  preguntas.forEach((q,i)=>{
    if(!q.dataset.tipo)fallo('pregunta '+(i+1)+' sin data-tipo');
    const texto=q.textContent.toLowerCase();
    for(const p in PALABRAS){if(new RegExp('\\b'+p+'\\b').test(texto)&&!q.querySelector(PALABRAS[p]))fallo('pregunta '+(i+1)+' menciona "'+p+'" pero no lo muestra');}
    // --- coherencia entre enunciado y dibujo ---
    const enun=(q.querySelector('h2')?.textContent||'').toLowerCase();
    const enunNums=numerosDe(enun);
    const datosDibujo=[...q.querySelectorAll('.bloques,.tapones,.recta,.tarjetas,.plano,.figuras,.barras,.tabla-posiciones,.grid')].map(e=>Object.values(e.dataset).join(' ')).join(' ');
    const dibNums=numerosDe(datosDibujo);
    // tapones: los recuentos del enunciado deben coincidir con el dibujo
    const tap=q.querySelector('.tapones');
    if(tap){for(const [pal,attr] of [['torre','torres'],['caja','cajas'],['bolsita','bolsas']]){const m=enun.match(new RegExp('(?<!(?:son|tiene|caben|de|hay) )\\b(\\d+)\\s+'+pal+'s?\\b'));if(m&&+m[1]!==+tap.dataset[attr])fallo('pregunta '+(i+1)+': el enunciado dice '+m[1]+' '+pal+'(s) y el dibujo tiene '+tap.dataset[attr]);}}
    const blo=q.querySelector('.bloques');
    if(blo){for(const [pal,attr] of [['cubo','um'],['placa','c'],['barra','d'],['cubito','u']]){const m=enun.match(new RegExp('(?<!(?:son|tiene|caben|de|hay) )\\b(\\d+)\\s+'+pal+'s?\\b'));if(m&&+m[1]!==+blo.dataset[attr])fallo('pregunta '+(i+1)+': el enunciado dice '+m[1]+' '+pal+'(s) y el dibujo tiene '+blo.dataset[attr]);}}
    // rectas: un número citado como "el punto es N" / "vale N" / "de N en N" debe estar en la recta
    q.querySelectorAll('.recta').forEach(r=>{
      const paso=num(r.dataset.paso),min=num(r.dataset.min),max=num(r.dataset.max);
      const pasos=[...enun.matchAll(/de (\d{1,3}(?:\.\d{3})*) en \1/g)].map(m=>num(m[1]));if(pasos.length&&!pasos.includes(paso))fallo('pregunta '+(i+1)+': el enunciado habla de rectas de '+pasos.join('/')+' y hay una recta de '+paso+' en '+paso);
      const mMarca=enun.match(/cada marca vale (\d{1,3}(?:\.\d{3})*)/);if(mMarca&&num(mMarca[1])!==paso)fallo('pregunta '+(i+1)+': "cada marca vale '+mMarca[1]+'" pero el paso es '+paso);
      const mPunto=enun.match(/punto (?:naranja )?es (\d{1,3}(?:\.\d{3})*)/);if(mPunto){const v=num(mPunto[1]);const ps=(r.dataset.puntos||'').split(/[;,](?=\s*\d{1,3}(?:\.\d{3})*\s*(?:[;,]|$))/).map(num);if(!ps.includes(v))fallo('pregunta '+(i+1)+': el enunciado dice que el punto es '+v+' pero la recta no lo marca');}
      (r.dataset.letras||'').split(';').filter(Boolean).forEach(p=>{const v=num(p.split('=')[1]);if(v<min||v>max)fallo('pregunta '+(i+1)+': la letra '+p+' está fuera de la recta');});
    });
    // planos: la sala y la dirección que dice el enunciado deben coincidir con la persona dibujada
    q.querySelectorAll('.plano').forEach(pl=>{
      if(!pl.dataset.persona)return;const [pr,pc,dir]=pl.dataset.persona.split(',');
      const mDir=enun.match(/mirando hacia (arriba|abajo|la derecha|la izquierda|derecha|izquierda)/);
      if(mDir){const d=mDir[1].replace('la ','');if(d!==dir)fallo('pregunta '+(i+1)+': el enunciado dice mirando hacia '+d+' y Lucía mira hacia '+dir);}
      const salas=pl.dataset.salas.split(';').map(x=>x.split(','));const salaPersona=salas.find(x=>x[0]===pr&&x[1]===pc);
      const mSala=enun.match(/est[áa] en (?:la |el )?([a-záéíóúñ ]+?)(?: mirando|\.|,| y | del plano)/);
      if(mSala&&salaPersona&&!mSala[1].trim().includes(salaPersona[2].toLowerCase().replace(/^(sala|aula) /,''))&&!salaPersona[2].toLowerCase().includes(mSala[1].trim().replace(/^(sala|aula) /,'')))fallo('pregunta '+(i+1)+': el enunciado sitúa a Lucía en "'+mSala[1].trim()+'" pero está dibujada en "'+salaPersona[2]+'"');
    });
    // cuadrícula: los movimientos del enunciado deben llevar del origen al destino
    const g=q.querySelector('.grid');
    if(g){const [sr,sc]=g.dataset.start.split(',').map(Number);const [dr,dc]=g.dataset.dest.split(',').map(Number);
      let r=sr,c=sc;const mov=[...enun.matchAll(/(\d+)\s+(?:casillas?\s+)?(?:a la |hacia (?:la )?|hacia )?(derecha|izquierda|arriba|abajo)\b/g)];
      mov.forEach(m=>{const n=+m[1];({derecha:()=>c+=n,izquierda:()=>c-=n,arriba:()=>r-=n,abajo:()=>r+=n})[m[2]]?.();});
      if(mov.length&&(r!==dr||c!==dc))fallo('pregunta '+(i+1)+': siguiendo los movimientos del enunciado se llega a ('+r+','+c+') pero el destino es ('+dr+','+dc+')');
      if(dr<0||dr>5||dc<0||dc>5)fallo('pregunta '+(i+1)+': el destino se sale de la cuadrícula');}
    // tarjetas: si el enunciado cita el número formado, debe ser la suma de las tarjetas
    q.querySelectorAll('.tarjetas').forEach(t=>{const vals=t.dataset.valores.split(',');if(vals.every(v=>/^[\d.]+$/.test(v.trim()))){const suma=vals.reduce((a,v)=>a+num(v),0);const inp=[...q.querySelectorAll('input[data-r]')].find(x=>num(x.dataset.r)===suma);if(!inp&&!enunNums.includes(suma)&&![...q.querySelectorAll('.grupo')].some(gr=>num(gr.dataset.r)===suma))fallo('pregunta '+(i+1)+': las tarjetas suman '+suma+' pero ese número no aparece en ninguna respuesta');}});
    // cada hueco lleva respuesta
    q.querySelectorAll('input[data-r]').forEach(inp=>{if(!inp.dataset.r.trim())fallo('pregunta '+(i+1)+': hueco sin respuesta');});
    q.querySelectorAll('.grupo').forEach(g=>{const ok=[...g.querySelectorAll('.opcion')].some(o=>o.textContent.trim().toLowerCase()===g.dataset.r.toLowerCase());if(!ok)fallo('pregunta '+(i+1)+': la respuesta "'+g.dataset.r+'" no está entre las opciones');});
  });
  // ningún campo de texto con autocorrector
  d.querySelectorAll('input[type=text]').forEach(i=>{if(i.getAttribute('autocorrect')!=='off'||i.getAttribute('spellcheck')!=='false'||!['off','new-password'].includes(i.getAttribute('autocomplete'))||i.getAttribute('autocapitalize')!=='off')fallo('campo de texto con autocorrector activo');});
  // rellenar todo bien y entregar
  d.querySelectorAll('input[data-r]').forEach(i=>i.value=i.dataset.r);
  d.querySelectorAll('.grupo').forEach(g=>{const o=[...g.querySelectorAll('.opcion')].find(o=>o.textContent.trim().toLowerCase()===g.dataset.r.toLowerCase());if(o)o.click();});
  const grid=d.querySelector('.grid');if(grid){const [r,c]=grid.dataset.dest.split(',');const cel=d.querySelector(`.celda[data-r="${r}"][data-c="${c}"]`);if(cel)cel.click();else fallo('la casilla destino de la cuadrícula no existe');}
  d.getElementById('corregir').click();
  const nota=d.getElementById('r-nota').textContent;
  if(!nota.startsWith('10,00'))fallo('con todo correcto da '+nota);else console.log('  ✓ 10,00 · '+d.getElementById('r-sub').textContent+' · dibujos: '+d.querySelectorAll('svg').length);
}
if(errores){console.error('\n'+errores+' error(es)');process.exit(1);}else console.log('\nTodo correcto ('+examenes.length+' exámenes).');
