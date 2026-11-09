/* Página para padres: el temario de cada tema (temario/<materia>/<tema>.json) y cada pregunta de cada ejercicio
   con su contenido y las páginas del libro, para revisar cuando se quiera. Solo lee; no guarda nada. */
(function(){
'use strict';
const RAIZ=location.pathname.replace(/\/index\.html$/,'/').split('/').slice(0,2).join('/')+'/';
const caja=document.getElementById('temas');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const miles=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const fechaES=iso=>{try{return new Date(iso).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});}catch(e){return iso;}};
const pags=p=>(/[-,]/.test(String(p))?'páginas ':'página ')+p;
const json=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();});
const texto=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(r.status);return r.text();});

// Preguntas de un ejercicio: número, contenido y enunciado (sin el número)
function preguntasDe(html){
  const d=new DOMParser().parseFromString(html,'text/html');
  return [...d.querySelectorAll('.pregunta')].map(q=>{const h=q.querySelector('h2');const c=h?h.cloneNode(true):null;if(c)c.querySelectorAll('.num,button').forEach(x=>x.remove());
    return {tipo:q.dataset.tipo||'',enunciado:c?c.textContent.replace(/\s+/g,' ').trim():''};});
}

json(RAIZ+'catalogo.json').then(async cat=>{
  let html='';
  for(const m of cat.materias.filter(m=>m.evaluable)){
    for(const t of m.temas){
      let tm=null;try{tm=await json(RAIZ+'temario/'+m.id+'/'+t.id+'.json');}catch(e){}
      html+=`<section class="tema" id="${esc(m.id+'-'+t.id)}" style="--c:${esc(m.color)}">`;
      html+=`<h2>${esc(m.icono||'')} ${esc(m.nombre)} · ${esc(t.nombre)}`;
      if(!tm){html+=' <span class="estado pendiente">Sin temario</span></h2><p>Este tema todavía no tiene temario escrito.</p></section>';continue;}
      html+=tm.estado==='revisado'?` <span class="estado revisado">Revisado${tm.revisado_el?' el '+esc(fechaES(tm.revisado_el)):''}</span>`:' <span class="estado pendiente">Pendiente de revisar</span>';
      html+=`</h2><p class="libro">${esc(tm.libro)} · páginas ${esc(tm.paginas)}</p><p class="resumen">${esc(tm.resumen)}</p>`;
      // ejercicios: cuántas preguntas de cada contenido
      const ejercicios=[];
      for(const e of t.examenes){let ps=[];try{ps=preguntasDe(await texto(RAIZ+m.id+'/'+t.id+'/'+e.id+'/index.html'));}catch(err){}ejercicios.push({e,ps});}
      const cuenta={};ejercicios.forEach(x=>x.ps.forEach(p=>{cuenta[p.tipo]=(cuenta[p.tipo]||0)+1;}));
      html+='<h3>Qué entra</h3><div class="tabla"><table><tr><th>Contenido</th><th>Páginas</th><th>Qué entra</th><th>Preguntas</th></tr>'+
        Object.entries(tm.contenidos).map(([tipo,c])=>`<tr><td><b>${esc((m.contenidos||{})[tipo]||tipo)}</b></td><td class="pag">${esc(c.paginas)}</td><td>${esc(c.que)}</td><td class="n">${cuenta[tipo]||0}</td></tr>`).join('')+'</table></div>';
      html+=`<p class="limites"><b>Fuera del tema:</b> ${esc(tm.fuera_de_temario||'—')}<br><b>Números:</b> hasta ${miles(tm.numeros.maximo)}${tm.numeros.decimales?', con decimales':', sin decimales'}<br><b>Palabras que no pueden salir:</b> ${esc((tm.prohibido||[]).join(', ')||'—')}${tm.notas_revision?'<br><b>Notas:</b> '+esc(tm.notas_revision):''}</p>`;
      html+='<h3>Ejercicios</h3>'+ejercicios.map(({e,ps})=>`<details><summary>${esc(e.nombre)} · ${ps.length} preguntas</summary><ol class="preguntas">`+
        ps.map(p=>{const c=tm.contenidos[p.tipo];return `<li>${esc(p.enunciado)}<span class="meta">${c?esc((m.contenidos||{})[p.tipo]||p.tipo)+' · '+esc(pags(c.paginas)):'<span class="fuera">Fuera del temario: '+esc(p.tipo)+'</span>'}</span></li>`;}).join('')+
        `</ol><a href="../${esc(m.id+'/'+t.id+'/'+e.id+'/')}">Abrir el ejercicio ›</a></details>`).join('');
      html+='</section>';
    }
  }
  caja.innerHTML=html||'<p class="error-lista">No hay temas evaluables.</p>';
}).catch(()=>{caja.innerHTML='<p class="error-lista">No se ha podido cargar el temario. Comprueba la conexión y vuelve a intentarlo.</p>';});
})();
