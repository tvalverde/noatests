/* Casos límite y esquinas: corrección, formato de números, notas, borrador, corregir/soluciones/reintentar,
   dibujos con datos extremos, Mis notas, exportar/importar y sincronización. Todo con nube simulada, sin red. */
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const raiz=path.join(__dirname,'..');let errores=0,ok=0;
const fallo=m=>{console.error('  ✗ '+m);errores++;};const bien=m=>{console.log('  ✓ '+m);ok++;};
const check=(cond,m)=>cond?bien(m):fallo(m);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const BASE='/noatests/matematicas/temas1-2-numeros-y-planos/';
const EX1='matematicas/temas1-2-numeros-y-planos/examen1/index.html';
const CODIGO='noa-test-0000-0000-0000';

// ---------- nube simulada ----------
function nubeNueva(){return {intentos:[],red:true,fallarHttp:false,llamadas:[]};}
function servidor(nube,nombre,p){
  nube.llamadas.push(nombre);
  if(!nube.red)throw new Error('sin red');
  if(nube.fallarHttp)return {http:500};
  if(nombre==='comprobar_codigo')return p.codigo===CODIGO?'Familia Test':null;
  if(p.codigo!==CODIGO)return nombre==='guardar_intento'?false:[];
  if(nombre==='guardar_intento'){
    if(!/^\/[a-z0-9/_.-]+\/$/.test(p.p_examen))return false;
    const i=nube.intentos.findIndex(x=>x.examen===p.p_examen&&new Date(x.fecha).toISOString()===new Date(p.p_fecha).toISOString());
    const fila={examen:p.p_examen,fecha:p.p_fecha,nota1:p.p_nota1,nota_corr:p.p_nota_corr,huecos_bien:p.p_huecos_bien,huecos_total:p.p_huecos_total,tipos:p.p_tipos,respuestas:p.p_respuestas,vio_soluciones:p.p_vio_soluciones};
    if(i>=0)nube.intentos[i]=fila;else nube.intentos.push(fila);return true;}
  if(nombre==='leer_intentos')return nube.intentos.filter(x=>!p.p_examen||x.examen===p.p_examen).map(x=>Object.assign({},x,{respuestas:p.p_examen?x.respuestas:null}));
  if(nombre==='latido')return new Date().toISOString();
}
// ---------- navegador simulado ----------
function abrir(rel,store,opts={}){
  const nube=opts.nube||nubeNueva();
  const html=fs.readFileSync(path.join(raiz,rel),'utf8').replace(/<script src="[^"]*sw-registro\.js"><\/script>/,'');
  const url='https://x.test/noatests/'+rel.replace(/index\.html$/,'');
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
  if(opts.lsMuerto){Object.defineProperty(w,'localStorage',{get(){throw new Error('SecurityError');}});}
  const ls={getItem:k=>store[k]??null,setItem:(k,v)=>{if(opts.lsRoto)throw new Error('QuotaExceeded');store[k]=String(v);},removeItem:k=>delete store[k],key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length;}};
  if(!opts.lsMuerto)Object.defineProperty(w,'localStorage',{value:ls});
  Object.defineProperty(w.navigator,'onLine',{get:()=>nube.red});
  w.fetch=(u,opt)=>{const s=String(u);if(s.includes('/rpc/')){const nombre=s.split('/rpc/')[1];try{const r=servidor(nube,nombre,JSON.parse(opt.body));if(r&&r.http)return Promise.resolve({ok:false,status:r.http,text:()=>Promise.resolve('')});return Promise.resolve({ok:true,text:()=>Promise.resolve(JSON.stringify(r))});}catch(e){return Promise.reject(e);}}
    const p=new URL(s,url).pathname.replace(/^\/noatests\//,'');return Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(path.join(raiz,p),'utf8'))),text:()=>Promise.resolve('')});};
  w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};w.confirm=()=>opts.confirm!==false;w.alert=m=>{w.__alertas=(w.__alertas||[]).concat(m);};w.requestAnimationFrame=()=>0;w.HTMLCanvasElement.prototype.getContext=()=>null;
  w.__nube=nube;
  [...dom.window.document.querySelectorAll('script[src]')].forEach(sc=>{const p=new URL(sc.getAttribute('src'),url).pathname.replace(/^\/noatests\//,'').replace(/\?.*$/,'');w.eval(fs.readFileSync(path.join(raiz,p),'utf8'));});
  return w;
}
function rellenarBien(d){d.querySelectorAll('input[data-r]').forEach(i=>i.value=i.dataset.r);d.querySelectorAll('.grupo').forEach(g=>[...g.querySelectorAll('.opcion')].find(o=>o.textContent.trim().toLowerCase()===g.dataset.r.toLowerCase()).click());const g=d.querySelector('.grid');if(g){const [r,c]=g.dataset.dest.split(',');d.querySelector(`.celda[data-r="${r}"][data-c="${c}"]`).click();}}
const nota=d=>d.getElementById('r-nota').textContent;
// Diálogo propio del examen: "seguir/cancelar" o "aceptar"
const dialogoVisible=d=>!d.getElementById('dialogo').hidden;
const responder=async(d,boton)=>{d.getElementById(boton).click();await wait(0);};

(async()=>{
// =====================================================================
console.log('1. Formato de números y comparación de respuestas');
{
  const casos=[['1.300','1.300',true],['1300','1.300',false],['1,300','1.300',false],[' 1.300 ','1.300',true],['01.300','1.300',false],['1.3000','1.300',false],['1.30','1.300',false],['257','257',true],['0257','257',false],['2.57','257',false],['0','0',true],['12.345,5','12.345,5',true]];
  const w=abrir(EX1,{});const d=w.document;const inp=d.querySelectorAll('input[data-r]');
  // usamos el hueco 3 (257) y le cambiamos data-r en cada caso
  let todos=true;
  for(const [v,esp,ok] of casos){const i=inp[10];i.dataset.r=esp;i.value=v;rellenarBien(d);i.value=v;d.getElementById('corregir').click();const bienHueco=i.classList.contains('ok');if(bienHueco!==ok){fallo(`número "${v}" con esperado ${esp} debería ser ${ok?'válido':'inválido'}`);todos=false;}d.getElementById('b-reintentar').click();}
  if(todos)bien('punto de millar obligatorio; sin ceros a la izquierda; espacios tolerados ('+casos.length+' casos)');
  const textos=[['Trescientos  Cuarenta Y Ocho','trescientos cuarenta y ocho',true],['trescientos cuarenta y ocho.','trescientos cuarenta y ocho',false],['tres cientos cuarenta y ocho','trescientos cuarenta y ocho',false],['cuatro mil dieciseis','cuatro mil dieciséis',true]];
  todos=true;
  for(const [v,esp,ok] of textos){const i=inp[0];i.dataset.r=esp;rellenarBien(d);i.value=v;d.getElementById('corregir').click();if(i.classList.contains('ok')!==ok){fallo(`texto "${v}" debería ser ${ok?'válido':'inválido'}`);todos=false;}d.getElementById('b-reintentar').click();}
  if(todos)bien('texto: ignora mayúsculas, tildes y espacios dobles; no ignora puntuación ni palabras partidas');
}
// =====================================================================
console.log('2. Notas: redondeo al cuarto, límites, preguntas a medias');
{
  let w=abrir(EX1,{}),d=w.document;d.getElementById('corregir').click();await responder(d,'d-no');
  check(nota(d)==='0,00 / 10'&&d.querySelectorAll('.pregunta.mal').length===10,'todo vacío → 0,00 y las 10 preguntas en rojo');
  check(d.getElementById('b-corregir').hidden===false&&d.getElementById('b-soluciones').hidden===false,'con 0 se puede corregir y ver soluciones');
  w=abrir(EX1,{});d=w.document;rellenarBien(d);d.getElementById('corregir').click();
  check(nota(d)==='10,00 / 10'&&d.getElementById('b-corregir').hidden&&d.getElementById('b-soluciones').hidden,'todo bien → 10,00 sin corregir ni soluciones');
  // 1 fallo en pregunta de 2 huecos (0,5) y 1 en una de 3 (0,33): 10-0,5-0,333=9,17 → 9,25
  w=abrir(EX1,{});d=w.document;rellenarBien(d);
  const p1=d.querySelectorAll('.pregunta')[0],p5=d.querySelectorAll('.pregunta')[4];
  p1.querySelector('input').value='x';const g5=p5.querySelectorAll('.grupo')[0];[...g5.querySelectorAll('.opcion')].find(o=>o.textContent.trim().toLowerCase()!==g5.dataset.r.toLowerCase()).click();
  d.getElementById('corregir').click();
  check(nota(d)==='9,25 / 10'&&p1.classList.contains('medias')&&p5.classList.contains('medias'),'9,17 (medio hueco de 2 y un tercio de 3) se redondea a 9,25 y las preguntas quedan en naranja');
  // empate exacto sube: 7,875 → 8,00 ; necesitamos puntos=7,875: 10 preguntas, fallar 2,125 puntos: 1 pregunta entera (1) + 1 de 8 huecos fallando 9/8? No: usamos 1 entera + hueco 1 de 8 (0,125)
  w=abrir(EX1,{});d=w.document;rellenarBien(d);
  const p2=d.querySelectorAll('.pregunta')[1];const huecos2=p2.querySelectorAll('input[data-r]');
  d.querySelectorAll('.pregunta')[0].querySelectorAll('input[data-r]').forEach(i=>i.value='');huecos2[0].value='';
  d.getElementById('corregir').click();await responder(d,'d-no');
  check(huecos2.length===8&&nota(d)==='9,00 / 10','empate exacto (8,875 → 35,5 cuartos) redondea hacia arriba → 9,00');
}
// =====================================================================
console.log('3. Huecos vacíos, borrador, corrección única, soluciones, reintentar');
{
  let st={};let w=abrir(EX1,st),d=w.document;rellenarBien(d);d.querySelectorAll('input[data-r]')[0].value='';
  d.getElementById('corregir').click();
  check(dialogoVisible(d)&&/falta por terminar la pregunta 1\b/.test(d.getElementById('d-texto').textContent),'con un hueco vacío sale el aviso propio, que dice qué pregunta falta (no el confirm del navegador)');
  await responder(d,'d-si');
  check(!d.getElementById('velo').classList.contains('visible')&&!dialogoVisible(d),'"seguir contestando" no entrega');
  check(d.querySelectorAll('input[data-r]')[0].classList.contains('vacio'),'"seguir contestando" resalta el hueco vacío');
  d.querySelectorAll('input[data-r]')[0].dispatchEvent(new w.Event('input'));
  check(!d.querySelectorAll('input[data-r]')[0].classList.contains('vacio'),'al escribir en el hueco se quita el resaltado');
  w=abrir(EX1,st);d=w.document;rellenarBien(d);d.querySelectorAll('input[data-r]')[0].value='';d.getElementById('corregir').click();await responder(d,'d-no');
  check(nota(d)==='9,50 / 10','con "entregar así" se entrega contando el vacío como fallo');
  // corrección única
  d.getElementById('b-corregir').click();d.querySelectorAll('input[data-r]')[0].value=d.querySelectorAll('input[data-r]')[0].dataset.r;d.getElementById('corregir').click();
  check(nota(d)==='10,00 / 10'&&d.getElementById('b-corregir').hidden,'tras corregir una vez ya no se puede corregir más');
  w=abrir(EX1,st);d=w.document;check(d.getElementById('b-corregir').hidden&&/Primer intento: 9,50/.test(d.getElementById('r-sub').textContent),'al recargar sigue sin corregir y muestra el primer intento');
  // soluciones: cancelar mantiene corregir; aceptar lo quita
  st={};w=abrir(EX1,st);d=w.document;rellenarBien(d);d.querySelectorAll('input[data-r]')[0].value='x';d.getElementById('corregir').click();
  d.getElementById('b-soluciones').click();check(dialogoVisible(d)&&/corrijo/.test(d.getElementById('d-si').textContent),'ver soluciones pide confirmación y la opción destacada es corregir primero');await responder(d,'d-si');check(d.getElementById('velo').classList.contains('visible')&&!d.getElementById('b-corregir').hidden,'cancelar en "ver soluciones" conserva la corrección');
  w=abrir(EX1,st);d=w.document;d.getElementById('b-soluciones').click();await responder(d,'d-no');
  check(d.querySelectorAll('.solucion').length===1&&d.querySelector('.solucion').textContent===d.querySelectorAll('input[data-r]')[0].dataset.r,'ver soluciones muestra la respuesta solo en el hueco fallado');
  d.getElementById('volver').click();check(d.getElementById('b-corregir').hidden,'tras ver soluciones desaparece corregir');
  // reintentar conserva historial
  d.getElementById('b-reintentar').click();const hist=JSON.parse(st['noatests-mates:'+BASE+'examen1/:historial']);
  check(!st['noatests-mates:'+BASE+'examen1/']&&hist.length===1,'reintentar borra el último intento y conserva el historial');
  // borrador: se guarda, se recupera, se borra al entregar
  st={};w=abrir(EX1,st);d=w.document;const i0=d.querySelectorAll('input[data-r]')[0];i0.value='hola';i0.dispatchEvent(new w.Event('input'));await wait(250);
  check(!!st['noatests-mates:'+BASE+'examen1/:borrador'],'el borrador se guarda al escribir');
  w=abrir(EX1,st);d=w.document;check(d.querySelectorAll('input[data-r]')[0].value==='hola','el borrador se recupera al recargar');
  rellenarBien(d);d.getElementById('corregir').click();await wait(250);check(!st['noatests-mates:'+BASE+'examen1/:borrador'],'el borrador se borra al entregar y no reaparece después (aunque se acabe de elegir una opción)');
  d.querySelector('.opcion').click();await wait(250);check(!st['noatests-mates:'+BASE+'examen1/:borrador'],'repasar un examen entregado no crea borradores');
  // historial con tope 20
  st={};st['noatests-mates:'+BASE+'examen1/:historial']=JSON.stringify(Array.from({length:20},(_,i)=>({fecha:`2026-01-${String(i+1).padStart(2,'0')}T00:00:00.000Z`,nota1:5,notaCorr:null})));
  w=abrir(EX1,st);d=w.document;rellenarBien(d);d.getElementById('corregir').click();
  check(JSON.parse(st['noatests-mates:'+BASE+'examen1/:historial']).length===20,'el historial local se queda en 20 intentos como máximo');
  // localStorage roto (modo privado): el examen funciona y corrige igual
  w=abrir(EX1,{},{lsRoto:true});d=w.document;rellenarBien(d);d.getElementById('corregir').click();
  check(nota(d)==='10,00 / 10','con localStorage inutilizable el examen se corrige igual (sin guardar)');
}
// =====================================================================
console.log('4. Dibujos con datos extremos');
{
  const casos=[
    ['bloques sin barras','<div class="bloques" data-um="0" data-c="2" data-d="0" data-u="0"></div>'],
    ['bloques solo unidades','<div class="bloques" data-u="9"></div>'],
    ['tapones vacío','<div class="tapones"></div>'],
    ['recta paso no divisor','<div class="recta" data-min="0" data-max="100" data-paso="30" data-letras="A=60"></div>'],
    ['recta con miles','<div class="recta" data-min="9.000" data-max="10.000" data-paso="100" data-puntos="9.550"></div>'],
    ['tarjetas con cero','<div class="tarjetas" data-valores="5.000,0,0,0"></div>'],
    ['barras todo cero','<div class="barras" data-valores="A=0;B=0"></div>'],
    ['barras distancia un pueblo','<div class="barras" data-tipo="distancia" data-valores="Solo=100" data-unidad="m"></div>'],
    ['barras cantidad','<div class="barras" data-tipo="cantidad" data-valores="X=1"></div>'],
    ['plano 4 direcciones','<div class="plano" data-cols="3" data-rows="3" data-salas="1,1,Centro,rosa" data-calles-h="a|b|c|d" data-calles-v="e|f|g|h" data-persona="1,1,izquierda" data-marca="2,2"></div><div class="plano" data-cols="2" data-rows="2" data-salas="0,0,A,gris" data-persona="0,0,abajo"></div>'],
    ['figuras todas','<div class="figuras" data-figura="casa" data-opciones="traslada;gira;agranda;encoge;voltea" data-etiquetas="a;b;c;d;e"></div>'],
    ['tabla 3 cifras','<div class="tabla-posiciones" data-cifras="1,4,5"></div>'],
    ['tabla con hueco','<div class="tabla-posiciones" data-cifras="2, ,7,4"></div>'],
    ['venn sin común','<div class="venn" data-a="Plano 1" data-b="Plano 2" data-solo-a="mesas en filas" data-solo-b="mesas en grupos"></div>'],
  ];
  let todos=true;
  for(const [nombre,html] of casos){
    const dom=new JSDOM('<main>'+html+'</main>',{url:'https://x.test/noatests/m/',runScripts:'outside-only'});const w=dom.window;
    try{w.eval(fs.readFileSync(path.join(raiz,'matematicas/dibujos.js'),'utf8'));}catch(e){fallo('dibujo "'+nombre+'" lanza error: '+e.message);todos=false;continue;}
    const svgs=w.document.querySelectorAll('svg');const esperados=w.document.querySelectorAll('main > div').length;
    if(svgs.length!==esperados){fallo('dibujo "'+nombre+'": '+svgs.length+' svg de '+esperados);todos=false;continue;}
    const xml=w.document.querySelector('main').innerHTML;
    if(/NaN|undefined|Infinity/.test(xml)){fallo('dibujo "'+nombre+'" contiene NaN/undefined/Infinity');todos=false;}
    [...svgs].forEach(s=>{const vb=s.getAttribute('viewBox').split(' ').map(Number);if(!(vb[2]>0&&vb[3]>0)){fallo('dibujo "'+nombre+'" con viewBox inválido '+s.getAttribute('viewBox'));todos=false;}});
  }
  if(todos)bien(casos.length+' dibujos con datos extremos se pintan sin NaN ni errores');
  // la recta con letras fuera de rango la detecta el test de coherencia (tests/run.js), no el dibujo
}
// =====================================================================
console.log('5. Sincronización: esquinas');
{
  const R=BASE+'examen1/';
  // a) fecha en formato Postgres y en ISO se consideran el mismo intento
  let nube=nubeNueva();nube.intentos.push({examen:R,fecha:'2026-10-18 10:00:00+00',nota1:7,nota_corr:null,respuestas:null,vio_soluciones:false});
  let st={['noatests-sync:codigo']:CODIGO};st['noatests-mates:'+R+':historial']=JSON.stringify([{fecha:'2026-10-18T10:00:00.000Z',nota1:7,notaCorr:null}]);
  let w=abrir('notas/index.html',st,{nube});await wait(120);
  check(JSON.parse(st['noatests-mates:'+R+':historial']).length===1,'una fecha en formato Postgres y la misma en ISO no se duplican');
  // b) notas límite 0 y 10 y cuartos viajan intactos
  nube=nubeNueva();
  for(const [i,n] of [0,0.25,9.75,10].entries()){st={};st['noatests-mates:'+R+':historial']=JSON.stringify([{fecha:'2026-10-0'+(i+1)+'T00:00:00.000Z',nota1:n,notaCorr:null}]);w=abrir('notas/index.html',st,{nube});await wait(80);await w.noatestsSync.conectar(CODIGO);}
  check(nube.intentos.map(x=>x.nota1).sort((a,b)=>a-b).join(',')==='0,0.25,9.75,10','notas 0, 0,25, 9,75 y 10 llegan intactas a la nube');
  // c) error HTTP 500 del servidor: nada se pierde, queda en cola
  nube=nubeNueva();nube.fallarHttp=true;st={['noatests-sync:codigo']:CODIGO};
  w=abrir(EX1,st,{nube});await wait(80);let d=w.document;rellenarBien(d);d.getElementById('corregir').click();await wait(60);
  check(w.noatestsSync.pendientes()===1&&nube.intentos.length===0,'si el servidor falla (500) el intento queda en cola');
  nube.fallarHttp=false;await w.noatestsSync.vaciarCola();check(w.noatestsSync.pendientes()===0&&nube.intentos.length===1,'y se envía cuando el servidor vuelve');
  // d) desconectar: deja de enviar, no borra lo local
  nube=nubeNueva();st={};w=abrir(EX1,st,{nube});await wait(80);d=w.document;rellenarBien(d);d.getElementById('corregir').click();
  w=abrir('notas/index.html',st,{nube});await wait(80);await w.noatestsSync.conectar(CODIGO);w.noatestsSync.desconectar();
  const antes=Object.keys(st).filter(k=>k.startsWith('noatests-mates:')).length;w=abrir(EX1,st,{nube});await wait(80);d=w.document;d.getElementById('b-reintentar').click();w=abrir(EX1,st,{nube});await wait(80);d=w.document;rellenarBien(d);d.getElementById('corregir').click();await wait(60);
  check(nube.intentos.length===1&&Object.keys(st).filter(k=>k.startsWith('noatests-mates:')).length>=antes,'tras desconectar no se envía nada y lo local se conserva');
  // e) código con espacios alrededor se acepta
  w=abrir('notas/index.html',{},{nube});await wait(80);check((await w.noatestsSync.conectar('  '+CODIGO+'  '))==='Familia Test','el código se acepta aunque lleve espacios');
  // f) importar con la nube activa sube lo importado y la siguiente bajada no lo borra
  nube=nubeNueva();st={['noatests-sync:codigo']:CODIGO};w=abrir('notas/index.html',st,{nube});await wait(80);
  const fus=w.__noatestsFusionar;fus({['noatests-mates:'+R+':historial']:[{fecha:'2026-09-01T00:00:00.000Z',nota1:6,notaCorr:null}],['noatests-mates:'+R]:{fecha:'2026-09-01T00:00:00.000Z',nota1:6,notaCorr:null,respuestas:{}}});
  await w.noatestsSync.subirLocal(['noatests-mates:'+R+':historial']);await w.noatestsSync.bajar();
  check(nube.intentos.length===1&&JSON.parse(st['noatests-mates:'+R+':historial']).length===1,'importar con la nube activa sube lo importado y no se pierde al sincronizar');
  // g) la corrección hecha en el dispositivo B de un intento de A: no es posible (sin respuestas); pero una corrección subida desde A llega a B
  nube=nubeNueva();const A={['noatests-sync:codigo']:CODIGO},B={['noatests-sync:codigo']:CODIGO};
  w=abrir(EX1,A,{nube});await wait(80);d=w.document;rellenarBien(d);d.querySelectorAll('input[data-r]')[0].value='x';d.getElementById('corregir').click();await wait(60);
  w=abrir(EX1,B,{nube});await wait(120);d=w.document;check(/9,50/.test(nota(d))&&!d.getElementById('b-corregir').hidden,'B ve el intento de A con respuestas y puede corregirlo');
  w=abrir(EX1,A,{nube});await wait(120);d=w.document;d.getElementById('b-corregir').click();d.querySelectorAll('input[data-r]')[0].value=d.querySelectorAll('input[data-r]')[0].dataset.r;d.getElementById('corregir').click();await wait(60);
  w=abrir(EX1,B,{nube});await wait(120);d=w.document;check(/10,00/.test(nota(d))&&d.getElementById('b-corregir').hidden,'la corrección hecha en A llega a B y B ya no puede corregir');
  // h) dos dispositivos entregan el mismo examen: quedan dos intentos, ambos en los dos
  w=abrir(EX1,B,{nube});await wait(120);d=w.document;d.getElementById('b-reintentar').click();w=abrir(EX1,B,{nube});await wait(120);d=w.document;rellenarBien(d);d.getElementById('corregir').click();await wait(60);
  w=abrir('notas/index.html',A,{nube});await wait(150);
  check(JSON.parse(A['noatests-mates:'+R+':historial']).length===2&&JSON.parse(B['noatests-mates:'+R+':historial']).length===2,'intentos hechos en dos dispositivos se ven en ambos (2 y 2)');
  // i) ruta inválida no se envía ni bloquea la cola
  nube=nubeNueva();st={['noatests-sync:codigo']:CODIGO};st['noatests-mates:/noatests/x y/:historial']=JSON.stringify([{fecha:'2026-01-01T00:00:00.000Z',nota1:5,notaCorr:null}]);st['noatests-mates:'+R+':historial']=JSON.stringify([{fecha:'2026-01-02T00:00:00.000Z',nota1:5,notaCorr:null}]);
  w=abrir('notas/index.html',st,{nube});await wait(80);await w.noatestsSync.subirLocal();
  check(nube.intentos.length===1&&w.noatestsSync.pendientes()===0,'una ruta inválida se descarta sin bloquear el resto de la cola');
}
// =====================================================================
console.log('6. Mis notas y exportar/importar: esquinas');
{
  // examen en localStorage que ya no está en el catálogo: no rompe la página
  const st={};st['noatests-mates:/noatests/matematicas/tema-borrado/examen9/:historial']=JSON.stringify([{fecha:'2026-01-01T00:00:00.000Z',nota1:5,notaCorr:null}]);
  let w=abrir('notas/index.html',st);await wait(120);let d=w.document;
  check(d.querySelectorAll('#contenido a.tarjeta').length===JSON.parse(fs.readFileSync(path.join(raiz,'catalogo.json'),'utf8')).materias.length&&!/Cargando/.test(d.body.textContent),'un examen guardado que ya no existe en el catálogo no rompe Mis notas');
  // media con un solo examen y nota con cuartos
  const st2={};st2['noatests-mates:'+BASE+'examen2/:historial']=JSON.stringify([{fecha:'2026-01-01T00:00:00.000Z',nota1:7.75,notaCorr:null}]);st2['noatests-mates:'+BASE+'examen2/']=JSON.stringify({fecha:'2026-01-01T00:00:00.000Z',nota1:7.75,respuestas:{}});
  w=abrir('notas/index.html',st2);await wait(120);d=w.document;w.location.hash='#/matematicas';w.__noatestsNotas.pintar();
  check(/1 de 7 hechos/.test(d.querySelector('a.tarjeta').textContent)&&/7,75/.test(d.querySelector('a.tarjeta').textContent),'la media muestra cuartos (7,75) y "1 de 7"');
  // importar archivo inválido: nada cambia
  w=abrir('notas/index.html',st2);await wait(120);
  const fus=w.__noatestsFusionar;const copia=JSON.stringify(st2);
  const r=fus({['noatests-otro:x']:{a:1},['noatests-mates:'+BASE+'examen2/:borrador']:{x:1}});
  check(r.intentos===0&&r.examenes===0&&JSON.stringify(st2)===copia,'importar claves ajenas o borradores no cambia nada');
  // importar un historial con intentos repetidos dentro del propio archivo
  const r2=fus({['noatests-mates:'+BASE+'examen3/:historial']:[{fecha:'2026-02-01T00:00:00.000Z',nota1:5},{fecha:'2026-02-01T00:00:00.000Z',nota1:5}]});
  check(r2.intentos>=1&&JSON.parse(st2['noatests-mates:'+BASE+'examen3/:historial']).length===1,'un archivo con el mismo intento repetido lo importa una sola vez');
}
// =====================================================================
console.log('7. Reglas generales de los exámenes');
{
  const ex=[];fs.readdirSync(path.join(raiz,'matematicas'),{withFileTypes:true}).filter(t=>t.isDirectory()).forEach(t=>fs.readdirSync(path.join(raiz,'matematicas',t.name)).filter(f=>/^examen\d+$/.test(f)).forEach(f=>ex.push(t.name+'/'+f)));
  let todos=true;
  for(const e of ex){
    const html=fs.readFileSync(path.join(raiz,'matematicas',e,'index.html'),'utf8');
    const dom=new JSDOM(html);const d=dom.window.document;
    // cada pregunta tiene al menos un hueco y un enunciado no vacío
    [...d.querySelectorAll('.pregunta')].forEach((q,i)=>{
      const huecos=q.querySelectorAll('input[data-r],.grupo,.grid').length+[...q.querySelectorAll('.cuenta')].reduce((n,c)=>n+c.dataset.mostrado.split('?').length-1,0);if(!huecos){fallo(e+' pregunta '+(i+1)+' sin huecos');todos=false;}
      if(!q.querySelector('h2')||q.querySelector('h2').textContent.trim().length<10){fallo(e+' pregunta '+(i+1)+' sin enunciado');todos=false;}
      // ninguna respuesta numérica sin punto de millar cuando debe llevarlo
      q.querySelectorAll('input[data-r]').forEach(inp=>{const r=inp.dataset.r;if(/^\d{4,}$/.test(r)){fallo(e+' pregunta '+(i+1)+': respuesta "'+r+'" sin punto de millar');todos=false;}});
      // ningún enunciado contiene la respuesta de un hueco numérico de 3+ cifras (regalo)
      const enun=q.querySelector('h2').textContent;q.querySelectorAll('input[data-r]').forEach(inp=>{const r=inp.dataset.r;if(/^[\d.]{3,}$/.test(r)&&new RegExp('(^|[^\\d.])'+r.replace('.','\\.')+'($|[^\\d.])').test(enun)&&!/anterior|posterior|redonde|aproxim|entre|cambia|estim|ord[eé]n/i.test(enun)){fallo(e+' pregunta '+(i+1)+': el enunciado contiene la respuesta '+r);todos=false;}});
      // grupos: al menos 2 opciones y sin opciones repetidas
      q.querySelectorAll('.grupo').forEach(g=>{const ops=[...g.querySelectorAll('.opcion')].map(o=>o.textContent.trim().toLowerCase());if(ops.length<2||new Set(ops).size!==ops.length){fallo(e+' pregunta '+(i+1)+': opciones insuficientes o repetidas');todos=false;}});
    });
    // la cuadrícula, si existe, tiene origen y destino dentro de 6x6 y distintos
    const g=d.querySelector('.grid');if(g){const s=g.dataset.start.split(',').map(Number),t=g.dataset.dest.split(',').map(Number);if(s.join()===t.join()||[...s,...t].some(v=>v<0||v>5)){fallo(e+': cuadrícula con origen/destino inválidos');todos=false;}}
    // los enlaces a css/js llevan versión
    if(!/examen\.js\?v=\d+/.test(html)||!/examen\.css\?v=\d+/.test(html)||!/dibujos\.js\?v=\d+/.test(html)||!/sync\.js\?v=\d+/.test(html)){fallo(e+': enlaces sin versión');todos=false;}
  }
  if(todos)bien(ex.length+' exámenes: huecos, enunciados, puntos de millar, sin respuestas regaladas, opciones válidas, cuadrícula válida, enlaces versionados');
}
// =====================================================================
console.log('8. Interfaz pensada para niños');
{
  let st={};let w=abrir(EX1,st),d=w.document;
  const pts=d.querySelectorAll('#progreso .punto');
  check(pts.length===10&&/Has contestado 0 de 10/.test(d.getElementById('p-texto').textContent),'barra de progreso: un punto por pregunta y "Has contestado 0 de 10"');
  const q1=d.querySelectorAll('.pregunta')[0];q1.querySelectorAll('input[data-r]').forEach(i=>{i.value=i.dataset.r;i.dispatchEvent(new w.Event('input'));});
  q1.querySelectorAll('.grupo').forEach(g=>[...g.querySelectorAll('.opcion')][0].click());
  check(pts[0].classList.contains('hecha')&&!pts[1].classList.contains('hecha')&&/Has contestado 1 de 10/.test(d.getElementById('p-texto').textContent),'al contestar la pregunta 1 entera se rellena su punto');
  const op=[...d.querySelectorAll('.opcion')].find(o=>!q1.contains(o));
  check(op.getAttribute('role')==='radio'&&op.getAttribute('tabindex')==='0','las opciones se pueden elegir con el teclado (role=radio, tabindex)');
  op.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));check(op.classList.contains('sel')&&op.getAttribute('aria-checked')==='true','Enter elige la opción');
  d.getElementById('corregir').click();check(dialogoVisible(d),'entregar con huecos vacíos abre el aviso');
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));await wait(0);check(!dialogoVisible(d)&&!d.getElementById('velo').classList.contains('visible'),'Escape cierra el aviso sin entregar');d.getElementById('corregir').click();d.getElementById('dialogo').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));await wait(0);check(!dialogoVisible(d)&&!d.getElementById('velo').classList.contains('visible'),'tocar fuera del aviso lo cierra sin entregar');
  w=abrir(EX1,{});d=w.document;rellenarBien(d);
  check(/Todas contestadas/.test(d.getElementById('p-texto').textContent),'con todo contestado la barra lo celebra');
  d.getElementById('corregir').click();
  check(d.querySelectorAll('#r-estrellas .llena').length===3&&!dialogoVisible(d),'un 10 da 3 estrellas y se entrega sin aviso');
  check([...d.querySelectorAll('#progreso .punto')].every(p=>p.classList.contains('ok'))&&/10 bien/.test(d.getElementById('p-texto').textContent),'tras entregar los puntos se pintan en verde y la barra resume el resultado');
  w=abrir(EX1,{});d=w.document;d.getElementById('corregir').click();await responder(d,'d-no');
  check(d.querySelectorAll('#r-estrellas .llena').length===0&&d.getElementById('r-estrellas').getAttribute('aria-label')==='0 de 3 estrellas','un 0 da 0 estrellas');
  // portada: lo que está a medias y estrellas en la lista del tema
  st={};st['noatests-mates:'+BASE+'examen2/:borrador']=JSON.stringify({modo:'intento',respuestas:{inputs:['1'],grupos:[-1],grid:null}});
  st['noatests-mates:'+BASE+'examen1/']=JSON.stringify({fecha:'2026-01-01T00:00:00.000Z',nota1:7.5,notaCorr:null,respuestas:{}});
  w=abrir('index.html',st);await wait(80);d=w.document;
  const seguir=d.querySelector('a.seguir');
  check(!!seguir&&seguir.getAttribute('href')===BASE+'examen2/'&&/Ejercicio 2/.test(seguir.textContent),'la portada ofrece seguir el examen que está a medias');
  check(/¡Hola, Noa!/.test(d.body.textContent)&&d.querySelectorAll('.mosaico a.examen').length>=4,'la portada saluda y muestra un mosaico por materia más Mis notas');
  w=abrir('matematicas/temas1-2-numeros-y-planos/index.html',st);await wait(80);d=w.document;
  const e1=d.querySelector('a[href="examen1/"]'),e2=d.querySelector('a[href="examen2/"]');
  check(e1.querySelector('.nota-lista').textContent==='7,50'&&e1.querySelector('.estrellas-lista').getAttribute('aria-label')==='2 de 3 estrellas','la lista del tema muestra nota y estrellas (7,50 → 2)');
  check(!!e2.querySelector('.pendiente')&&!e1.querySelector('.pendiente'),'la lista del tema marca "A medias" solo en el que está empezado');
}
// robustez que señaló la revisión
{
  let w=abrir(EX1,{},{lsMuerto:true}),d=w.document;rellenarBien(d);d.getElementById('corregir').click();
  check(nota(d)==='10,00 / 10'&&d.getElementById('velo').classList.contains('visible'),'con localStorage bloqueado del todo (el navegador lanza al acceder) el examen se entrega y enseña la nota');
  let st={};st['noatests-mates:'+BASE+'examen1/:borrador']=JSON.stringify({modo:'intento',respuestas:{}});
  w=abrir(EX1,st);d=w.document;check(d.querySelectorAll('#progreso .punto').length===10,'un borrador estropeado (sin respuestas) no impide abrir el examen');
  st={};st['noatests-mates:'+BASE+'examen1/']=JSON.stringify({});st['noatests-mates:'+BASE+'examen3/']=JSON.stringify({nota1:'7'});
  st['noatests-mates:'+BASE+'examen2/']=JSON.stringify({fecha:'2026-01-01T00:00:00.000Z',nota1:6.25,notaCorr:9,respuestas:{}});
  w=abrir('matematicas/temas1-2-numeros-y-planos/index.html',st);await wait(80);d=w.document;
  check(d.querySelectorAll('a.examen').length===7&&!d.querySelector('a[href="examen1/"] .nota-lista'),'notas guardadas estropeadas se ignoran y la lista del tema se pinta igual');
  check(d.querySelector('a[href="examen2/"] .estrellas-lista').getAttribute('aria-label')==='3 de 3 estrellas','las estrellas de la lista usan la nota final tras corregir (6,25 → 9,00 = 3), como la pantalla del resultado');
  // borrador de corrección viejo: el examen ya se corrigió en otro dispositivo
  st={};st['noatests-mates:'+BASE+'examen1/']=JSON.stringify({fecha:'2026-01-01T00:00:00.000Z',nota1:8,notaCorr:9.5,respuestas:{inputs:[],grupos:[]}});
  st['noatests-mates:'+BASE+'examen1/:borrador']=JSON.stringify({modo:'correccion',respuestas:{inputs:['x'],grupos:[]}});
  w=abrir('index.html',st);await wait(80);d=w.document;check(!d.querySelector('a.seguir'),'un borrador de corrección de un examen ya corregido no sale como "a medias"');
  w=abrir(EX1,st);d=w.document;check(!st['noatests-mates:'+BASE+'examen1/:borrador'],'al abrir ese examen el borrador viejo se borra');
}
// =====================================================================
console.log('9. Mantenimiento: catálogo, versiones y generadores');
{
  const cat=JSON.parse(fs.readFileSync(path.join(raiz,'catalogo.json'),'utf8'));
  let todos=true;
  cat.materias.filter(m=>m.evaluable).forEach(m=>{
    if(!m.icono){fallo(m.id+' sin icono');todos=false;}
    m.temas.forEach(t=>t.examenes.forEach(e=>{
      const html=fs.readFileSync(path.join(raiz,m.id,t.id,e.id,'index.html'),'utf8');
      [...html.matchAll(/data-tipo="([^"]+)"/g)].map(x=>x[1]).filter(x=>!/^(distancia|cantidad)$/.test(x)).forEach(tp=>{if(!(m.contenidos||{})[tp]){fallo(m.id+'/'+t.id+'/'+e.id+': el contenido "'+tp+'" no tiene nombre en catalogo.json');todos=false;}});
    }));
  });
  if(todos)bien('cada contenido (data-tipo) de cada examen tiene su nombre en catalogo.json, y cada materia su icono');
  const V=JSON.parse(fs.readFileSync(path.join(raiz,'herramientas/version.json'),'utf8')).version;const malos=[];
  (function recorre(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git'].includes(x.name))continue;const p=path.join(d,x.name);
    if(x.isDirectory())recorre(p);else if(x.name.endsWith('.html')){const h=fs.readFileSync(p,'utf8');
      for(const m of h.matchAll(/(?:src|href)="([^"]+\.(?:js|css))(\?v=(\d+))?"/g)){if(/^https?:/.test(m[1])||/sw-registro\.js$/.test(m[1]))continue;if(+m[3]!==V)malos.push(path.relative(raiz,p)+' → '+m[1]+(m[2]||' (sin versión)'));}}}})(raiz);
  check(!malos.length,'todas las páginas enlazan los .js y .css propios con la misma versión (?v='+V+')'+(malos.length?': '+malos.slice(0,3).join(', '):''));
  // a la niña se le llaman "ejercicios": la palabra examen no debe salir en ninguna pantalla (por dentro las carpetas siguen siendo examenN)
  {
    const st={};st['noatests-mates:'+BASE+'examen1/']=JSON.stringify({fecha:'2026-01-01T00:00:00.000Z',nota1:6,notaCorr:null,respuestas:{}});st['noatests-mates:'+BASE+'examen1/:historial']=JSON.stringify([{fecha:'2026-01-01T00:00:00.000Z',nota1:6,notaCorr:null,tipos:{recta:{bien:1,total:2}}}]);
    const pantallas=[];const visible=d=>{const c=d.body.cloneNode(true);c.querySelectorAll('script,style').forEach(x=>x.remove());return d.title+' '+c.textContent;};
    let w=abrir('index.html',st);await wait(80);pantallas.push(['portada',visible(w.document)]);
    for(const pg of ['matematicas/index.html','matematicas/temas1-2-numeros-y-planos/index.html','sociales/tema1-como-encontrar-lugares/index.html','arts/index.html','temario/index.html']){w=abrir(pg,st);await wait(80);pantallas.push([pg,visible(w.document)]);}
    w=abrir(EX1,{});let d=w.document;pantallas.push(['ejercicio',visible(d)]);d.getElementById('corregir').click();pantallas.push(['aviso',d.getElementById('dialogo').textContent]);await responder(d,'d-no');pantallas.push(['resultado',visible(d)]);
    w=abrir('notas/index.html',st);await wait(120);for(const h of ['#/','#/matematicas','#/matematicas/progreso','#/matematicas/temas1-2-numeros-y-planos','#/matematicas/temas1-2-numeros-y-planos/examen1','#/matematicas/temas1-2-numeros-y-planos/examen2']){w.location.hash=h;w.__noatestsNotas.pintar();pantallas.push(['notas '+h,visible(w.document)]);}
    const cat2=JSON.parse(fs.readFileSync(path.join(raiz,'catalogo.json'),'utf8'));pantallas.push(['catálogo',JSON.stringify(cat2.materias.map(m=>[m.nombre,m.descripcion,m.temas.map(t=>[t.nombre,t.descripcion,t.examenes.map(e=>[e.nombre,e.descripcion])])]))]);
    pantallas.push(['manifest',fs.readFileSync(path.join(raiz,'manifest.json'),'utf8').replace(/"start_url[^,]*,|"scope[^,]*,/g,'')]);
    const malas=pantallas.filter(([,t])=>/ex[aá]men/i.test(t.replace(/examen\d+\//g,''))).map(([n,t])=>n+': «'+t.match(/.{0,25}ex[aá]men.{0,15}/i)[0].trim()+'»');
    check(!malas.length,'ninguna pantalla dice "examen" (portada, listas, ejercicio, aviso, resultado, Mis notas, temario, catálogo)'+(malas.length?': '+malas.slice(0,3).join(' | '):''));
  }
  // los generadores reproducen exactamente los exámenes publicados (nadie los ha editado a mano por separado)
  const {execFileSync}=require('child_process');
  for(const [gen,dir] of [['generar-sociales-tema1.py','sociales/tema1-como-encontrar-lugares'],['generar-ingles-unit2.py','ingles/unit2-eat-well'],['generar-mates-temas4-5.py','matematicas/temas4-5-sumar-restar-y-problemas']]){
    const antes={};for(const e of fs.readdirSync(path.join(raiz,dir)).filter(f=>/^examen\d+$/.test(f)))antes[e]=fs.readFileSync(path.join(raiz,dir,e,'index.html'),'utf8');
    let distinto=[];
    try{execFileSync('python3',[path.join(raiz,'herramientas',gen)],{stdio:'pipe'});
      for(const e in antes){if(fs.readFileSync(path.join(raiz,dir,e,'index.html'),'utf8')!==antes[e])distinto.push(e);}
      check(!distinto.length,gen+' reproduce '+Object.keys(antes).length+' exámenes idénticos'+(distinto.length?' (distintos: '+distinto.join(', ')+'; cambia el generador, no el HTML)':''));
    }catch(e){fallo(gen+' no se puede ejecutar: '+String(e.message).slice(0,120));}
    finally{for(const e in antes)fs.writeFileSync(path.join(raiz,dir,e,'index.html'),antes[e]);} // dejar los archivos como estaban pase lo que pase
  }
}
console.log('\n'+ok+' comprobaciones correctas'+(errores?', '+errores+' error(es)':'.'));
if(errores)process.exit(1);
})();
