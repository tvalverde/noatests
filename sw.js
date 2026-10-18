/* Modo sin conexión: guarda todo lo que se visita y lo sirve si no hay red. Se actualiza en segundo plano. */
const CACHE='noatests-v1';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin))return;
  e.respondWith(caches.open(CACHE).then(async cache=>{
    const guardada=await cache.match(e.request,{ignoreSearch:false});
    const red=fetch(e.request).then(r=>{if(r&&r.ok)cache.put(e.request,r.clone());return r;}).catch(()=>null);
    return guardada||(await red)||new Response('Sin conexión y esta página no se ha abierto antes.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
  }));
});
