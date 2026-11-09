/* Pinta las listas de la portada, de cada materia y de cada tema a partir de catalogo.json,
   con lo guardado en este navegador: nota y estrellas de cada examen, cuántos lleva hechos y qué tiene a medias.
   Uso: <main data-lista="portada|materia|tema" data-materia="…" data-tema="…"></main> + <script src="…/listas.js"> */
(function(){
'use strict';
const main=document.querySelector('main[data-lista]');if(!main)return;
const RAIZ=location.pathname.replace(/\/index\.html$/,'/').split('/').slice(0,2).join('/')+'/'; // /noatests/ (o / en local)
const PREF='noatests-mates:';
const n=v=>(+v).toFixed(2).replace('.',',');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function leer(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
const rutaDe=(m,t,e)=>RAIZ+m.id+'/'+(t.id?t.id+'/':'')+(e?e.id+'/':'');
// Último intento guardado; si está estropeado (sin nota numérica) se ignora para no romper la lista
const notaDe=ruta=>{const r=leer(PREF+ruta);return r&&typeof r==='object'&&typeof r.nota1==='number'&&isFinite(r.nota1)?r:null;};
// Nota que cuenta para las estrellas: la final (tras corregir si se corrigió), igual que en la pantalla del resultado
const notaFinal=res=>typeof res.notaCorr==='number'?res.notaCorr:res.nota1;
// Un examen está "a medias" si tiene borrador con algo escrito y todavía no se ha entregado
function aMedias(ruta){
  const b=leer(PREF+ruta+':borrador');if(!b||typeof b!=='object'||!b.respuestas)return false;
  const res=notaDe(ruta);
  if(b.modo==='correccion')return !!res&&res.notaCorr==null&&!res.vioSoluciones;
  const r=b.respuestas;return !res&&((r.inputs||[]).some(v=>String(v).trim())||(r.grupos||[]).some(g=>g>=0)||!!r.grid);
}
const estrellas=v=>v>=9?3:v>=7?2:v>=5?1:0;
const pintaEstrellas=v=>{const k=estrellas(v);return `<span class="estrellas-lista" aria-label="${k} de 3 estrellas">${'★'.repeat(k)}<i>${'★'.repeat(3-k)}</i></span>`;};
const colorNota=v=>v>=8?'#4caf50':v>=5?'#f7a823':'#e4452c';
function etiquetaNota(res){
  if(!res)return '';
  return `<span class="lado"><b class="nota-lista" style="background:${colorNota(res.nota1)}">${res.notaCorr!=null?n(res.nota1)+' → '+n(res.notaCorr):n(res.nota1)}</b>${pintaEstrellas(notaFinal(res))}</span>`;
}
const barra=(hechos,total,color)=>total?`<span class="avance" aria-hidden="true"><i style="width:${Math.round(hechos/total*100)}%;background:${color}"></i></span>`:'';
function tarjeta(href,titulo,desc,color,extra,clase){
  return `<a class="examen${clase?' '+clase:''}" href="${esc(href)}" style="border-left-color:${color}">${titulo}${extra||''}<span>${desc||''}</span></a>`;
}
function examenesDe(m){const r=[];m.temas.forEach(t=>t.examenes.forEach(e=>r.push({t,e,ruta:rutaDe(m,t,e)})));return r;}

fetch(RAIZ+'catalogo.json').then(r=>r.json()).then(cat=>{
  const tipo=main.dataset.lista;let html='';
  if(tipo==='portada'){
    html+='<p class="saludo">¡Hola, Noa! 👋 ¿Qué te apetece hacer hoy?</p>';
    // lo que tiene empezado, para seguir donde lo dejó
    const pendientes=[];
    cat.materias.filter(m=>m.evaluable).forEach(m=>examenesDe(m).forEach(x=>{if(aMedias(x.ruta))pendientes.push({m,...x});}));
    if(pendientes.length)html+='<section class="a-medias"><h2>✏️ Tienes a medias</h2>'+pendientes.slice(0,3).map(x=>
      `<a class="seguir" href="${esc(x.ruta)}" style="border-color:${x.m.color}">${x.m.icono||''} ${esc(x.e.nombre)} · ${esc(x.m.nombre)}<span>Seguir donde lo dejaste ›</span></a>`).join('')+'</section>';
    html+='<div class="mosaico">';
    cat.materias.forEach(m=>{
      const ex=examenesDe(m);const hechos=m.evaluable?ex.filter(x=>notaDe(x.ruta)).length:0;
      const desc=m.evaluable?`${esc(m.descripcion||'')}<br><b>${hechos} de ${ex.length} hechos</b>${barra(hechos,ex.length,m.color)}`:esc(m.descripcion||'');
      html+=tarjeta(m.id+'/',`<em class="icono">${m.icono||'📘'}</em>${esc(m.nombre)}`,desc,m.color,'','materia');
    });
    html+=tarjeta('notas/','<em class="icono">⭐</em>Mis notas','Tus notas, tus estrellas y lo que mejor llevas','#f7a823','','materia');
    html+='</div><p class="padres"><a href="temario/">👨‍👩‍👧 Para padres: temario y revisión de los ejercicios</a></p>';
  }else if(tipo==='materia'){
    const m=cat.materias.find(x=>x.id===main.dataset.materia);if(!m)return;
    m.temas.forEach(t=>{
      if(!t.id){t.examenes.forEach(e=>{html+=tarjeta(e.id+'/',esc(e.nombre),esc(e.descripcion),m.color);});return;}
      const hechos=t.examenes.filter(e=>notaDe(rutaDe(m,t,e))).length;
      html+=tarjeta(t.id+'/',esc(t.nombre),esc(t.descripcion||'')+' · '+t.examenes.length+' ejercicios'+(hechos?' · '+hechos+' hechos':'')+barra(hechos,t.examenes.length,m.color),m.color);
    });
  }else if(tipo==='tema'){
    const m=cat.materias.find(x=>x.id===main.dataset.materia);const t=m&&m.temas.find(x=>x.id===main.dataset.tema);if(!t)return;
    t.examenes.forEach(e=>{const ruta=rutaDe(m,t,e);const res=m.evaluable?notaDe(ruta):null;
      const pend=m.evaluable&&aMedias(ruta)?'<b class="pendiente">✏️ A medias</b> ':'';
      html+=tarjeta(e.id+'/',esc(e.nombre),pend+esc(e.descripcion),m.color,etiquetaNota(res),res?'con-nota':'');});
  }
  main.innerHTML=html;
}).catch(()=>{main.innerHTML='<p class="error-lista">No se ha podido cargar la lista. Comprueba la conexión y vuelve a intentarlo.</p>';});
})();
