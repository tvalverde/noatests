/* Red de seguridad determinista: cada ejercicio debe quedarse dentro del temario de su tema (temario/<materia>/<tema>.json).
   Para cada pregunta, con los dibujos ya pintados (lo que ve la niña, también el texto de los SVG):
   - su contenido (data-tipo) está en el temario del tema
   - ningún número supera el máximo del temario, y no hay decimales si el temario no los incluye
   - no aparece ninguna palabra prohibida (contenidos de otros temas o cursos), comparando sin tildes ni mayúsculas y al principio de palabra
   Además: cada tema con ejercicios tiene temario; las páginas de cada contenido están dentro de las del tema;
   cada contenido del temario tiene nombre en catalogo.json; el estado de revisión es válido.
   Uso: node tests/temario.js */
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const raiz=path.join(__dirname,'..');
let errores=0,preguntasVistas=0;const fallo=m=>{console.error('  ✗ '+m);errores++;};
const cat=JSON.parse(fs.readFileSync(path.join(raiz,'catalogo.json'),'utf8'));
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const num=v=>Number(String(v).replace(/\./g,'').replace(',','.'));
// "8-11, 20" → [[8,11],[20,20]]
const rangos=s=>String(s).split(',').map(x=>x.trim()).filter(Boolean).map(x=>{const [a,b]=x.split('-').map(Number);return [a,b==null?a:b];});
const dentro=(r,de)=>r.every(([a,b])=>a<=b&&de.some(([c,d])=>a>=c&&b<=d));

for(const m of cat.materias.filter(m=>m.evaluable)){
  for(const t of m.temas){
    const ft=path.join(raiz,'temario',m.id,t.id+'.json');
    console.log(m.id+'/'+t.id);
    if(!fs.existsSync(ft)){fallo('falta el temario '+path.relative(raiz,ft));continue;}
    let tm;try{tm=JSON.parse(fs.readFileSync(ft,'utf8'));}catch(e){fallo('temario con JSON inválido: '+e.message);continue;}
    // el temario en sí
    if(tm.materia!==m.id||tm.tema!==t.id)fallo('el temario dice ser de '+tm.materia+'/'+tm.tema);
    if(!['pendiente','revisado'].includes(tm.estado))fallo('estado de revisión inválido: '+tm.estado);
    if(tm.estado==='revisado'&&!tm.revisado_el)fallo('marcado como revisado sin fecha (revisado_el)');
    const pagTema=rangos(tm.paginas);if(!pagTema.length)fallo('el temario no indica las páginas del tema');
    if(!tm.contenidos||!Object.keys(tm.contenidos).length)fallo('el temario no tiene contenidos');
    for(const [tipo,c] of Object.entries(tm.contenidos||{})){
      if(!c.que||c.que.length<15)fallo('el contenido "'+tipo+'" no explica qué entra');
      if(!dentro(rangos(c.paginas),pagTema))fallo('las páginas de "'+tipo+'" ('+c.paginas+') se salen del tema ('+tm.paginas+')');
      if(!(m.contenidos||{})[tipo])fallo('el contenido "'+tipo+'" no tiene nombre en catalogo.json');
    }
    if(!tm.numeros||!(tm.numeros.maximo>0))fallo('el temario no fija el número máximo');
    const prohibidas=(tm.prohibido||[]).map(norm);
    // los ejercicios del tema
    for(const e of t.examenes){
      const rel=path.join(m.id,t.id,e.id,'index.html');
      const html=fs.readFileSync(path.join(raiz,rel),'utf8').replace(/<script src="[^"]*"><\/script>/g,'');
      const dom=new JSDOM(html,{runScripts:'outside-only'});const w=dom.window;
      const dib=path.join(raiz,m.id,'dibujos.js');if(fs.existsSync(dib))w.eval(fs.readFileSync(dib,'utf8'));
      w.document.querySelectorAll('.pregunta').forEach((q,i)=>{
        preguntasVistas++;const P=e.id+' pregunta '+(i+1)+': ';
        if(!tm.contenidos[q.dataset.tipo])fallo(P+'el contenido "'+q.dataset.tipo+'" no está en el temario del tema');
        // todo el texto visible (cada nodo por separado, para no pegar números de etiquetas vecinas) y las respuestas
        const tw=w.document.createTreeWalker(q,4);const partes=[];while(tw.nextNode())partes.push(tw.currentNode.nodeValue);
        q.querySelectorAll('[data-r]').forEach(x=>partes.push(x.dataset.r));
        const texto=partes.join(' ');
        for(const mm of texto.matchAll(/\d{1,3}(?:\.\d{3})+|\d+/g)){const v=num(mm[0]);if(v>tm.numeros.maximo)fallo(P+'el número '+mm[0]+' supera el máximo del temario ('+tm.numeros.maximo+')');}
        if(!tm.numeros.decimales){const d=texto.match(/\d,\d/);if(d)fallo(P+'hay un número con decimales ("'+texto.slice(Math.max(0,d.index-10),d.index+12).trim()+'") y el temario no los incluye');}
        const tn=norm(texto);
        for(const p of prohibidas){const pe=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const re=new RegExp(/^[a-z0-9ñ]/.test(p)?'(^|[^a-z0-9ñ])'+pe:pe);if(re.test(tn))fallo(P+'aparece "'+p+'", que está fuera del temario');}
      });
    }
    if(!errores)console.log('  ✓ '+t.examenes.length+' ejercicios dentro del temario ('+Object.keys(tm.contenidos).length+' contenidos, números hasta '+tm.numeros.maximo+', '+prohibidas.length+' palabras vigiladas) · '+tm.estado);
  }
}
// temarios huérfanos (de temas que ya no existen)
for(const md of fs.readdirSync(path.join(raiz,'temario'),{withFileTypes:true}).filter(x=>x.isDirectory()))
  for(const f of fs.readdirSync(path.join(raiz,'temario',md.name)).filter(f=>f.endsWith('.json'))){
    const m=cat.materias.find(x=>x.id===md.name);if(!m||!m.temas.find(t=>t.id+'.json'===f))fallo('temario sin tema en el catálogo: temario/'+md.name+'/'+f);}
// la página para padres pinta cada tema y cada pregunta, sin ninguna fuera del temario
(async()=>{
  console.log('página temario/');
  const url='https://x.test/noatests/temario/';
  const dom=new JSDOM(fs.readFileSync(path.join(raiz,'temario/index.html'),'utf8').replace(/<script src="[^"]*sw-registro\.js"><\/script>/,''),{url,runScripts:'outside-only'});const w=dom.window;
  const leerArchivo=u=>{const p=new URL(u,url).pathname.replace(/^\/noatests\//,'');const f=path.join(raiz,p.endsWith('/')?p+'index.html':p);if(!fs.existsSync(f))return Promise.resolve({ok:false,status:404});const s=fs.readFileSync(f,'utf8');return Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(s)),text:()=>Promise.resolve(s)});};
  w.fetch=leerArchivo;w.eval(fs.readFileSync(path.join(raiz,'temario/temario.js'),'utf8'));
  for(let k=0;k<50&&!w.document.querySelector('section.tema');k++)await new Promise(r=>setTimeout(r,20));await new Promise(r=>setTimeout(r,50));
  const temas=cat.materias.filter(m=>m.evaluable).reduce((a,m)=>a+m.temas.length,0);
  const secciones=w.document.querySelectorAll('section.tema').length,lis=w.document.querySelectorAll('ol.preguntas li').length;
  if(secciones!==temas)fallo('la página del temario pinta '+secciones+' temas y hay '+temas);
  if(lis!==preguntasVistas)fallo('la página del temario lista '+lis+' preguntas y hay '+preguntasVistas);
  if(w.document.querySelector('.fuera'))fallo('la página del temario muestra preguntas fuera del temario');
  if(!errores)console.log('  ✓ '+secciones+' temas y '+lis+' preguntas con su contenido y páginas');
  if(errores){console.error('\n'+errores+' error(es)');process.exit(1);}else console.log('\nTodo dentro del temario ('+preguntasVistas+' preguntas).');
})();
