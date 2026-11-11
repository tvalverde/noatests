/* Motor común de los ejercicios evaluables (en el código y en las carpetas se siguen llamando "examen") (matemáticas, ciencias sociales y las que vengan).
   Cada examen solo define sus preguntas en el HTML:
   - <input type="text" data-r="respuesta">            → hueco. Los números deben escribirse con punto de millar (1.234).
   - <span class="grupo" data-r="opción"> con .opcion   → elegir una opción.
   - <div class="grid" data-start="f,c" data-dest="f,c" data-label="M"> → cuadrícula 6x6, tocar la casilla destino.
   Una pregunta (.pregunta) cuenta como acertada solo si todo lo que contiene está bien.
   El último intento se guarda en localStorage y se permite UNA corrección por intento.
   La clave de localStorage empieza por "noatests-mates:" en todas las materias por compatibilidad con los datos ya guardados y la nube. */
(function(){
'use strict';

const CLAVE='noatests-mates:'+location.pathname.replace(/\/index\.html$/,'/');
const CLAVE_HIST=CLAVE+':historial';
const CLAVE_BORRADOR=CLAVE+':borrador';

// ---------- utilidades ----------
// sin mayúsculas, tildes ni espacios de más; los apóstrofos curvos (’) de algunos teclados cuentan como '
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’‘`´]/g,"'").replace(/\s+/g,' ').trim();
const esNumero=s=>/^[0-9.,]+$/.test(String(s).trim());
const formatoES=s=>/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(String(s).trim());
function correcta(valor,esperado){
  valor=String(valor).trim();
  if(esNumero(esperado)) return formatoES(valor)&&valor===esperado;
  return norm(valor)===norm(esperado);
}
const fechaTexto=iso=>{const d=new Date(iso);return d.toLocaleDateString('es-ES',{day:'numeric',month:'long'})+' a las '+d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});};
const sinMovimiento=()=>{try{return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(e){return false;}};
const irA=(el,donde)=>{if(el)el.scrollIntoView({behavior:sinMovimiento()?'auto':'smooth',block:donde||'center'});};
function leer(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
function borrar(k){try{localStorage.removeItem(k);}catch(e){}}
function escribir(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

// ---------- elementos ----------
const preguntas=[...document.querySelectorAll('.pregunta')];
const inputs=[...document.querySelectorAll('input[data-r]')];
// Sin autocorrector ni sugerencias en ningún campo: debe escribir ella los números y las palabras tal cual
document.querySelectorAll('input[type=text]').forEach(i=>{i.setAttribute('autocomplete','off');i.setAttribute('autocorrect','off');i.setAttribute('autocapitalize','off');i.setAttribute('spellcheck','false');});
const grupos=[...document.querySelectorAll('.grupo')];
const grid=document.querySelector('.grid');
let marcada=null, START=null, DEST=null;
let modo='intento'; // 'intento' | 'correccion' | 'repaso'

// Cuadrícula
if(grid){
  const [sr,sc]=grid.dataset.start.split(',').map(Number);
  const [dr,dc]=grid.dataset.dest.split(',').map(Number);
  START={r:sr,c:sc};DEST={r:dr,c:dc};
  const etiqueta=grid.dataset.label||'M';
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    const d=document.createElement('div');d.className='celda';d.dataset.r=r;d.dataset.c=c;
    if(r===START.r&&c===START.c){d.textContent=etiqueta;d.classList.add('m');}
    else d.addEventListener('click',()=>{if(grid.classList.contains('bloqueado'))return;marcar(r,c);});
    grid.appendChild(d);
  }
}
function marcar(r,c){
  grid.querySelectorAll('.celda.x').forEach(e=>{e.classList.remove('x');e.textContent='';});
  if(r==null){marcada=null;return;}
  const d=grid.querySelector(`.celda[data-r="${r}"][data-c="${c}"]`);if(!d){marcada=null;return;}d.classList.add('x');d.textContent='X';marcada={r,c};
}

// Texto que lee la voz: nunca dibujos (emoji, que dirían la respuesta), ni pistas, ni huecos ni el botón 🔊
const EMOJI=/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D\u20E3]/gu;
function textoParaLeer(el){
  const c=el.cloneNode(true);
  c.querySelectorAll('input,button,.pista-txt,[role=img],.comida,svg,[data-no-leer]').forEach(x=>x.remove());
  c.querySelectorAll('.raya').forEach(x=>x.replaceWith(' … '));
  return c.textContent.replace(EMOJI,'').replace(/\s+/g,' ').trim();
}
function leerPregunta(q){
  const h=q.querySelector('h2');const partes=[];
  if(h)partes.push(textoParaLeer(h).replace(/^\d+\s*/,''));
  q.querySelectorAll('.fila,label').forEach(e=>{const t=textoParaLeer(e);if(t)partes.push(t.replace(/[<>]/g,m=>m==='>'?' mayor que ':' menor que '));});
  return partes.filter(Boolean).join('. ');
}
window.__noatestsLeer=leerPregunta;
// Botón de leer en voz alta en cada pregunta
if('speechSynthesis' in window){
  preguntas.forEach(q=>{
    const h=q.querySelector('h2');if(!h)return;
    const b=document.createElement('button');b.type='button';b.className='leer';b.title='Leer en voz alta';b.textContent='🔊';
    b.addEventListener('click',()=>{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(leerPregunta(q));u.lang=document.documentElement.dataset.voz||'es-ES'/* las páginas de inglés ponen <html data-voz="en-GB"> */;u.rate=0.9;speechSynthesis.speak(u);
    });
    h.appendChild(b);
  });
}

// Opciones: se tocan con el dedo o se eligen con el teclado (Tab + Enter/Espacio)
function elegir(g,o){
  g.querySelectorAll('.opcion').forEach(x=>{x.classList.remove('sel');x.setAttribute('aria-checked','false');});
  if(o){o.classList.add('sel');o.setAttribute('aria-checked','true');}
}
grupos.forEach(g=>{
  g.setAttribute('role','radiogroup');
  g.querySelectorAll('.opcion').forEach(o=>{
    o.setAttribute('role','radio');o.setAttribute('tabindex','0');o.setAttribute('aria-checked','false');
    o.addEventListener('click',()=>{if(g.classList.contains('bloqueado'))return;elegir(g,o);g.classList.remove('vacio');actualizarProgreso();});
    o.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();o.click();}});
  });
});

// ---------- borrador: se guarda cada respuesta al momento ----------
let tBorrador=null;
function guardarBorrador(){clearTimeout(tBorrador);if(modo==='repaso')return;tBorrador=setTimeout(()=>escribir(CLAVE_BORRADOR,{modo,respuestas:recoger()}),150);}
inputs.forEach(i=>i.addEventListener('input',()=>{i.classList.remove('vacio');guardarBorrador();actualizarProgreso();}));
grupos.forEach(g=>g.addEventListener('click',guardarBorrador));
if(grid)grid.addEventListener('click',()=>{grid.classList.remove('vacio');guardarBorrador();actualizarProgreso();});

// ---------- recoger y reponer respuestas ----------
function recoger(){
  return {
    inputs:inputs.map(i=>i.value),
    grupos:grupos.map(g=>[...g.querySelectorAll('.opcion')].findIndex(o=>o.classList.contains('sel'))),
    grid:marcada
  };
}
function reponer(r){
  if(!r)return;
  const ri=Array.isArray(r.inputs)?r.inputs:[],rg=Array.isArray(r.grupos)?r.grupos:[];
  inputs.forEach((i,k)=>i.value=ri[k]==null?'':String(ri[k]));
  grupos.forEach((g,k)=>{const ops=g.querySelectorAll('.opcion');elegir(g,rg[k]>=0?ops[rg[k]]:null);});
  if(grid)marcar(r.grid?r.grid.r:null,r.grid?r.grid.c:null);
  actualizarProgreso();
}

// ---------- corrección ----------
// Cada pregunta vale 1 punto repartido entre sus huecos. Devuelve {puntos, huecosBien, huecosTotal}.
function corregir(){
  let puntos=0,huecosBien=0,huecosTotal=0;const tipos={};
  preguntas.forEach(q=>{
    let bien=0,total=0;
    q.querySelectorAll('input[data-r]').forEach(i=>{
      i.classList.remove('ok','mal');const b=correcta(i.value,i.dataset.r);i.classList.add(b?'ok':'mal');total++;if(b)bien++;
    });
    q.querySelectorAll('.grupo').forEach(g=>{
      const sel=g.querySelector('.opcion.sel');g.querySelectorAll('.opcion').forEach(o=>o.classList.remove('ok','mal'));
      const b=!!sel&&norm(sel.textContent)===norm(g.dataset.r);if(sel)sel.classList.add(b?'ok':'mal');
      g.classList.toggle('fallado',!b);total++;if(b)bien++;
    });
    if(grid&&q.contains(grid)){
      grid.querySelectorAll('.celda').forEach(c=>c.classList.remove('ok','mal'));
      grid.querySelector(`.celda[data-r="${DEST.r}"][data-c="${DEST.c}"]`).classList.add('ok');
      const b=!!marcada&&marcada.r===DEST.r&&marcada.c===DEST.c;
      if(!b&&marcada)grid.querySelector(`.celda[data-r="${marcada.r}"][data-c="${marcada.c}"]`).classList.add('mal');
      grid.classList.toggle('fallado',!b);total++;if(b)bien++;
    }
    q.classList.remove('ok','mal','medias');q.classList.add(bien===total?'ok':bien===0?'mal':'medias');
    q.querySelectorAll('.vacio').forEach(e=>e.classList.remove('vacio'));
    if(total)puntos+=bien/total;huecosBien+=bien;huecosTotal+=total;
    const t=q.dataset.tipo||'otros';tipos[t]=tipos[t]||{bien:0,total:0};tipos[t].bien+=bien;tipos[t].total+=total;
  });
  return {puntos,huecosBien,huecosTotal,tipos};
}
// ---------- barra de progreso: un punto por pregunta ----------
// Antes de entregar: el punto se rellena cuando la pregunta tiene todos sus huecos contestados.
// Después: verde, naranja o rojo según el resultado. Tocar un punto lleva a su pregunta.
const progreso=document.createElement('nav');progreso.id='progreso';progreso.setAttribute('aria-label','Preguntas del ejercicio');
progreso.innerHTML='<div class="puntos"></div><div class="texto" id="p-texto"></div>';
const puntos=preguntas.map((q,k)=>{const b=document.createElement('button');b.type='button';b.className='punto';b.textContent=k+1;b.setAttribute('aria-label','Ir a la pregunta '+(k+1));b.addEventListener('click',()=>irA(q));progreso.firstChild.appendChild(b);return b;});
if(preguntas.length)preguntas[0].parentNode.insertBefore(progreso,preguntas[0]);
function huecosSinContestar(q){
  const v=[];
  q.querySelectorAll('input[data-r]').forEach(i=>{if(!i.disabled&&!i.value.trim())v.push(i);});
  q.querySelectorAll('.grupo').forEach(g=>{if(!g.classList.contains('bloqueado')&&!g.querySelector('.opcion.sel'))v.push(g);});
  if(grid&&q.contains(grid)&&!grid.classList.contains('bloqueado')&&!marcada)v.push(grid);
  return v;
}
function actualizarProgreso(){
  let hechas=0;const res={ok:0,medias:0,mal:0};let corregido=false;
  preguntas.forEach((q,k)=>{
    const p=puntos[k];p.classList.remove('hecha','ok','medias','mal');
    const estado=['ok','medias','mal'].find(c=>q.classList.contains(c));
    if(estado&&modo!=='intento'){corregido=true;res[estado]++;p.classList.add(estado);}
    else if(!huecosSinContestar(q).length){hechas++;p.classList.add('hecha');}
  });
  const t=document.getElementById('p-texto');if(!t)return;
  if(corregido&&modo!=='correccion')t.textContent='✅ '+res.ok+' bien · 🟠 '+res.medias+' a medias · ❌ '+res.mal+' mal';
  else if(modo==='correccion')t.textContent='Corrige las preguntas en naranja y rojo';
  else t.textContent=hechas===preguntas.length?'¡Todas contestadas! Ya puedes entregar 🎉':'Has contestado '+hechas+' de '+preguntas.length;
}

// ---------- diálogo propio (más grande y claro que el confirm() del navegador) ----------
const dialogo=document.createElement('div');dialogo.id='dialogo';dialogo.hidden=true;
dialogo.innerHTML='<div class="caja-dialogo" role="alertdialog" aria-modal="true" aria-labelledby="d-texto"><p id="d-texto"></p><button type="button" id="d-si"></button><button type="button" id="d-no"></button></div>';
document.body.appendChild(dialogo);
let respuestaDialogo=null,antesDialogo=null;
function preguntar(texto,si,no){
  return new Promise(res=>{
    document.getElementById('d-texto').textContent=texto;document.getElementById('d-si').textContent=si;document.getElementById('d-no').textContent=no;
    antesDialogo=document.activeElement;respuestaDialogo=res;dialogo.hidden=false;document.getElementById('d-si').focus();
  });
}
function cerrarDialogo(v){dialogo.hidden=true;const r=respuestaDialogo;respuestaDialogo=null;try{if(antesDialogo&&antesDialogo.focus)antesDialogo.focus({preventScroll:true});}catch(e){}if(r)r(v);}
document.getElementById('d-si').addEventListener('click',()=>cerrarDialogo(true));
document.getElementById('d-no').addEventListener('click',()=>cerrarDialogo(false));
// Escape o tocar fuera = no hacer nada (null): nunca entrega ni enseña soluciones por accidente
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialogo.hidden)cerrarDialogo(null);});
dialogo.addEventListener('click',e=>{if(e.target===dialogo)cerrarDialogo(null);});

// Nota sobre 10 redondeada al cuarto de punto (los empates suben)
const redondear=p=>Math.round(p/preguntas.length*10*4+1e-9)/4;
const notaTexto=n=>n.toFixed(2).replace('.',',');

// Bloquear / desbloquear. soloFallados=true deja editables únicamente los huecos fallados.
function bloquear(q,si,soloFallados){
  q.querySelectorAll('input[data-r]').forEach(i=>i.disabled=si&&!(soloFallados&&i.classList.contains('mal')));
  q.querySelectorAll('.grupo').forEach(g=>{const b=si&&!(soloFallados&&g.classList.contains('fallado'));g.classList.toggle('bloqueado',b);g.setAttribute('aria-disabled',b?'true':'false');});
  if(grid&&q.contains(grid))grid.classList.toggle('bloqueado',si&&!(soloFallados&&grid.classList.contains('fallado')));
  q.classList.toggle('bloqueada',si&&!(soloFallados&&q.querySelector('input.mal,.grupo.fallado,.grid.fallado')));
}
function bloquearTodo(si){preguntas.forEach(q=>bloquear(q,si,false));}

// ---------- pantalla de resultado ----------
const velo=document.createElement('div');velo.id='velo';
velo.innerHTML=`<div id="caja">
  <h2 id="r-titulo"></h2><div class="fecha" id="r-fecha"></div>
  <div class="estrellas" id="r-estrellas"></div>
  <div class="nota"><span id="r-nota"></span></div>
  <div class="sub" id="r-sub"></div>
  <div class="mensaje" id="r-mensaje"></div>
  <button class="corregir" id="b-corregir">✏️ Corregir los fallos</button>
  <button class="repasar" id="b-repasar">👀 Repasar</button>
  <button class="soluciones" id="b-soluciones">💡 Ver soluciones</button>
  <button class="reintentar" id="b-reintentar">🔄 Reintentar</button>
  <div class="historial" id="r-historial"></div>
</div>`;
document.body.appendChild(velo);
const volver=document.createElement('button');volver.id='volver';volver.textContent='Ver resultado';document.body.appendChild(volver);
const $=id=>document.getElementById(id);

const MENSAJES={
  perfecto:['¡Perfecto! 🌟 ¡Ni un fallo!','¡10! ¡Eres una crack! 🏆','¡Impresionante! Todo bien 🎉','¡Matrícula de honor! 🥇'],
  bien:['¡Muy bien! Repasa las que están en rojo.','¡Buen trabajo! Casi perfecto 👏','¡Genial! Un poquito más y lo bordas.','¡Qué bien! Mira las naranjas y rojas.'],
  regular:['¡Vas por buen camino! Repasa con calma.','No está mal. Fíjate en lo que falló.','¡Ánimo! Corrige los fallos y verás.','Sigue así, cada vez mejor 💪'],
  flojo:['No pasa nada, ¡a practicar! 💪','Hoy ha costado. Lo repasamos y a por otra.','Lo importante es aprender. ¡Vamos a corregirlo!','¡Tú puedes! Mira dónde te has liado.']
};
// Estrellas para que se vea de un vistazo: 3 desde 9, 2 desde 7, 1 desde 5
const estrellas=n=>n>=9?3:n>=7?2:n>=5?1:0;
function mensaje(p){const g=p===1?'perfecto':p>=.8?'bien':p>=.5?'regular':'flojo';const l=MENSAJES[g];return l[Math.floor(Math.random()*l.length)];}
function confeti(){
  const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:30';document.body.appendChild(c);
  const ctx=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;
  const cols=['#e4452c','#f7a823','#f7d21c','#4caf50','#2bb3d9','#8a4fc9','#ff8ac4'];
  const ps=Array.from({length:140},()=>({x:Math.random()*c.width,y:-20-Math.random()*c.height*0.5,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,r:4+Math.random()*5,a:Math.random()*6,va:(Math.random()-.5)*.3,col:cols[Math.floor(Math.random()*cols.length)]}));
  let t=0;(function paso(){ctx.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.a+=p.va;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=p.col;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore();});if(++t<220)requestAnimationFrame(paso);else c.remove();})();
}

function mostrarResultado(res){
  const corregido=res.notaCorr!=null;
  const nota=corregido?res.notaCorr:res.nota1;
  $('r-titulo').textContent=corregido?'Resultado tras corregir':'Resultado';
  $('r-fecha').textContent=fechaTexto(res.fecha);
  $('r-nota').textContent=notaTexto(nota)+' / 10';
  $('r-sub').textContent=(res.huecosBien!=null?res.huecosBien+' de '+res.huecosTotal+' huecos bien':'')+(corregido?' · Primer intento: '+notaTexto(res.nota1):'');
  $('r-mensaje').textContent=mensaje(nota/10);
  const n=estrellas(nota);$('r-estrellas').innerHTML=[0,1,2].map(i=>`<span class="${i<n?'llena':''}">★</span>`).join('');$('r-estrellas').setAttribute('aria-label',n+' de 3 estrellas');
  if(nota===10&&!res.yaCelebrado){res.yaCelebrado=true;escribir(CLAVE,res);if(!sinMovimiento())try{confeti();}catch(e){}}
  $('b-corregir').hidden=corregido||nota===10||!!res.vioSoluciones||!res.respuestas;
  $('b-soluciones').hidden=nota===10;
  const hist=leer(CLAVE_HIST)||[];
  $('r-historial').textContent=hist.length>1?'Intentos anteriores: '+hist.slice(0,-1).slice(-5).map(h=>notaTexto(h.nota1)+(h.notaCorr!=null?'→'+notaTexto(h.notaCorr):'')).join(' · '):'';
  velo.classList.add('visible');volver.classList.remove('visible');
  velo.classList.add('recien');setTimeout(()=>velo.classList.remove('recien'),400); // evita que un doble toque en "Entregar" pulse un botón del resultado
  actualizarProgreso();
  setTimeout(()=>{try{$(($('b-corregir').hidden?'b-repasar':'b-corregir')).focus({preventScroll:true});}catch(e){}},0);
}

// ---------- entregar ----------
const botonEntregar=document.getElementById('corregir');
botonEntregar.textContent='¡He terminado!';
botonEntregar.addEventListener('click',()=>{
  const vacios=preguntas.flatMap(huecosSinContestar);
  if(!vacios.length)return entregar();
  const faltan=preguntas.filter(q=>huecosSinContestar(q).length).map(q=>preguntas.indexOf(q)+1);
  const lista=faltan.length>1?faltan.slice(0,-1).join(', ')+' y '+faltan[faltan.length-1]:faltan[0];
  const texto=faltan.length===1?'🤔 Te falta por terminar la pregunta '+lista+'.':faltan.length<=3?'🤔 Te faltan por terminar las preguntas '+lista+'.':'🤔 Te faltan '+faltan.length+' preguntas por terminar.';
  preguntar(texto+' ¿Qué quieres hacer?','✏️ Seguir contestando','📨 Entregar así')
    .then(seguir=>{
      if(seguir===null)return;
      if(!seguir)return entregar();
      // marcar los huecos vacíos y llevarla al primero
      vacios.forEach(v=>v.classList.add('vacio'));const v0=vacios[0];irA(v0);
      if(v0.tagName==='INPUT')try{v0.focus({preventScroll:true});}catch(e){}
    });
});
function entregar(){
  const r=corregir();const nota=redondear(r.puntos);
  let res=leer(CLAVE);
  const hist=leer(CLAVE_HIST)||[];
  if(modo==='correccion'&&res){
    res.notaCorr=nota;res.fecha=new Date().toISOString();res.respuestas=recoger();res.huecosBien=r.huecosBien;res.huecosTotal=r.huecosTotal;res.tiposCorr=r.tipos;
    if(hist.length)hist[hist.length-1].notaCorr=nota;
  }else{
    res={fecha:new Date().toISOString(),titulo:document.title.split(' · ').slice(0,2).join(' · '),nota1:nota,notaCorr:null,huecosBien:r.huecosBien,huecosTotal:r.huecosTotal,tipos:r.tipos,respuestas:recoger()};
    hist.push({fecha:res.fecha,nota1:nota,notaCorr:null,tipos:r.tipos});
  }
  clearTimeout(tBorrador);escribir(CLAVE,res);escribir(CLAVE_HIST,hist.slice(-20));borrar(CLAVE_BORRADOR);
  if(window.noatestsSync)try{window.noatestsSync.subirIntento(CLAVE.slice('noatests-mates:'.length),hist[hist.length-1],res);}catch(e){}
  bloquearTodo(true);botonEntregar.style.display='none';modo='repaso';
  mostrarResultado(res);
}

// ---------- botones de la caja ----------
$('b-corregir').addEventListener('click',()=>{
  velo.classList.remove('visible');modo='correccion';guardarBorrador();
  // solo se pueden tocar los huecos fallados; los acertados quedan en verde y bloqueados
  preguntas.forEach(q=>bloquear(q,true,true));
  botonEntregar.textContent='¡Entregar corrección!';botonEntregar.style.display='block';actualizarProgreso();
  irA(document.querySelector('.pregunta.mal,.pregunta.medias'));
});
$('b-repasar').addEventListener('click',()=>{
  velo.classList.remove('visible');modo='repaso';bloquearTodo(true);botonEntregar.style.display='none';volver.classList.add('visible');actualizarProgreso();
  window.scrollTo({top:0,behavior:sinMovimiento()?'auto':'smooth'});
});
function mostrarSoluciones(){
  document.querySelectorAll('.solucion').forEach(e=>e.remove());
  preguntas.forEach(q=>{
    q.querySelectorAll('input[data-r]').forEach(i=>{if(!i.classList.contains('ok')){const b=document.createElement('span');b.className='solucion';b.textContent=i.dataset.r;i.insertAdjacentElement('afterend',b);}});
    q.querySelectorAll('.grupo').forEach(g=>{if(g.classList.contains('fallado')){const o=[...g.querySelectorAll('.opcion')].find(o=>norm(o.textContent)===norm(g.dataset.r));if(o)o.classList.add('correcta');}});
    if(grid&&q.contains(grid)&&grid.classList.contains('fallado')){const d=grid.querySelector(`.celda[data-r="${DEST.r}"][data-c="${DEST.c}"]`);if(d&&!d.textContent)d.textContent='✓';}
  });
}
$('b-soluciones').addEventListener('click',()=>{
  const res=leer(CLAVE);if(!res)return;
  if(!res.vioSoluciones&&res.notaCorr==null&&!$('b-corregir').hidden)
    preguntar('👀 Si ves las soluciones, ya no podrás corregir los fallos en este intento.','✏️ Mejor corrijo primero','💡 Ver soluciones').then(corregir=>{if(corregir===false)verSoluciones(res);});
  else verSoluciones(res);
});
function verSoluciones(res){
  clearTimeout(tBorrador);res.vioSoluciones=true;escribir(CLAVE,res);
  if(window.noatestsSync)try{const h=(leer(CLAVE_HIST)||[]).slice(-1)[0];if(h)window.noatestsSync.subirIntento(CLAVE.slice('noatests-mates:'.length),h,res);}catch(e){}
  velo.classList.remove('visible');modo='repaso';bloquearTodo(true);botonEntregar.style.display='none';volver.classList.add('visible');
  mostrarSoluciones();actualizarProgreso();
  irA(document.querySelector('.pregunta.mal,.pregunta.medias'));
}
$('b-reintentar').addEventListener('click',()=>{
  clearTimeout(tBorrador);borrar(CLAVE);borrar(CLAVE_BORRADOR);location.reload();
});
volver.addEventListener('click',()=>{const res=leer(CLAVE);if(res)mostrarResultado(res);});

// ---------- al abrir: ¿hay un intento guardado o un borrador? ----------
function arrancar(){
const guardado=leer(CLAVE);
const borrador=leer(CLAVE_BORRADOR);
if(guardado&&(guardado.respuestas||guardado.deOtroDispositivo)){
  if(guardado.respuestas){reponer(guardado.respuestas);corregir();}
  bloquearTodo(true);botonEntregar.style.display='none';modo='repaso';
  if(borrador&&borrador.modo==='correccion'&&guardado.notaCorr==null){
    // estaba a mitad de corregir: volver a ese punto con lo que llevaba
    preguntas.forEach(q=>bloquear(q,true,true));reponer(borrador.respuestas);modo='correccion';
    botonEntregar.textContent='¡Entregar corrección!';botonEntregar.style.display='block';
  }else{
    if(borrador)borrar(CLAVE_BORRADOR); // borrador viejo (ya se entregó o se corrigió, quizá en otro dispositivo)
    mostrarResultado(guardado);
  }
}else if(borrador&&borrador.respuestas){
  reponer(borrador.respuestas);
}
actualizarProgreso();
}
if(window.noatestsSync&&window.noatestsSync.activo()&&navigator.onLine){window.noatestsSync.bajar(CLAVE.slice('noatests-mates:'.length)).catch(()=>{}).then(arrancar);}else arrancar();
})();
