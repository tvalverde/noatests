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
      const vistas=new Set();const nuevos=(v||[]).filter(h=>{if(!h||fechas.has(h.fecha)||vistas.has(h.fecha))return false;vistas.add(h.fecha);return true;});
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
    // con la nube activa, lo importado se sube también (si no, la siguiente sincronización lo tomaría por borrado)
    if(window.noatestsSync&&window.noatestsSync.activo()){try{window.noatestsSync.subirLocal(Object.keys(j.datos));}catch(e){}}
    alert('Importado: '+res.intentos+' intentos nuevos, '+res.examenes+' exámenes actualizados'+(res.dibujos?', '+res.dibujos+' dibujos':'')+'.');
    location.reload();
  };
  r.readAsText(archivo);
}
// ---- Conexión con la nube ----
const nube=document.createElement('div');nube.className='caja';nube.style.borderLeftColor='#4caf50';
function pintarNube(){
  const S=window.noatestsSync;if(!S){nube.style.display='none';return;}
  if(S.activo()){
    const pend=S.pendientes();const u=S.ultimaSync();
    nube.innerHTML='<b>☁️ Notas en la nube: conectado</b><p style="margin:6px 0 10px;color:#666;font-size:.9rem">Las notas de este dispositivo se guardan en la nube y se juntan con las de los demás dispositivos conectados con el mismo código.'+(pend?' <b style="color:#e4452c">'+pend+' pendiente(s) de enviar</b> (se enviarán al recuperar la conexión).':'')+(u?' Última sincronización: '+new Date(u).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'.':'')+'</p>'+
      '<button id="btn-sync" style="border:none;border-radius:10px;padding:10px 14px;background:#4caf50;color:#fff;font-size:1rem;cursor:pointer;margin-right:8px">🔄 Sincronizar ahora</button>'+
      '<button id="btn-desconectar" style="border:2px solid #ccc;border-radius:10px;padding:8px 14px;background:#fff;color:#666;font-size:.95rem;cursor:pointer">Desconectar</button>';
    document.getElementById('btn-sync').addEventListener('click',async()=>{const b=document.getElementById('btn-sync');b.textContent='Sincronizando…';b.disabled=true;try{await S.vaciarCola();await S.bajar();location.reload();}catch(e){alert('No se ha podido sincronizar. ¿Hay conexión?');pintarNube();}});
    document.getElementById('btn-desconectar').addEventListener('click',()=>{if(confirm('¿Desconectar este dispositivo de la nube? Las notas guardadas aquí no se borran.')){S.desconectar();pintarNube();}});
  }else{
    nube.innerHTML='<b>☁️ Notas en la nube: no conectado</b><p style="margin:6px 0 10px;color:#666;font-size:.9rem">Escribe el código de familia para que las notas se guarden en la nube y se vean desde cualquier dispositivo.</p>'+
      '<input id="inp-codigo" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="noa-xxxx-xxxx-xxxx-xxxx" style="font-size:1rem;padding:8px 10px;border:2px solid #ccc;border-radius:8px;width:100%;max-width:280px;margin-right:8px;margin-bottom:8px">'+
      '<button id="btn-conectar" style="border:none;border-radius:10px;padding:10px 14px;background:#4caf50;color:#fff;font-size:1rem;cursor:pointer">Conectar</button>';
    document.getElementById('btn-conectar').addEventListener('click',async()=>{const b=document.getElementById('btn-conectar');const cod=document.getElementById('inp-codigo').value;if(!cod.trim())return;b.textContent='Conectando…';b.disabled=true;
      try{const nombre=await S.conectar(cod);if(!nombre){alert('Ese código no es válido.');pintarNube();return;}alert('Conectado a '+nombre+'. Se han juntado las notas de este dispositivo con las de la nube.');location.reload();}
      catch(e){alert('No se ha podido conectar. ¿Hay conexión a internet?');pintarNube();}});
  }
}

const caja=document.createElement('div');caja.className='caja';
caja.innerHTML='<b>Copiar a otro dispositivo</b><p style="margin:6px 0 10px;color:#666;font-size:.9rem">Exporta las notas a un archivo y ábrelo en el otro móvil o tablet con "Importar". Se juntan con las que ya haya; no se borra nada.</p>'+
  '<button id="btn-exportar" style="border:none;border-radius:10px;padding:10px 14px;background:#2bb3d9;color:#fff;font-size:1rem;cursor:pointer;margin-right:8px">⬇ Exportar</button>'+
  '<label style="display:inline-block;border-radius:10px;padding:10px 14px;background:#f7a823;color:#fff;font-size:1rem;cursor:pointer">⬆ Importar<input type="file" accept=".json,application/json" style="display:none" id="inp-importar"></label>';
// Las dos cajas viven en #extras, que notas.js solo muestra en la pantalla de resumen
(function colocar(){
  const ex=document.getElementById('extras');
  ex.appendChild(nube);ex.appendChild(caja);pintarNube();
  document.getElementById('btn-exportar').addEventListener('click',exportar);
  document.getElementById('inp-importar').addEventListener('change',e=>{if(e.target.files[0])importar(e.target.files[0]);});
})();
window.__noatestsFusionar=fusionar; // para los tests
})();
