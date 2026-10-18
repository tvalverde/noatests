/* Lógica común de los exámenes de matemáticas.
   Cada examen solo define sus preguntas en el HTML:
   - <input type="text" data-r="respuesta">            → hueco. Los números deben escribirse con punto de millar (1.234).
   - <span class="grupo" data-r="opción"> con .opcion   → elegir una opción.
   - <div class="grid" data-start="f,c" data-dest="f,c" data-label="M"> → cuadrícula 6x6, tocar la casilla destino.
   Una pregunta (.pregunta) cuenta como acertada solo si todo lo que contiene está bien.
   El último intento se guarda en localStorage y se permite UNA corrección por intento. */
(function(){
'use strict';

const CLAVE='noatests-mates:'+location.pathname.replace(/\/index\.html$/,'/');
const CLAVE_HIST=CLAVE+':historial';

// ---------- utilidades ----------
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
const esNumero=s=>/^[0-9.,]+$/.test(String(s).trim());
const formatoES=s=>/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(String(s).trim());
function correcta(valor,esperado){
  valor=String(valor).trim();
  if(esNumero(esperado)) return formatoES(valor)&&valor===esperado;
  return norm(valor)===norm(esperado);
}
const fechaTexto=iso=>{const d=new Date(iso);return d.toLocaleDateString('es-ES',{day:'numeric',month:'long'})+' a las '+d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});};
function leer(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
function escribir(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

// ---------- elementos ----------
const preguntas=[...document.querySelectorAll('.pregunta')];
const inputs=[...document.querySelectorAll('input[data-r]')];
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
  const d=grid.querySelector(`.celda[data-r="${r}"][data-c="${c}"]`);d.classList.add('x');d.textContent='X';marcada={r,c};
}

// Opciones
grupos.forEach(g=>g.querySelectorAll('.opcion').forEach(o=>o.addEventListener('click',()=>{
  if(g.classList.contains('bloqueado'))return;
  g.querySelectorAll('.opcion').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');
})));

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
  inputs.forEach((i,k)=>i.value=r.inputs[k]||'');
  grupos.forEach((g,k)=>{const ops=g.querySelectorAll('.opcion');ops.forEach(o=>o.classList.remove('sel'));if(r.grupos[k]>=0&&ops[r.grupos[k]])ops[r.grupos[k]].classList.add('sel');});
  if(grid)marcar(r.grid?r.grid.r:null,r.grid?r.grid.c:null);
}

// ---------- corrección ----------
function corregir(){
  let aciertos=0;
  preguntas.forEach(q=>{
    let bien=true;
    q.querySelectorAll('input[data-r]').forEach(i=>{
      i.classList.remove('ok','mal');const b=correcta(i.value,i.dataset.r);i.classList.add(b?'ok':'mal');if(!b)bien=false;
    });
    q.querySelectorAll('.grupo').forEach(g=>{
      const sel=g.querySelector('.opcion.sel');g.querySelectorAll('.opcion').forEach(o=>o.classList.remove('ok','mal'));
      const b=!!sel&&norm(sel.textContent)===norm(g.dataset.r);if(sel)sel.classList.add(b?'ok':'mal');if(!b)bien=false;
    });
    if(grid&&q.contains(grid)){
      grid.querySelectorAll('.celda').forEach(c=>c.classList.remove('ok','mal'));
      grid.querySelector(`.celda[data-r="${DEST.r}"][data-c="${DEST.c}"]`).classList.add('ok');
      const b=!!marcada&&marcada.r===DEST.r&&marcada.c===DEST.c;
      if(!b){bien=false;if(marcada)grid.querySelector(`.celda[data-r="${marcada.r}"][data-c="${marcada.c}"]`).classList.add('mal');}
    }
    q.classList.remove('ok','mal');q.classList.add(bien?'ok':'mal');
    if(bien)aciertos++;
  });
  return aciertos;
}
function limpiarMarcas(){
  document.querySelectorAll('.ok,.mal').forEach(e=>e.classList.remove('ok','mal'));
}

// Bloquear / desbloquear
function bloquear(q,si){
  q.classList.toggle('bloqueada',si);
  q.querySelectorAll('input[data-r]').forEach(i=>i.disabled=si);
  q.querySelectorAll('.grupo').forEach(g=>g.classList.toggle('bloqueado',si));
  if(grid&&q.contains(grid))grid.classList.toggle('bloqueado',si);
}
function bloquearTodo(si){preguntas.forEach(q=>bloquear(q,si));}

// ---------- pantalla de resultado ----------
const velo=document.createElement('div');velo.id='velo';
velo.innerHTML=`<div id="caja">
  <h2 id="r-titulo"></h2><div class="fecha" id="r-fecha"></div>
  <div class="nota"><span id="r-nota"></span></div>
  <div class="sub" id="r-sub"></div>
  <div class="mensaje" id="r-mensaje"></div>
  <button class="corregir" id="b-corregir">✏️ Corregir los fallos</button>
  <button class="repasar" id="b-repasar">👀 Repasar</button>
  <button class="reintentar" id="b-reintentar">🔄 Reintentar</button>
  <div class="historial" id="r-historial"></div>
</div>`;
document.body.appendChild(velo);
const volver=document.createElement('button');volver.id='volver';volver.textContent='Ver resultado';document.body.appendChild(volver);
const $=id=>document.getElementById(id);

function mensaje(p){return p===1?'¡Perfecto! 🌟':p>=.7?'¡Muy bien! Repasa las preguntas en rojo.':'Sigue practicando, ¡tú puedes! 💪';}

function mostrarResultado(res){
  const total=preguntas.length;
  const corregido=res.notaCorr!=null;
  $('r-titulo').textContent=corregido?'Resultado tras corregir':'Resultado';
  $('r-fecha').textContent=fechaTexto(res.fecha);
  $('r-nota').textContent=(corregido?res.notaCorr:res.nota1)+' / '+total;
  $('r-sub').textContent=corregido?'Primer intento: '+res.nota1+' / '+total:'';
  $('r-mensaje').textContent=mensaje((corregido?res.notaCorr:res.nota1)/total);
  const perfecto=(corregido?res.notaCorr:res.nota1)===total;
  $('b-corregir').hidden=corregido||perfecto;
  const hist=leer(CLAVE_HIST)||[];
  $('r-historial').textContent=hist.length>1?'Intentos anteriores: '+hist.slice(0,-1).slice(-5).map(h=>h.nota1+(h.notaCorr!=null?'→'+h.notaCorr:'')).join(', ')+' (de '+total+')':'';
  velo.classList.add('visible');volver.classList.remove('visible');
}

// ---------- entregar ----------
const botonEntregar=document.getElementById('corregir');
botonEntregar.textContent='¡Entregar examen!';
botonEntregar.addEventListener('click',()=>{
  const aciertos=corregir();
  let res=leer(CLAVE);
  const hist=leer(CLAVE_HIST)||[];
  if(modo==='correccion'&&res){
    res.notaCorr=aciertos;res.fecha=new Date().toISOString();res.respuestas=recoger();
    if(hist.length)hist[hist.length-1].notaCorr=aciertos;
  }else{
    res={fecha:new Date().toISOString(),nota1:aciertos,notaCorr:null,total:preguntas.length,respuestas:recoger()};
    hist.push({fecha:res.fecha,nota1:aciertos,notaCorr:null});
  }
  escribir(CLAVE,res);escribir(CLAVE_HIST,hist.slice(-20));
  bloquearTodo(true);botonEntregar.style.display='none';modo='repaso';
  mostrarResultado(res);
});

// ---------- botones de la caja ----------
$('b-corregir').addEventListener('click',()=>{
  velo.classList.remove('visible');modo='correccion';
  // solo se pueden tocar las preguntas falladas; las acertadas quedan en verde y bloqueadas
  preguntas.forEach(q=>bloquear(q,q.classList.contains('ok')));
  botonEntregar.textContent='¡Entregar corrección!';botonEntregar.style.display='block';
  const primera=document.querySelector('.pregunta.mal');if(primera)primera.scrollIntoView({behavior:'smooth',block:'center'});
});
$('b-repasar').addEventListener('click',()=>{
  velo.classList.remove('visible');modo='repaso';bloquearTodo(true);botonEntregar.style.display='none';volver.classList.add('visible');
  window.scrollTo({top:0,behavior:'smooth'});
});
$('b-reintentar').addEventListener('click',()=>{
  localStorage.removeItem(CLAVE);location.reload();
});
volver.addEventListener('click',()=>{const res=leer(CLAVE);if(res)mostrarResultado(res);});

// ---------- al abrir: ¿hay un intento guardado? ----------
const guardado=leer(CLAVE);
if(guardado&&guardado.respuestas){
  reponer(guardado.respuestas);corregir();bloquearTodo(true);botonEntregar.style.display='none';modo='repaso';
  mostrarResultado(guardado);
}
})();
