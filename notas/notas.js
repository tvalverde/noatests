/* Mis notas: agrupa lo guardado en este navegador por materia → tema → examen, usando catalogo.json
   para los nombres y para listar también los exámenes sin hacer. No modifica nada en localStorage. */
(function(){
'use strict';
const NOMBRES={'leer-escribir':'Leer y escribir números','descomponer':'Descomponer números','valor-posicion':'Valor de cada cifra','recta':'Rectas numéricas','comparar':'Comparar números','ordenar':'Ordenar números','redondear':'Redondear','estimar':'Estimar sumas y restas','plano':'Planos','traslacion':'Traslaciones','otros':'Otros'};
const RAIZ=location.pathname.replace(/\/index\.html$/,'/').split('/').slice(0,2).join('/')+'/';
const n=v=>v.toFixed(2).replace('.',',');
const fecha=iso=>new Date(iso).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function leer(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
const PREF='noatests-mates:';

// Datos guardados por ruta: {ultimo, historial}
function datosDe(ruta){
  const ultimo=leer(PREF+ruta);const historial=leer(PREF+ruta+':historial')||[];
  return {ultimo,historial};
}
// Nota que cuenta para la media: primer intento del último intento entregado
function notaExamen(d){
  if(d.historial.length)return d.historial[d.historial.length-1].nota1;
  return d.ultimo&&d.ultimo.nota1!=null?d.ultimo.nota1:null;
}
function media(notas){const v=notas.filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}
function mediaHtml(m,hechos,total){
  return m==null?`<span class="media sin">sin exámenes hechos</span>`:`<span class="media">media ${n(m)}${total?` · ${hechos} de ${total}`:''}</span>`;
}
function tiposHtml(ex){ // ex: lista de {historial}
  const tipos={};
  ex.forEach(d=>d.historial.forEach(h=>{if(h.tipos)for(const t in h.tipos){tipos[t]=tipos[t]||{bien:0,total:0};tipos[t].bien+=h.tipos[t].bien;tipos[t].total+=h.tipos[t].total;}}));
  const lista=Object.entries(tipos).filter(([,v])=>v.total).map(([t,v])=>[t,v.bien/v.total]).sort((a,b)=>b[1]-a[1]);
  if(!lista.length)return '';
  return '<h3>Qué se me da mejor y peor en este tema</h3><table>'+lista.map(([t,p])=>`<tr><td style="width:45%">${NOMBRES[t]||t}</td><td><div class="barra ${p<.5?'mal':p<.8?'medio':''}"><i style="width:${Math.round(p*100)}%"></i></div></td><td class="nota">${Math.round(p*100)}%</td></tr>`).join('')+'</table><p class="aviso">Con todos los intentos de este tema (primer intento, sin contar correcciones).</p>';
}
function filaExamen(e,ruta,d){
  const nota=notaExamen(d);const href=esc(ruta);
  if(nota==null)return `<tr class="sin"><td><a href="${href}">${esc(e.nombre)}</a></td><td class="nota">sin hacer</td><td></td><td></td></tr>`;
  const u=d.historial[d.historial.length-1]||d.ultimo;
  const corr=u&&u.notaCorr!=null?' → '+n(u.notaCorr):'';
  const intentos=d.historial.length>1?`${d.historial.length} intentos`:'';
  return `<tr><td><a href="${href}">${esc(e.nombre)}</a></td><td class="nota">${n(nota)}${corr}</td><td class="fecha">${u&&u.fecha?fecha(u.fecha):''}</td><td class="fecha">${intentos}</td></tr>`;
}
function fechaUltimaArts(ruta){
  // Arts guarda los dibujos en localStorage con clave noatests-arts-<examen>; no hay nota, solo si hay dibujos
  const clave='noatests-arts-'+ruta.split('/').filter(Boolean).pop();
  const d=leer(clave);return d&&d.some(x=>x&&x.img)?true:false;
}

fetch(RAIZ+'catalogo.json').then(r=>r.json()).then(cat=>{
  let html='';let algo=false;
  cat.materias.forEach((m,mi)=>{
    const rutaM=RAIZ+m.id+'/';
    if(!m.evaluable){
      const hechos=m.temas.flatMap(t=>t.examenes.map(e=>({e,ruta:rutaM+(t.id?t.id+'/':'')+e.id+'/'}))).filter(x=>fechaUltimaArts(x.ruta));
      html+=`<section class="materia" style="border-left-color:${m.color}"><h2>${esc(m.nombre)}<span class="media sin">sin nota</span></h2><div class="arts">${hechos.length?'Dibujos hechos: '+hechos.map(x=>`<a href="${esc(x.ruta)}">${esc(x.e.nombre)}</a>`).join(', '):'Todavía no hay dibujos guardados.'}</div></section>`;
      if(hechos.length)algo=true;return;
    }
    const notasMateria=[];let temasHtml='';
    m.temas.forEach((t,ti)=>{
      const exs=t.examenes.map(e=>{const ruta=rutaM+(t.id?t.id+'/':'')+e.id+'/';return {e,ruta,d:datosDe(ruta)};});
      const notas=exs.map(x=>notaExamen(x.d));const hechos=notas.filter(x=>x!=null).length;const med=media(notas);
      notas.forEach(x=>{if(x!=null)notasMateria.push(x);});if(hechos)algo=true;
      const abierto=ti===m.temas.length-1?' open':'';
      temasHtml+=`<details class="tema"${abierto}><summary><span>${esc(t.nombre)}<span class="sub">${esc(t.descripcion||'')}</span></span>${mediaHtml(med,hechos,t.examenes.length)}</summary><div class="cuerpo">`+
        '<table><tr><th>Examen</th><th>Nota</th><th>Fecha</th><th></th></tr>'+exs.map(x=>filaExamen(x.e,x.ruta,x.d)).join('')+'</table>'+tiposHtml(exs.map(x=>x.d))+'</div></details>';
    });
    html+=`<section class="materia" style="border-left-color:${m.color}"><h2>${esc(m.nombre)}${mediaHtml(media(notasMateria),notasMateria.length,0)}</h2>${temasHtml}</section>`;
  });
  html+='<p class="aviso">Las notas se guardan en este dispositivo. Si hace un examen en otro móvil o tablet, sus notas estarán allí. La media usa la nota del primer intento de cada examen (sin contar correcciones).</p>';
  document.getElementById('contenido').innerHTML=html;
}).catch(()=>{document.getElementById('contenido').innerHTML='<div class="vacio">No se ha podido cargar el catálogo.</div>';});
})();
