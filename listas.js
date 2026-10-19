/* Pinta las listas de la portada, de cada materia y de cada tema a partir de catalogo.json,
   y añade la última nota guardada en este navegador junto a cada examen de matemáticas.
   Uso: <main data-lista="portada|materia|tema" data-materia="…" data-tema="…"></main> + <script src="…/listas.js"> */
(function(){
'use strict';
const main=document.querySelector('main[data-lista]');if(!main)return;
const RAIZ=location.pathname.replace(/\/index\.html$/,'/').split('/').slice(0,2).join('/')+'/'; // /noatests/ (o / en local)
const n=v=>v.toFixed(2).replace('.',',');
function rutaDe(m,t,e){return RAIZ+m.id+'/'+(t.id?t.id+'/':'')+(e?e.id+'/':'');}
function notaDe(ruta){try{return JSON.parse(localStorage.getItem('noatests-mates:'+ruta));}catch(e){return null;}}
function etiquetaNota(res){
  if(!res)return '';
  const col=res.nota1>=8?'#4caf50':res.nota1>=5?'#f7a823':'#e4452c';
  return `<b class="nota-lista" style="background:${col}">${res.notaCorr!=null?n(res.nota1)+' → '+n(res.notaCorr):n(res.nota1)}</b>`;
}
function tarjeta(href,titulo,desc,color,extra){return `<a class="examen" href="${href}" style="border-left-color:${color}">${titulo}${extra||''}<span>${desc||''}</span></a>`;}
fetch(RAIZ+'catalogo.json').then(r=>r.json()).then(cat=>{
  const tipo=main.dataset.lista;let html='';
  if(tipo==='portada'){
    cat.materias.forEach(m=>{html+=tarjeta(m.id+'/',m.nombre,m.descripcion,m.color);});
    html+=tarjeta('notas/','Mis notas','Exámenes hechos, medias por tema y qué se te da mejor','#2bb3d9');
  }else if(tipo==='materia'){
    const m=cat.materias.find(x=>x.id===main.dataset.materia);if(!m)return;
    m.temas.forEach(t=>{
      if(!t.id){t.examenes.forEach(e=>{html+=tarjeta(e.id+'/',e.nombre,e.descripcion,m.color);});return;}
      const hechos=t.examenes.filter(e=>notaDe(rutaDe(m,t,e))).length;
      html+=tarjeta(t.id+'/',t.nombre,(t.descripcion||'')+' · '+t.examenes.length+' exámenes'+(hechos?' · '+hechos+' hechos':''),m.color);
    });
  }else if(tipo==='tema'){
    const m=cat.materias.find(x=>x.id===main.dataset.materia);const t=m&&m.temas.find(x=>x.id===main.dataset.tema);if(!t)return;
    t.examenes.forEach(e=>{html+=tarjeta(e.id+'/',e.nombre,e.descripcion,m.color,m.evaluable?etiquetaNota(notaDe(rutaDe(m,t,e))):'');});
  }
  main.innerHTML=html;
}).catch(()=>{main.innerHTML='<p style="text-align:center;color:#777">No se ha podido cargar la lista.</p>';});
})();
