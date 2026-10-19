/* Sincronización de notas con la nube (Supabase).
   - El dispositivo guarda todo en localStorage como hasta ahora (funciona sin conexión).
   - Si hay un código de familia guardado, cada intento entregado se envía a la nube y, al abrir
     "Mis notas" o un examen, se descargan los intentos de la nube y se fusionan con los locales.
   - Lo pendiente de enviar se guarda en una cola y se reintenta al recuperar la red.
   La clave pública (publishable) solo permite llamar a las funciones; sin el código de familia no se lee ni se escribe nada. */
(function(){
'use strict';
const URL_BASE='https://zwvipvswiguxqjsblijo.supabase.co/rest/v1/rpc/';
const CLAVE_API='sb_publishable_SYUGY1AdqIU4wM142_o4Dg_mscFfSzm';
const K_CODIGO='noatests-sync:codigo', K_COLA='noatests-sync:cola', K_ULTIMA='noatests-sync:ultima';
const PREF='noatests-mates:';
function leer(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
function escribir(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
const codigo=()=>{try{return localStorage.getItem(K_CODIGO)||'';}catch(e){return '';}};
const activo=()=>!!codigo();
const dispositivo=()=>{const u=navigator.userAgent;return (/iPhone|iPad/.test(u)?'iOS':/Android/.test(u)?'Android':'otro')+' '+(u.match(/Chrome\/(\d+)|Safari\/(\d+)|Firefox\/(\d+)/)||[''])[0];};

async function rpc(nombre,params){
  const r=await fetch(URL_BASE+nombre,{method:'POST',headers:{'apikey':CLAVE_API,'Authorization':'Bearer '+CLAVE_API,'Content-Type':'application/json'},body:JSON.stringify(params)});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const t=await r.text();return t?JSON.parse(t):null;
}

// ---- enviar ----
function aRegistro(ruta,h,ultimo){
  return {codigo:codigo(),p_examen:ruta,p_fecha:h.fecha,p_nota1:h.nota1,p_nota_corr:h.notaCorr==null?null:h.notaCorr,
    p_huecos_bien:ultimo&&ultimo.fecha===h.fecha?ultimo.huecosBien??null:null,p_huecos_total:ultimo&&ultimo.fecha===h.fecha?ultimo.huecosTotal??null:null,
    p_tipos:h.tipos||(ultimo&&ultimo.fecha===h.fecha?ultimo.tipos:null)||null,p_respuestas:ultimo&&ultimo.fecha===h.fecha?ultimo.respuestas||null:null,
    p_vio_soluciones:!!(ultimo&&ultimo.fecha===h.fecha&&ultimo.vioSoluciones),p_dispositivo:dispositivo()};
}
function encolar(reg){const cola=leer(K_COLA)||[];const i=cola.findIndex(x=>x.p_examen===reg.p_examen&&x.p_fecha===reg.p_fecha);if(i>=0)cola[i]=reg;else cola.push(reg);escribir(K_COLA,cola);}
let enviando=false;
async function vaciarCola(){
  if(!activo()||enviando||!navigator.onLine)return;
  enviando=true;
  try{
    let cola=leer(K_COLA)||[];
    while(cola.length){
      const reg=Object.assign({},cola[0],{codigo:codigo()});
      const ok=await rpc('guardar_intento',reg);
      if(ok===false){cola.shift();escribir(K_COLA,cola);continue;} // código inválido o examen inválido: no reintentar
      cola.shift();escribir(K_COLA,cola);
    }
  }catch(e){/* sin red o error: se queda en la cola */}
  enviando=false;
}
// Llamado por examen.js al entregar o corregir: ruta del examen y el intento (registro del historial + último)
function subirIntento(ruta,h,ultimo){
  if(!activo())return;
  encolar(aRegistro(ruta,h,ultimo));
  vaciarCola();
}

// ---- descargar y fusionar ----
function fusionarRemotos(filas,rutaPedida){
  let nuevos=0;
  const porExamen={};
  filas.forEach(f=>{(porExamen[f.examen]=porExamen[f.examen]||[]).push(f);});
  // exámenes locales a revisar: si la lectura fue completa, todos; si fue de un examen, ese
  const rutas=new Set(Object.keys(porExamen));
  if(rutaPedida)rutas.add(rutaPedida);
  else for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(PREF)&&k.endsWith(':historial'))rutas.add(k.slice(PREF.length,-':historial'.length));}
  const enCola=new Set((leer(K_COLA)||[]).map(x=>x.p_examen+'|'+new Date(x.p_fecha).toISOString()));
  rutas.forEach(ruta=>{
    const kH=PREF+ruta+':historial',kU=PREF+ruta;
    const remotos=(porExamen[ruta]||[]).map(f=>Object.assign({},f,{iso:new Date(f.fecha).toISOString()}));
    const remotoPorFecha=new Map(remotos.map(f=>[f.iso,f]));
    let hist=leer(kH)||[];const fechas=new Map(hist.map(h=>[h.fecha,h]));
    remotos.forEach(f=>{
      const h={fecha:f.iso,nota1:+f.nota1,notaCorr:f.nota_corr==null?null:+f.nota_corr,tipos:f.tipos||undefined};
      const ya=fechas.get(f.iso);
      if(!ya){hist.push(h);fechas.set(f.iso,h);nuevos++;}
      else if(ya.notaCorr==null&&h.notaCorr!=null){ya.notaCorr=h.notaCorr;nuevos++;}
    });
    // borrados en la nube: intentos locales que no están en la nube ni pendientes de enviar.
    // Solo si la nube ha devuelto algo: una respuesta vacía nunca borra (por seguridad)
    const antes=hist.length;
    if(filas.length)hist=hist.filter(h=>remotoPorFecha.has(h.fecha)||enCola.has(ruta+'|'+h.fecha));
    if(hist.length!==antes)nuevos++;
    hist.sort((a,b)=>a.fecha.localeCompare(b.fecha));
    if(hist.length)escribir(kH,hist.slice(-20));else{try{localStorage.removeItem(kH);}catch(e){}}
    // último intento
    const local=leer(kU);
    const remotoUlt=remotos.sort((a,b)=>b.iso.localeCompare(a.iso))[0];
    if(filas.length&&local&&!remotoPorFecha.has(local.fecha)&&!enCola.has(ruta+'|'+local.fecha)){try{localStorage.removeItem(kU);}catch(e){}}
    else if(local&&remotoUlt&&local.fecha===remotoUlt.iso){
      // mismo intento: completar lo que la nube sepa de más (corrección o soluciones vistas desde otro dispositivo)
      let cambio=false;
      if(local.notaCorr==null&&remotoUlt.nota_corr!=null){local.notaCorr=+remotoUlt.nota_corr;local.huecosBien=remotoUlt.huecos_bien;local.huecosTotal=remotoUlt.huecos_total;if(remotoUlt.respuestas)local.respuestas=remotoUlt.respuestas;cambio=true;}
      if(!local.vioSoluciones&&remotoUlt.vio_soluciones){local.vioSoluciones=true;cambio=true;}
      if(!local.respuestas&&remotoUlt.respuestas){local.respuestas=remotoUlt.respuestas;local.huecosBien=local.huecosBien??remotoUlt.huecos_bien;local.huecosTotal=local.huecosTotal??remotoUlt.huecos_total;cambio=true;}
      if(cambio)escribir(kU,local);
    }
    else if(remotoUlt&&(!local||remotoUlt.iso>local.fecha||(local.fecha===remotoUlt.iso&&!local.respuestas&&remotoUlt.respuestas))){
      escribir(kU,{fecha:remotoUlt.iso,nota1:+remotoUlt.nota1,notaCorr:remotoUlt.nota_corr==null?null:+remotoUlt.nota_corr,huecosBien:remotoUlt.huecos_bien,huecosTotal:remotoUlt.huecos_total,tipos:remotoUlt.tipos,respuestas:remotoUlt.respuestas||null,vioSoluciones:!!remotoUlt.vio_soluciones,deOtroDispositivo:true});
    }
  });
  return nuevos;
}
async function bajar(ruta){
  if(!activo()||!navigator.onLine)return 0;
  const filas=await rpc('leer_intentos',ruta?{codigo:codigo(),p_examen:ruta}:{codigo:codigo()});
  if(!Array.isArray(filas))return 0;
  const n=fusionarRemotos(filas,ruta||null);escribir(K_ULTIMA,new Date().toISOString());return n;
}
// Subir todo lo local que la nube no tenga (al conectar un dispositivo por primera vez)
async function subirTodo(){
  if(!activo())return;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);if(!k.startsWith(PREF)||!k.endsWith(':historial'))continue;
    const ruta=k.slice(PREF.length,-':historial'.length);const hist=leer(k)||[];const ult=leer(PREF+ruta);
    hist.forEach(h=>encolar(aRegistro(ruta,h,ult)));
  }
  await vaciarCola();
}
// Encola los intentos locales de las claves indicadas (o todas) y los envía
function subirLocal(claves){
  if(!activo())return;
  const todas=[];if(claves)claves.forEach(k=>todas.push(k));else for(let i=0;i<localStorage.length;i++)todas.push(localStorage.key(i));
  todas.forEach(k=>{if(!k.startsWith(PREF)||!k.endsWith(':historial'))return;const ruta=k.slice(PREF.length,-':historial'.length);const hist=leer(k)||[];const ult=leer(PREF+ruta);hist.forEach(h=>encolar(aRegistro(ruta,h,ult)));});
  return vaciarCola();
}
async function conectar(cod){
  const nombre=await rpc('comprobar_codigo',{codigo:cod.trim()});
  if(!nombre)return null;
  try{localStorage.setItem(K_CODIGO,cod.trim());}catch(e){}
  await subirTodo();await bajar();
  return nombre;
}
function desconectar(){try{localStorage.removeItem(K_CODIGO);localStorage.removeItem(K_COLA);}catch(e){}}

window.addEventListener('online',vaciarCola);
if(activo())vaciarCola();

window.noatestsSync={activo,codigo,conectar,desconectar,subirIntento,subirLocal,bajar,vaciarCola,pendientes:()=>(leer(K_COLA)||[]).length,ultimaSync:()=>leer(K_ULTIMA),_fusionar:fusionarRemotos,_rpc:rpc};
})();
