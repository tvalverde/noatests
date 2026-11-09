/* Modo sin conexión: guarda todo lo que se visita y lo sirve si no hay red. Se actualiza en segundo plano. */
const CACHE='noatests-v2'; // cambiar el número si cambia la estructura de carpetas
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin))return;
  // el catálogo, primero de la red: así una materia o examen nuevo aparece en cuanto se publica
  if(new URL(e.request.url).pathname.endsWith('/catalogo.json')){
    e.respondWith(caches.open(CACHE).then(cache=>fetch(e.request).then(r=>{if(r&&r.ok)cache.put(e.request,r.clone());return r;}).catch(()=>cache.match(e.request).then(g=>g||new Response('{"materias":[]}',{headers:{'Content-Type':'application/json'}})))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async cache=>{
    const guardada=await cache.match(e.request,{ignoreSearch:false});
    const red=fetch(e.request).then(r=>{if(r&&r.ok)cache.put(e.request,r.clone());return r;}).catch(()=>null);
    return guardada||(await red)||new Response('Sin conexión y esta página no se ha abierto antes.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
  }));
});
