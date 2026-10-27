/* Mis notas, navegable por pantallas: resumen → materia → tema → examen.
   Cada pantalla tiene su dirección (#/materia/tema/examen), así funcionan el botón atrás y las migas.
   Todo sale de catalogo.json + lo guardado en este navegador. No modifica nada en localStorage. */
(function(){
'use strict';
const NOMBRES={'leer-escribir':'Leer y escribir números','descomponer':'Descomponer números','valor-posicion':'Valor de cada cifra','recta':'Rectas numéricas','comparar':'Comparar números','ordenar':'Ordenar números','redondear':'Redondear','estimar':'Estimar sumas y restas','plano':'Planos','traslacion':'Traslaciones','otros':'Otros'};
const RAIZ=location.pathname.replace(/\/index\.html$/,'/').split('/').slice(0,2).join('/')+'/';
const PREF='noatests-mates:';
const n=v=>(+v).toFixed(2).replace('.',',');
const fechaCorta=iso=>new Date(iso).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
const fechaLarga=iso=>new Date(iso).toLocaleString('es-ES',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function leer(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
const colorNota=v=>v>=8?'#4caf50':v>=5?'#f7a823':'#e4452c';

// ---------- datos ----------
const rutaDe=(m,t,e)=>RAIZ+m.id+'/'+(t.id?t.id+'/':'')+(e?e.id+'/':'');
function datosDe(ruta){return {ultimo:leer(PREF+ruta),historial:leer(PREF+ruta+':historial')||[]};}
// Nota que cuenta para la media: primer intento del último intento entregado
function notaExamen(d){
  if(d.historial.length)return d.historial[d.historial.length-1].nota1;
  return d.ultimo&&d.ultimo.nota1!=null?d.ultimo.nota1:null;
}
function ultimoDe(d){return d.historial[d.historial.length-1]||d.ultimo||null;}
const media=v=>{v=v.filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
function resumenTema(m,t){
  const exs=t.examenes.map(e=>{const ruta=rutaDe(m,t,e);const d=datosDe(ruta);return {e,ruta,d,nota:notaExamen(d)};});
  const hechos=exs.filter(x=>x.nota!=null);
  const ultimo=hechos.map(x=>({x,f:ultimoDe(x.d).fecha})).sort((a,b)=>String(b.f).localeCompare(String(a.f)))[0];
  return {exs,hechos:hechos.length,total:exs.length,media:media(exs.map(x=>x.nota)),ultimo};
}
function resumenMateria(m){
  const temas=m.temas.map(t=>({t,r:resumenTema(m,t)}));
  const notas=temas.flatMap(x=>x.r.exs.map(e=>e.nota));
  const ultimo=temas.map(x=>x.r.ultimo).filter(Boolean).sort((a,b)=>String(b.f).localeCompare(String(a.f)))[0];
  return {temas,media:media(notas),hechos:notas.filter(x=>x!=null).length,total:notas.length,ultimo};
}
function dibujosArts(e){
  const d=leer('noatests-arts-'+e.id);return Array.isArray(d)?d.filter(x=>x&&x.img):[];
}

// ---------- piezas ----------
const insignia=(v,txt)=>v==null?`<span class="media sin">${txt||'sin hacer'}</span>`:`<span class="media" style="background:${colorNota(v)};color:#fff">${txt||n(v)}</span>`;
function tarjeta(href,titulo,sub,derecha,color){
  return `<a class="tarjeta" href="${esc(href)}" style="border-left-color:${color||'#2bb3d9'}"><span class="tt"><b>${esc(titulo)}</b>${sub?`<span class="sub">${sub}</span>`:''}</span>${derecha||''}<span class="flecha">›</span></a>`;
}
function agregarTipos(historiales){
  const tipos={};
  historiales.forEach(hist=>hist.forEach(h=>{if(h&&h.tipos)for(const t in h.tipos){tipos[t]=tipos[t]||{bien:0,total:0};tipos[t].bien+=h.tipos[t].bien;tipos[t].total+=h.tipos[t].total;}}));
  return Object.entries(tipos).filter(([,v])=>v.total).map(([t,v])=>({tipo:t,p:v.bien/v.total,total:v.total}));
}
// Línea de resumen: lo mejor y lo que hay que repasar (vacío si no hay datos)
function resumenTipos(lista){
  if(!lista.length)return '';
  const ord=lista.slice().sort((a,b)=>b.p-a.p||b.total-a.total);
  const mejor=ord[0],peor=ord[ord.length-1];
  let h=`<div class="resumen-tipos"><span>👍 Lo que mejor llevas: <b>${NOMBRES[mejor.tipo]||esc(mejor.tipo)}</b> (${Math.round(mejor.p*100)}%)</span>`;
  if(ord.length>1&&peor.p<1)h+=`<span>📌 Para repasar: <b>${NOMBRES[peor.tipo]||esc(peor.tipo)}</b> (${Math.round(peor.p*100)}%)</span>`;
  return h+'</div>';
}
function pestanas(base,activa,nombres){
  return '<nav class="pestanas">'+nombres.map(([id,txt])=>`<a href="${esc(base+(id?'/'+id:''))}" class="${id===activa?'activa':''}">${txt}</a>`).join('')+'</nav>';
}
function tiposHtml(historiales,ambito){
  const tipos={};
  historiales.forEach(hist=>hist.forEach(h=>{if(h&&h.tipos)for(const t in h.tipos){tipos[t]=tipos[t]||{bien:0,total:0};tipos[t].bien+=h.tipos[t].bien;tipos[t].total+=h.tipos[t].total;}}));
  const lista=Object.entries(tipos).filter(([,v])=>v.total).map(([t,v])=>[t,v.bien/v.total]).sort((a,b)=>b[1]-a[1]);
  if(!lista.length)return '';
  return `<section class="bloque"><h3>Qué se me da mejor y peor ${ambito}</h3><table class="tipos">`+lista.map(([t,p])=>`<tr><td class="tn">${NOMBRES[t]||esc(t)}</td><td><div class="barra ${p<.5?'mal':p<.8?'medio':''}"><i style="width:${Math.round(p*100)}%"></i></div></td><td class="nota">${Math.round(p*100)}%</td></tr>`).join('')+'</table><p class="aviso">Con todos los intentos (primer intento, sin contar correcciones).</p></section>';
}
// Gráfica de evolución: nota del primer intento (línea) y tras corregir (círculo hueco)
function grafica(hist){
  const W=360,H=230,L=34,R=18,T=14,B=34;const nI=hist.length;
  const x=i=>L+(nI===1?(W-L-R)/2:i*(W-L-R)/(nI-1));const y=v=>T+(10-v)*(H-T-B)/10;
  let s=`<svg class="grafica" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de la nota">`;
  for(let v=0;v<=10;v+=2.5){s+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#eee"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="12" fill="#888">${String(v).replace('.',',')}</text>`;}
  s+=`<line x1="${L}" x2="${W-R}" y1="${y(5)}" y2="${y(5)}" stroke="#f7a823" stroke-dasharray="4 4" opacity=".6"/>`;
  s+=`<polyline fill="none" stroke="#2bb3d9" stroke-width="3.5" stroke-linejoin="round" points="${hist.map((h,i)=>x(i)+','+y(h.nota1)).join(' ')}"/>`;
  hist.forEach((h,i)=>{
    if(h.notaCorr!=null)s+=`<line x1="${x(i)}" x2="${x(i)}" y1="${y(h.nota1)}" y2="${y(h.notaCorr)}" stroke="#4caf50" stroke-dasharray="3 3"/><circle cx="${x(i)}" cy="${y(h.notaCorr)}" r="7" fill="#fff" stroke="#4caf50" stroke-width="3"/>`;
    s+=`<circle cx="${x(i)}" cy="${y(h.nota1)}" r="7.5" fill="${colorNota(h.nota1)}" stroke="#fff" stroke-width="2.5"/>`;
    if(nI<=5||i===0||i===nI-1||i%Math.ceil(nI/4)===0)s+=`<text x="${x(i)}" y="${H-10}" text-anchor="${nI>1&&i===0?'start':nI>1&&i===nI-1?'end':'middle'}" font-size="12" fill="#777">${esc(fechaCorta(h.fecha))}</text>`;
  });
  const conCorr=hist.some(h=>h.notaCorr!=null);
  return s+'</svg><p class="leyenda"><span class="pt" style="background:#2bb3d9"></span>primer intento'+(conCorr?' <span class="pt hueco"></span>tras corregir':'')+'</p>';
}

function intentosDe(exs){
  return exs.flatMap(x=>x.d.historial.map(h=>({fecha:h.fecha,nota1:h.nota1,notaCorr:null,examen:x.e.nombre}))).filter(h=>h.fecha&&h.nota1!=null).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
}
function bloqueGrafica(intentos,texto){
  if(intentos.length<2)return `<section class="bloque"><h3>Evolución</h3><p class="vacio">La gráfica aparece cuando haya al menos 2 exámenes entregados.</p></section>`;
  return `<section class="bloque"><h3>Evolución</h3>${grafica(intentos)}<p class="aviso">${texto}</p></section>`;
}

// ---------- pantallas ----------
function pantallaResumen(cat){
  let h='';
  cat.materias.forEach(m=>{
    if(!m.evaluable){
      const dib=m.temas.flatMap(t=>t.examenes).map(dibujosArts);const hechos=dib.filter(d=>d.length).length;const total=dib.length;
      h+=tarjeta('#/'+m.id,m.nombre,`${hechos} de ${total} con dibujos`,`<span class="media sin">sin nota</span>`,m.color);return;
    }
    const r=resumenMateria(m);
    const sub=`${r.hechos} de ${r.total} exámenes hechos`+(r.ultimo?` · último: ${esc(r.ultimo.x.e.nombre)}, ${fechaCorta(r.ultimo.f)}`:'');
    h+=tarjeta('#/'+m.id,m.nombre,sub,r.media==null?insignia(null,'sin exámenes hechos'):insignia(r.media,'media '+n(r.media)),m.color);
  });
  h+='<p class="aviso">La media usa la nota del primer intento de cada examen (sin contar correcciones).</p>';
  return {titulo:'Mis notas',migas:[],html:h,extras:true};
}
function pantallaMateria(cat,m){
  if(!m.evaluable){
    // Arts: lista de exámenes con miniaturas de los dibujos
    let h='';
    m.temas.forEach(t=>t.examenes.forEach(e=>{
      const dib=dibujosArts(e);
      h+=`<section class="bloque arte" style="border-left-color:${m.color}"><div class="cab"><b>${esc(e.nombre)}</b><a class="boton" href="${esc(rutaDe(m,t,e))}">Abrir</a></div><p class="sub">${esc(e.descripcion||'')}</p>`+
        (dib.length?'<div class="miniaturas">'+dib.map(x=>`<figure><img src="${esc(x.img)}" alt="${esc(x.nombre||'dibujo')}" loading="lazy"><figcaption>${esc(x.nombre||'')}</figcaption></figure>`).join('')+'</div>':'<p class="vacio">Todavía no hay dibujos guardados en este dispositivo.</p>')+'</section>';
    }));
    return {titulo:m.nombre,migas:[[m.nombre]],html:h};
  }
  const r=resumenMateria(m);const base='#/'+m.id;
  const todos=r.temas.flatMap(x=>x.r.exs);
  let h=`<div class="cabecera">${r.media==null?insignia(null,'sin exámenes hechos'):insignia(r.media,'media '+n(r.media))}<span class="sub">${r.hechos} de ${r.total} exámenes hechos</span></div>`;
  h+=resumenTipos(agregarTipos(todos.map(x=>x.d.historial)));
  h+=pestanas(base,pestanaActual,[['','Temas'],['progreso','Progreso']]);
  if(pestanaActual==='progreso'){
    h+=bloqueGrafica(intentosDe(todos),'Nota del primer intento de cada examen entregado, en orden de fecha.');
    // por (contenido, tema): 3 peores y 3 mejores. Empates: primero los temas más recientes
    const filas=[];r.temas.forEach(({t,r:rt},ti)=>agregarTipos(rt.exs.map(x=>x.d.historial)).forEach(x=>filas.push(Object.assign(x,{t,ti}))));
    if(!filas.length)h+='<section class="bloque"><p class="vacio">Cuando haya exámenes entregados verás aquí qué repasar.</p></section>';
    else{
      const linea=x=>`<tr><td class="tn">${NOMBRES[x.tipo]||esc(x.tipo)}<a class="sub" href="${esc(base+'/'+x.t.id+'/progreso')}">${esc(x.t.nombre)}</a></td><td><div class="barra ${x.p<.5?'mal':x.p<.8?'medio':''}"><i style="width:${Math.round(x.p*100)}%"></i></div></td><td class="nota">${Math.round(x.p*100)}%</td></tr>`;
      const peores=filas.filter(x=>x.p<1).sort((a,b)=>a.p-b.p||b.ti-a.ti).slice(0,3);
      const mejores=filas.slice().sort((a,b)=>b.p-a.p||b.ti-a.ti||b.total-a.total).filter(x=>!peores.includes(x)).slice(0,3);
      if(peores.length)h+=`<section class="bloque"><h3>📌 Para repasar</h3><table class="tipos repasar">${peores.map(linea).join('')}</table></section>`;
      if(mejores.length)h+=`<section class="bloque"><h3>👍 Lo que mejor llevas</h3><table class="tipos mejores">${mejores.map(linea).join('')}</table></section>`;
      h+='<p class="aviso">Con todos los intentos (primer intento, sin contar correcciones). El detalle completo está en el progreso de cada tema.</p>';
    }
  }else{
    r.temas.forEach(({t,r:rt})=>{
      const sub=`${esc(t.descripcion||'')}<br>${rt.hechos} de ${rt.total} hechos`+(rt.ultimo?` · último ${fechaCorta(rt.ultimo.f)}`:'');
      h+=tarjeta(base+'/'+t.id,t.nombre,sub,rt.media==null?insignia(null):insignia(rt.media,n(rt.media)),m.color);
    });
  }
  return {titulo:m.nombre,migas:[[m.nombre]],html:h};
}
function pantallaTema(cat,m,t){
  const r=resumenTema(m,t);const base='#/'+m.id+'/'+t.id;
  let h=`<div class="cabecera">${r.media==null?insignia(null,'sin exámenes hechos'):insignia(r.media,'media '+n(r.media))}<span class="sub">${r.hechos} de ${r.total} exámenes hechos</span></div>`;
  h+=resumenTipos(agregarTipos(r.exs.map(x=>x.d.historial)));
  h+=pestanas(base,pestanaActual,[['','Exámenes'],['progreso','Progreso']]);
  if(pestanaActual==='progreso'){
    h+=bloqueGrafica(intentosDe(r.exs),'Nota del primer intento de cada examen entregado de este tema, en orden de fecha.');
    h+=tiposHtml(r.exs.map(x=>x.d.historial),'en este tema')||'<section class="bloque"><p class="vacio">Cuando haya exámenes entregados verás aquí qué se te da mejor y peor.</p></section>';
  }else{
    r.exs.forEach(({e,d,nota})=>{
      const u=ultimoDe(d);
      let der,sub=esc(e.descripcion||'');
      if(nota==null)der=insignia(null);
      else{der=insignia(nota,n(nota)+(u&&u.notaCorr!=null?' → '+n(u.notaCorr):''));sub=`${fechaCorta(u.fecha)}${d.historial.length>1?' · '+d.historial.length+' intentos':''}<br>`+sub;}
      h+=`<div class="${nota==null?'gris':''}">`+tarjeta(base+'/'+e.id,e.nombre,sub,der,m.color)+'</div>';
    });
  }
  return {titulo:t.nombre,migas:[[m.nombre,'#/'+m.id],[t.nombre]],html:h};
}
function pantallaExamen(cat,m,t,e){
  const ruta=rutaDe(m,t,e);const d=datosDe(ruta);const hist=d.historial.slice();
  // un último intento que no esté en el historial (datos antiguos) también cuenta
  if(d.ultimo&&d.ultimo.fecha&&!hist.some(h=>h.fecha===d.ultimo.fecha))hist.push({fecha:d.ultimo.fecha,nota1:d.ultimo.nota1,notaCorr:d.ultimo.notaCorr,tipos:d.ultimo.tipos});
  hist.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  let h=`<div class="cabecera"><span class="sub">${esc(e.descripcion||'')}</span><a class="boton" href="${esc(ruta)}">${hist.length?'Abrir el examen':'Hacer el examen'}</a></div>`;
  if(!hist.length){h+='<p class="vacio">Todavía no has hecho este examen.</p>';return {titulo:e.nombre,migas:[[m.nombre,'#/'+m.id],[t.nombre,'#/'+m.id+'/'+t.id],[e.nombre]],html:h};}
  const ult=hist[hist.length-1];const mejor=Math.max(...hist.map(x=>x.nota1));
  h+=`<div class="cifras"><div><span>Último</span><b style="color:${colorNota(ult.nota1)}">${n(ult.nota1)}</b></div><div><span>Mejor</span><b style="color:${colorNota(mejor)}">${n(mejor)}</b></div><div><span>Intentos</span><b>${hist.length}</b></div></div>`;
  if(hist.length>=2)h+=`<section class="bloque"><h3>Evolución</h3>${grafica(hist)}</section>`;
  const vioSol=d.ultimo&&d.ultimo.vioSoluciones?d.ultimo.fecha:null;
  h+='<section class="bloque"><h3>Intentos</h3><table class="intentos"><tr><th>Fecha</th><th>Nota</th><th>Tras corregir</th></tr>'+
    hist.slice().reverse().map(x=>`<tr><td class="fecha">${esc(fechaLarga(x.fecha))}${x.fecha===vioSol?' <span title="Vio las soluciones">💡</span>':''}</td><td class="nota" style="color:${colorNota(x.nota1)}">${n(x.nota1)}</td><td class="nota">${x.notaCorr!=null?n(x.notaCorr):'—'}</td></tr>`).join('')+'</table></section>';
  h+=tiposHtml([hist],'en este examen');
  return {titulo:e.nombre,migas:[[m.nombre,'#/'+m.id],[t.nombre,'#/'+m.id+'/'+t.id],[e.nombre]],html:h};
}

// ---------- enrutado ----------
let CAT=null;let pestanaActual='';
function resolver(cat,hash){
  let p;try{p=decodeURIComponent(hash.replace(/^#\/?/,'')).split('/').filter(Boolean);}catch(e){p=[];}
  pestanaActual='';
  if(p.length&&p[p.length-1]==='progreso'){p.pop();pestanaActual='progreso';}
  if(!p.length)return pantallaResumen(cat);
  const m=cat.materias.find(x=>x.id===p[0]);if(!m)return pantallaResumen(cat);
  if(p.length===1||!m.evaluable)return pantallaMateria(cat,m);
  const t=m.temas.find(x=>x.id===p[1]);if(!t)return pantallaMateria(cat,m);
  if(p.length===2)return pantallaTema(cat,m,t);
  const e=t.examenes.find(x=>x.id===p[2]);if(!e)return pantallaTema(cat,m,t);
  return pantallaExamen(cat,m,t,e);
}
function pintar(){
  if(!CAT)return;
  const v=resolver(CAT,location.hash);
  const migas=[['Inicio','../'],['Mis notas',v.migas.length?'#/':null],...v.migas];
  document.getElementById('migas').innerHTML=migas.map(([t,h],i)=>h&&i<migas.length-1?`<a href="${esc(h)}">${esc(t)}</a>`:`<span>${esc(t)}</span>`).join(' › ');
  document.getElementById('titulo').textContent=v.titulo;
  document.title=(v.titulo==='Mis notas'?'':v.titulo+' · ')+'Mis notas · Exámenes de Noa';
  document.getElementById('contenido').innerHTML=v.html;
  const ex=document.getElementById('extras');if(ex)ex.style.display=v.extras?'':'none';
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',pintar);

const bajada=(window.noatestsSync&&window.noatestsSync.activo()&&navigator.onLine)?window.noatestsSync.bajar().catch(()=>0):Promise.resolve(0);
bajada.then(()=>fetch(RAIZ+'catalogo.json')).then(r=>r.json()).then(cat=>{CAT=cat;pintar();})
  .catch(()=>{document.getElementById('contenido').innerHTML='<div class="vacio">No se ha podido cargar el catálogo.</div>';});
window.__noatestsNotas={resolver,pintar};
})();
