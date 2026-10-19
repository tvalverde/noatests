/* Exportar / importar las notas y los dibujos de este dispositivo.
   Exporta todo lo de localStorage que empiece por noatests- a un archivo JSON.
   Al importar, fusiona: por examen se queda con el historial unido (sin repetir intentos por fecha) y con el último intento más reciente. */
(function(){
'use strict';
const PREF=['noatests-mates:','noatests-arts-'];
function todo(){const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(PREF.some(p=>k.startsWith(p))){try{o[k]=JSON.parse(localStorage.getItem(k));}catch(e){}}}return o;}
function exportar(){
  const datos={formato:'noatests-1',fecha:new Date().toISOString(),datos:todo()};
  const blob=new Blob([JSON.stringify(datos)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='notas-noa-'+new Date().toISOString().slice(0,10)+'.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function fusionar(entrantes){
  let examenes=0,intentos=0,dibujos=0;
  for(const k in entrantes){
    const v=entrantes[k];
    if(k.endsWith(':historial')){
      let actual=[];try{actual=JSON.parse(localStorage.getItem(k))||[];}catch(e){}
      const fechas=new Set(actual.map(h=>h.fecha));
      const nuevos=(v||[]).filter(h=>h&&!fechas.has(h.fecha));
      if(nuevos.length){const u=actual.concat(nuevos).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));localStorage.setItem(k,JSON.stringify(u.slice(-20)));intentos+=nuevos.length;}
    }else if(k.startsWith('noatests-mates:')&&!k.endsWith(':borrador')){
      let actual=null;try{actual=JSON.parse(localStorage.getItem(k));}catch(e){}
      if(v&&(!actual||String(v.fecha)>String(actual.fecha))){localStorage.setItem(k,JSON.stringify(v));examenes++;}
    }else if(k.startsWith('noatests-arts-')){
      if(!localStorage.getItem(k)&&v){localStorage.setItem(k,JSON.stringify(v));dibujos++;}
    }
  }
  return {examenes,intentos,dibujos};
}
function importar(archivo){
  const r=new FileReader();
  r.onload=()=>{
    let j=null;try{j=JSON.parse(r.result);}catch(e){}
    if(!j||j.formato!=='noatests-1'||!j.datos){alert('Ese archivo no es una copia de notas válida.');return;}
    const res=fusionar(j.datos);
    alert('Importado: '+res.intentos+' intentos nuevos, '+res.examenes+' exámenes actualizados'+(res.dibujos?', '+res.dibujos+' dibujos':'')+'.');
    location.reload();
  };
  r.readAsText(archivo);
}
const caja=document.createElement('div');caja.className='materia';caja.style.cssText='border-left-color:#8a8a8a;padding:14px 16px';
caja.innerHTML='<b>Copiar a otro dispositivo</b><p style="margin:6px 0 10px;color:#666;font-size:.9rem">Exporta las notas a un archivo y ábrelo en el otro móvil o tablet con "Importar". Se juntan con las que ya haya; no se borra nada.</p>'+
  '<button id="btn-exportar" style="border:none;border-radius:10px;padding:10px 14px;background:#2bb3d9;color:#fff;font-size:1rem;cursor:pointer;margin-right:8px">⬇ Exportar</button>'+
  '<label style="display:inline-block;border-radius:10px;padding:10px 14px;background:#f7a823;color:#fff;font-size:1rem;cursor:pointer">⬆ Importar<input type="file" accept=".json,application/json" style="display:none" id="inp-importar"></label>';
function colocar(){
  const main=document.querySelector('main');if(main.contains(caja))return;
  main.appendChild(caja);
  document.getElementById('btn-exportar').addEventListener('click',exportar);
  document.getElementById('inp-importar').addEventListener('change',e=>{if(e.target.files[0])importar(e.target.files[0]);});
}
// notas.js repinta main cuando llega el catálogo: colocar la caja después de cada repintado
new MutationObserver(()=>{if(!document.querySelector('main').contains(caja))colocar();}).observe(document.querySelector('main'),{childList:true});
colocar();
window.__noatestsFusionar=fusionar; // para los tests
})();
