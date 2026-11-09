/* Sube la versión (?v=N) de todos los archivos propios enlazados desde las páginas, para que los
   navegadores y el modo sin conexión descarguen la versión nueva. Úsalo tras cambiar cualquier .js o .css común:
     node herramientas/subir-version.js        → versión actual + 1
     node herramientas/subir-version.js 25     → fija la versión 25
   Actualiza también herramientas/version.json, que usan los generadores de exámenes. */
const fs=require('fs');const path=require('path');
const raiz=path.join(__dirname,'..');const fv=path.join(__dirname,'version.json');
const actual=JSON.parse(fs.readFileSync(fv,'utf8')).version;
const nueva=process.argv[2]?parseInt(process.argv[2],10):actual+1;
if(!(nueva>0)){console.error('Versión no válida');process.exit(1);}
let n=0;
(function recorre(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){
  if(['node_modules','.git'].includes(e.name))continue;const p=path.join(d,e.name);
  if(e.isDirectory())recorre(p);
  else if(e.name.endsWith('.html')){const s=fs.readFileSync(p,'utf8');const t=s.replace(/(\.(?:js|css))\?v=\d+"/g,`$1?v=${nueva}"`);if(t!==s){fs.writeFileSync(p,t);n++;}}
}})(raiz);
fs.writeFileSync(fv,JSON.stringify({version:nueva})+'\n');
console.log(`Versión ${actual} → ${nueva} en ${n} páginas`);
