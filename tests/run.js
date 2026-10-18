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
const PALABRAS={bloques:'.bloques',plano:'.plano,.grid',recta:'.recta',tarjetas:'.tarjetas',tapones:'.tapones',cuadrícula:'.grid',dibujo:'svg,.grid',gota:'.figuras,.grid',muro:'.tabla-posiciones,.fila'};
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
    // cada hueco lleva respuesta
    q.querySelectorAll('input[data-r]').forEach(inp=>{if(!inp.dataset.r.trim())fallo('pregunta '+(i+1)+': hueco sin respuesta');});
    q.querySelectorAll('.grupo').forEach(g=>{const ok=[...g.querySelectorAll('.opcion')].some(o=>o.textContent.trim().toLowerCase()===g.dataset.r.toLowerCase());if(!ok)fallo('pregunta '+(i+1)+': la respuesta "'+g.dataset.r+'" no está entre las opciones');});
  });
  // rellenar todo bien y entregar
  d.querySelectorAll('input[data-r]').forEach(i=>i.value=i.dataset.r);
  d.querySelectorAll('.grupo').forEach(g=>{const o=[...g.querySelectorAll('.opcion')].find(o=>o.textContent.trim().toLowerCase()===g.dataset.r.toLowerCase());if(o)o.click();});
  const grid=d.querySelector('.grid');if(grid){const [r,c]=grid.dataset.dest.split(',');const cel=d.querySelector(`.celda[data-r="${r}"][data-c="${c}"]`);if(cel)cel.click();else fallo('la casilla destino de la cuadrícula no existe');}
  d.getElementById('corregir').click();
  const nota=d.getElementById('r-nota').textContent;
  if(!nota.startsWith('10,00'))fallo('con todo correcto da '+nota);else console.log('  ✓ 10,00 · '+d.getElementById('r-sub').textContent+' · dibujos: '+d.querySelectorAll('svg').length);
}
if(errores){console.error('\n'+errores+' error(es)');process.exit(1);}else console.log('\nTodo correcto ('+examenes.length+' exámenes).');
