/* Comprueba catalogo.json contra las carpetas, y que las listas y Mis notas se pintan bien. */
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const raiz=path.join(__dirname,'..');let errores=0;const fallo=m=>{console.error('  ✗ '+m);errores++;};
const cat=JSON.parse(fs.readFileSync(path.join(raiz,'catalogo.json'),'utf8'));

console.log('arts');
{const h=fs.readFileSync(path.join(raiz,'arts/examen1/index.html'),'utf8');const ins=h.match(/<input[^>]*type="text"[^>]*>/g)||[];ins.forEach(i=>{if(!/autocorrect="off"/.test(i)||!/spellcheck="false"/.test(i)||!/autocomplete="off"/.test(i))fallo('arts: campo de texto con autocorrector: '+i);});if(!errores)console.log('  ✓ '+ins.length+' campos sin autocorrector');}
console.log('catalogo.json');
const enCat=new Set();
cat.materias.forEach(m=>{
  if(!fs.existsSync(path.join(raiz,m.id,'index.html')))fallo('materia '+m.id+' sin index.html');
  m.temas.forEach(t=>{
    const dirT=t.id?path.join(raiz,m.id,t.id):path.join(raiz,m.id);
    if(t.id&&!fs.existsSync(path.join(dirT,'index.html')))fallo('tema '+m.id+'/'+t.id+' sin index.html');
    t.examenes.forEach(e=>{const p=path.join(dirT,e.id,'index.html');enCat.add(p);if(!fs.existsSync(p))fallo('examen '+m.id+'/'+t.id+'/'+e.id+' no existe en disco');if(!e.nombre||!e.descripcion)fallo('examen '+e.id+' sin nombre o descripción');});
  });
});
// exámenes en disco que no están en el catálogo
(function busca(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,x.name);if(x.isDirectory()&&!['node_modules','.git','tests','notas'].includes(x.name))busca(p);else if(x.name==='index.html'&&/\/examen\d+\/index\.html$/.test(p)&&!enCat.has(p))fallo('examen en disco sin dar de alta en el catálogo: '+path.relative(raiz,p));}})(raiz);
if(!errores)console.log('  ✓ catálogo y carpetas coinciden');

// --- simulación de navegador con fetch del catálogo y localStorage ---
function abrir(rel,store){
  const html=fs.readFileSync(path.join(raiz,rel),'utf8').replace(/<script src="[^"]*sw-registro\.js"><\/script>/,'');
  const url='https://x.test/noatests/'+rel.replace(/index\.html$/,'');
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length;}}});
  w.fetch=u=>{const p=new URL(u,url).pathname.replace(/^\/noatests\//,'');return Promise.resolve({json:()=>Promise.resolve(JSON.parse(fs.readFileSync(path.join(raiz,p),'utf8')))});};
  [...dom.window.document.querySelectorAll('script[src]')].forEach(s=>{const p=new URL(s.getAttribute('src'),url).pathname.replace(/^\/noatests\//,'').replace(/\?.*$/,'');w.eval(fs.readFileSync(path.join(raiz,p),'utf8'));});
  return new Promise(res=>setTimeout(()=>res(w.document),50));
}
// datos como los guarda examen.js (formato actual) + uno antiguo sin 'titulo' ni 'tipos'
const R='/noatests/matematicas/temas1-2-numeros-y-planos/';
const store={
  ['noatests-mates:'+R+'examen1/']:JSON.stringify({fecha:'2026-10-18T10:00:00Z',nota1:9.5,notaCorr:null,respuestas:{}}),
  ['noatests-mates:'+R+'examen1/:historial']:JSON.stringify([{fecha:'2026-10-17T10:00:00Z',nota1:7,notaCorr:8.5},{fecha:'2026-10-18T10:00:00Z',nota1:9.5,notaCorr:null,tipos:{recta:{bien:3,total:4},plano:{bien:1,total:1}}}]),
  ['noatests-mates:'+R+'examen3/']:JSON.stringify({fecha:'2026-10-18T12:00:00Z',titulo:'Examen 3 · Matemáticas',nota1:6.5,notaCorr:8.75,tipos:{redondear:{bien:1,total:3}},respuestas:{}}),
  ['noatests-mates:'+R+'examen3/:historial']:JSON.stringify([{fecha:'2026-10-18T12:00:00Z',nota1:6.5,notaCorr:8.75,tipos:{redondear:{bien:1,total:3}}}]),
  'noatests-arts-examen1':JSON.stringify([{img:'data:x',nombre:'Pepe'},null,null,null,null]),
};
(async()=>{
  console.log('listas');
  let d=await abrir('index.html',store);
  const port=[...d.querySelectorAll('a.examen')].map(a=>a.textContent.split('\n')[0].trim());
  if(port.length<3||!d.querySelector('a[href="matematicas/"]')||!d.querySelector('a[href="notas/"]'))fallo('portada: faltan tarjetas: '+port.join(' | '));else console.log('  ✓ portada: '+d.querySelectorAll('a.examen').length+' tarjetas');
  d=await abrir('matematicas/index.html',store);
  const tm=d.querySelector('a.examen');if(!tm||!/7 exámenes · 2 hechos/.test(tm.textContent))fallo('materia: texto del tema incorrecto: '+(tm&&tm.textContent));else console.log('  ✓ materia: '+tm.textContent.replace(/\s+/g,' ').trim());
  d=await abrir('matematicas/temas1-2-numeros-y-planos/index.html',store);
  const ex=[...d.querySelectorAll('a.examen')];if(ex.length!==7)fallo('tema: '+ex.length+' exámenes en vez de 7');
  const n1=d.querySelector('a[href="examen1/"] .nota-lista'),n3=d.querySelector('a[href="examen3/"] .nota-lista'),n2=d.querySelector('a[href="examen2/"] .nota-lista');
  if(!n1||n1.textContent!=='9,50')fallo('tema: nota examen1 = '+(n1&&n1.textContent));
  if(!n3||n3.textContent!=='6,50 → 8,75')fallo('tema: nota examen3 = '+(n3&&n3.textContent));
  if(n2)fallo('tema: examen2 muestra nota sin haberse hecho');
  if(!errores)console.log('  ✓ tema: 7 exámenes, notas 9,50 y 6,50 → 8,75');
  d=await abrir('arts/index.html',store);if(d.querySelectorAll('a.examen').length!==1)fallo('arts: lista incorrecta');

  console.log('Mis notas');
  d=await abrir('notas/index.html',store);
  const secs=[...d.querySelectorAll('section.materia')];
  if(secs.length!==2)fallo('notas: '+secs.length+' materias en vez de 2');
  const mat=secs[0];
  if(!/Matemáticas/.test(mat.querySelector('h2').textContent))fallo('notas: primera materia no es Matemáticas');
  const mediaM=mat.querySelector('h2 .media').textContent;if(!/media 8,00/.test(mediaM))fallo('notas: media de materia = '+mediaM+' (esperado 8,00 = (9,5+6,5)/2)');
  const tema=mat.querySelector('details.tema');if(!tema||!tema.open)fallo('notas: el tema no está abierto');
  const mediaT=tema.querySelector('summary .media').textContent;if(!/media 8,00 · 2 de 7/.test(mediaT))fallo('notas: media del tema = '+mediaT);
  const filas=[...tema.querySelectorAll('tbody tr, table tr')].filter(tr=>tr.querySelector('td'));
  const f1=filas.find(tr=>/Examen 1/.test(tr.textContent)),f3=filas.find(tr=>/Examen 3/.test(tr.textContent)),f2=filas.find(tr=>/Examen 2/.test(tr.textContent));
  if(!f1||!/9,50/.test(f1.textContent)||!/2 intentos/.test(f1.textContent))fallo('notas: fila examen1: '+(f1&&f1.textContent.replace(/\s+/g,' ')));
  if(!f3||!/6,50 → 8,75/.test(f3.textContent))fallo('notas: fila examen3: '+(f3&&f3.textContent.replace(/\s+/g,' ')));
  if(!f2||!f2.classList.contains('sin')||!/sin hacer/.test(f2.textContent))fallo('notas: examen2 debería aparecer como sin hacer');
  const tipos=tema.querySelector('h3');if(!tipos||!/en este tema/.test(tipos.textContent))fallo('notas: falta la tabla de tipos por tema');
  const pct=[...tema.querySelectorAll('td.nota')].map(t=>t.textContent);if(!pct.includes('100%')||!pct.includes('33%'))fallo('notas: porcentajes por tipo incorrectos: '+pct.join(','));
  const arts=secs[1];if(!/Arts/.test(arts.querySelector('h2').textContent)||!/Examen 1/.test(arts.querySelector('.arts').textContent))fallo('notas: sección Arts incorrecta');
  if(!errores)console.log('  ✓ agrupado por materia y tema, medias 8,00, examen sin hacer listado, tipos por tema, Arts sin nota');
  // sin datos
  d=await abrir('notas/index.html',{});
  if(!/sin exámenes hechos/.test(d.body.textContent)||!/sin hacer/.test(d.body.textContent))fallo('notas vacías: no muestra el estado inicial');else console.log('  ✓ sin datos: lista completa en "sin hacer"');
  if(errores){console.error('\n'+errores+' error(es)');process.exit(1);}else console.log('\nCatálogo, listas y Mis notas correctos.');
})();
