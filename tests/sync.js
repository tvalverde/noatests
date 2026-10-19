/* Prueba la sincronización con un Supabase simulado (sin red). */
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const raiz=path.join(__dirname,'..');let errores=0;const fallo=m=>{console.error('  ✗ '+m);errores++;};
const CODIGO='noa-test-0000-0000-0000';
// servidor simulado: guarda intentos en memoria
const nube={intentos:[]};let red=true;const llamadas=[];
function servidor(nombre,p){
  llamadas.push(nombre);
  if(!red)throw new Error('sin red');
  if(nombre==='comprobar_codigo')return p.codigo===CODIGO?'Familia Test':null;
  if(p.codigo!==CODIGO)return nombre==='guardar_intento'?false:[];
  if(nombre==='guardar_intento'){const i=nube.intentos.findIndex(x=>x.examen===p.p_examen&&x.fecha===p.p_fecha);const fila={examen:p.p_examen,fecha:p.p_fecha,nota1:p.p_nota1,nota_corr:p.p_nota_corr,huecos_bien:p.p_huecos_bien,huecos_total:p.p_huecos_total,tipos:p.p_tipos,respuestas:p.p_respuestas,vio_soluciones:p.p_vio_soluciones};if(i>=0)nube.intentos[i]=fila;else nube.intentos.push(fila);return true;}
  if(nombre==='leer_intentos')return nube.intentos.filter(x=>!p.p_examen||x.examen===p.p_examen).map(x=>Object.assign({},x,{respuestas:p.p_examen?x.respuestas:null}));
}
function abrir(rel,store){
  const html=fs.readFileSync(path.join(raiz,rel),'utf8').replace(/<script src="[^"]*sw-registro\.js"><\/script>/,'');
  const url='https://x.test/noatests/'+rel.replace(/index\.html$/,'');
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length;}}});
  Object.defineProperty(w.navigator,'onLine',{get:()=>red});
  w.fetch=(u,opt)=>{const s=String(u);if(s.includes('/rpc/')){const nombre=s.split('/rpc/')[1];try{const r=servidor(nombre,JSON.parse(opt.body));return Promise.resolve({ok:true,text:()=>Promise.resolve(JSON.stringify(r))});}catch(e){return Promise.reject(e);}}
    const p=new URL(s,url).pathname.replace(/^\/noatests\//,'');return Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(path.join(raiz,p),'utf8'))),text:()=>Promise.resolve('')});};
  w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.alert=()=>{};w.requestAnimationFrame=()=>0;w.HTMLCanvasElement.prototype.getContext=()=>null;
  [...dom.window.document.querySelectorAll('script[src]')].forEach(sc=>{const p=new URL(sc.getAttribute('src'),url).pathname.replace(/^\/noatests\//,'').replace(/\?.*$/,'');w.eval(fs.readFileSync(path.join(raiz,p),'utf8'));});
  return w;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const EX='matematicas/temas1-2-numeros-y-planos/examen1/index.html';const RUTA='/noatests/matematicas/temas1-2-numeros-y-planos/examen1/';
function rellenarBien(d){d.querySelectorAll('input[data-r]').forEach(i=>i.value=i.dataset.r);d.querySelectorAll('.grupo').forEach(g=>[...g.querySelectorAll('.opcion')].find(o=>o.textContent.trim().toLowerCase()===g.dataset.r.toLowerCase()).click());const g=d.querySelector('.grid');const [r,c]=g.dataset.dest.split(',');d.querySelector(`.celda[data-r="${r}"][data-c="${c}"]`).click();}
(async()=>{
  console.log('sync');
  // A) dispositivo sin código: entregar no llama a la nube
  const A={};let w=abrir(EX,A);await wait(50);let d=w.document;rellenarBien(d);d.querySelectorAll('input[data-r]')[0].value='mal';d.getElementById('corregir').click();await wait(50);
  if(llamadas.length)fallo('sin código se ha llamado a la nube: '+llamadas.join(','));else console.log('  ✓ sin código no se envía nada');
  // B) conectar el dispositivo A desde Mis notas con código malo y bueno
  w=abrir('notas/index.html',A);await wait(80);d=w.document;
  const malo=await w.noatestsSync.conectar('otro');if(malo!==null)fallo('un código inválido ha conectado');
  const nombre=await w.noatestsSync.conectar(CODIGO);if(nombre!=='Familia Test')fallo('conectar devolvió '+nombre);
  if(nube.intentos.length!==1||nube.intentos[0].examen!==RUTA)fallo('al conectar no se subió el intento local: '+JSON.stringify(nube.intentos));else console.log('  ✓ conectar rechaza código malo, acepta el bueno y sube lo local ('+nube.intentos[0].nota1+')');
  // C) en A, corregir: se actualiza en la nube
  w=abrir(EX,A);await wait(80);d=w.document;
  d.getElementById('b-corregir').click();d.querySelectorAll('input[data-r]')[0].value=d.querySelectorAll('input[data-r]')[0].dataset.r;d.getElementById('corregir').click();await wait(50);
  if(nube.intentos[0].nota_corr!==10)fallo('la corrección no llegó a la nube: '+JSON.stringify(nube.intentos[0]));else console.log('  ✓ la corrección se sube (nota_corr=10)');
  // D) sin red: nuevo intento queda en cola; al volver la red se envía
  red=false;w=abrir(EX,A);await wait(80);d=w.document;d.getElementById('b-reintentar').click();
  w=abrir(EX,A);await wait(80);d=w.document;rellenarBien(d);d.getElementById('corregir').click();await wait(50);
  if(w.noatestsSync.pendientes()!==1||nube.intentos.length!==1)fallo('sin red debería quedar 1 pendiente: pendientes='+w.noatestsSync.pendientes()+' nube='+nube.intentos.length);
  red=true;w.dispatchEvent(new w.Event('online'));await wait(50);
  if(w.noatestsSync.pendientes()!==0||nube.intentos.length!==2)fallo('al volver la red no se vació la cola: pendientes='+w.noatestsSync.pendientes()+' nube='+nube.intentos.length);else console.log('  ✓ sin red se encola y al volver la red se envía');
  // E) dispositivo B nuevo: conecta y ve las notas de A en Mis notas; el examen aparece hecho
  const B={};w=abrir('notas/index.html',B);await wait(80);await w.noatestsSync.conectar(CODIGO);
  w=abrir('notas/index.html',B);await wait(120);d=w.document;
  const fila=[...d.querySelectorAll('tr')].find(tr=>/Examen 1/.test(tr.textContent));
  if(!fila||!/10,00/.test(fila.textContent)||!/2 intentos/.test(fila.textContent))fallo('en el dispositivo B no se ven los 2 intentos de A: '+(fila&&fila.textContent.replace(/\s+/g,' ')));else console.log('  ✓ otro dispositivo ve los intentos (10,00, 2 intentos)');
  const nubeCaja=d.getElementById('btn-sync');if(!nubeCaja)fallo('falta la caja de nube conectada en Mis notas');
  // F) en B, abrir el examen: aparece la caja de resultado del intento de A (sin poder corregir, sin respuestas)
  w=abrir(EX,B);await wait(120);d=w.document;
  if(!d.getElementById('velo').classList.contains('visible')||!/10,00/.test(d.getElementById('r-nota').textContent))fallo('en B el examen no muestra el resultado venido de A');else console.log('  ✓ en otro dispositivo el examen muestra el último resultado');
  // G) reimportar no duplica
  const antes=JSON.parse(B['noatests-mates:'+RUTA+':historial']).length;await w.noatestsSync.bajar();const despues=JSON.parse(B['noatests-mates:'+RUTA+':historial']).length;
  if(antes!==despues||antes!==2)fallo('bajar dos veces duplica: '+antes+' → '+despues);else console.log('  ✓ bajar de nuevo no duplica');
  if(errores){console.error('\n'+errores+' error(es)');process.exit(1);}else console.log('\nSincronización correcta.');
})();
