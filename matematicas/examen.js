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
// Cada pregunta vale 1 punto repartido entre sus huecos. Devuelve {puntos, huecosBien, huecosTotal}.
function corregir(){
  let puntos=0,huecosBien=0,huecosTotal=0;
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
    if(total)puntos+=bien/total;huecosBien+=bien;huecosTotal+=total;
  });
  return {puntos,huecosBien,huecosTotal};
}
// Nota sobre 10 redondeada al cuarto de punto (los empates suben)
const redondear=p=>Math.round(p/preguntas.length*10*4+1e-9)/4;
const notaTexto=n=>n.toFixed(2).replace('.',',');

// Bloquear / desbloquear. soloFallados=true deja editables únicamente los huecos fallados.
function bloquear(q,si,soloFallados){
  q.querySelectorAll('input[data-r]').forEach(i=>i.disabled=si&&!(soloFallados&&i.classList.contains('mal')));
  q.querySelectorAll('.grupo').forEach(g=>g.classList.toggle('bloqueado',si&&!(soloFallados&&g.classList.contains('fallado'))));
  if(grid&&q.contains(grid))grid.classList.toggle('bloqueado',si&&!(soloFallados&&grid.classList.contains('fallado')));
  q.classList.toggle('bloqueada',si&&!(soloFallados&&q.querySelector('input.mal,.grupo.fallado,.grid.fallado')));
}
function bloquearTodo(si){preguntas.forEach(q=>bloquear(q,si,false));}

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
  const corregido=res.notaCorr!=null;
  const nota=corregido?res.notaCorr:res.nota1;
  $('r-titulo').textContent=corregido?'Resultado tras corregir':'Resultado';
  $('r-fecha').textContent=fechaTexto(res.fecha);
  $('r-nota').textContent=notaTexto(nota)+' / 10';
  $('r-sub').textContent=(res.huecosBien!=null?res.huecosBien+' de '+res.huecosTotal+' huecos bien':'')+(corregido?' · Primer intento: '+notaTexto(res.nota1):'');
  $('r-mensaje').textContent=mensaje(nota/10);
  $('b-corregir').hidden=corregido||nota===10;
  const hist=leer(CLAVE_HIST)||[];
  $('r-historial').textContent=hist.length>1?'Intentos anteriores: '+hist.slice(0,-1).slice(-5).map(h=>notaTexto(h.nota1)+(h.notaCorr!=null?'→'+notaTexto(h.notaCorr):'')).join(' · '):'';
  velo.classList.add('visible');volver.classList.remove('visible');
}

// ---------- entregar ----------
const botonEntregar=document.getElementById('corregir');
botonEntregar.textContent='¡Entregar examen!';
botonEntregar.addEventListener('click',()=>{
  const r=corregir();const nota=redondear(r.puntos);
  let res=leer(CLAVE);
  const hist=leer(CLAVE_HIST)||[];
  if(modo==='correccion'&&res){
    res.notaCorr=nota;res.fecha=new Date().toISOString();res.respuestas=recoger();res.huecosBien=r.huecosBien;res.huecosTotal=r.huecosTotal;
    if(hist.length)hist[hist.length-1].notaCorr=nota;
  }else{
    res={fecha:new Date().toISOString(),nota1:nota,notaCorr:null,huecosBien:r.huecosBien,huecosTotal:r.huecosTotal,respuestas:recoger()};
    hist.push({fecha:res.fecha,nota1:nota,notaCorr:null});
  }
  escribir(CLAVE,res);escribir(CLAVE_HIST,hist.slice(-20));
  bloquearTodo(true);botonEntregar.style.display='none';modo='repaso';
  mostrarResultado(res);
});

// ---------- botones de la caja ----------
$('b-corregir').addEventListener('click',()=>{
  velo.classList.remove('visible');modo='correccion';
  // solo se pueden tocar los huecos fallados; los acertados quedan en verde y bloqueados
  preguntas.forEach(q=>bloquear(q,true,true));
  botonEntregar.textContent='¡Entregar corrección!';botonEntregar.style.display='block';
  const primera=document.querySelector('.pregunta.mal,.pregunta.medias');if(primera)primera.scrollIntoView({behavior:'smooth',block:'center'});
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
