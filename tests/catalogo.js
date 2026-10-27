/* Comprueba catalogo.json contra las carpetas, y que las listas y Mis notas se pintan bien. */
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const raiz=path.join(__dirname,'..');let errores=0;const fallo=m=>{console.error('  ✗ '+m);errores++;};
const cat=JSON.parse(fs.readFileSync(path.join(raiz,'catalogo.json'),'utf8'));

console.log('arts');
{const h=fs.readFileSync(path.join(raiz,'arts/examen1/index.html'),'utf8');const ins=h.match(/<input[^>]*type="text"[^>]*>/g)||[];ins.forEach(i=>{if(!/autocorrect="off"/.test(i)||!/spellcheck="false"/.test(i)||!/autocomplete="(off|new-password)"/.test(i))fallo('arts: campo de texto con autocorrector: '+i);});if(!errores)console.log('  ✓ '+ins.length+' campos sin autocorrector');}
console.log('catalogo.json');
const enCat=new Set();
cat.materias.forEach(m=>{
  if(!fs.existsSync(path.join(raiz,m.id,'index.html')))fallo('materia '+m.id+' sin index.html');
  m.temas.forEach(t=>{
    const dirT=t.id?path.join(raiz,m.id,t.id):path.join(raiz,m.id);
    if(t.id&&!fs.existsSync(path.join(dirT,'index.html')))fallo('tema '+m.id+'/'+t.id+' sin index.html');
    t.examenes.forEach(e=>{const p=path.join(dirT,e.id,'index.html');enCat.add(p);if(!fs.existsSync(p))fallo('examen '+m.id+'/'+t.id+'/'+e.id+' no existe en disco');if(!e.nombre||!e.descripcion)fallo('examen '+e.id+' sin nombre o descripción');});
  });
});
// exámenes en disco que no están en el catálogo
(function busca(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,x.name);if(x.isDirectory()&&!['node_modules','.git','tests','notas'].includes(x.name))busca(p);else if(x.name==='index.html'&&/\/examen\d+\/index\.html$/.test(p)&&!enCat.has(p))fallo('examen en disco sin dar de alta en el catálogo: '+path.relative(raiz,p));}})(raiz);
if(!errores)console.log('  ✓ catálogo y carpetas coinciden');

// --- simulación de navegador con fetch del catálogo y localStorage ---
function abrir(rel,store){
  const html=fs.readFileSync(path.join(raiz,rel),'utf8').replace(/<script src="[^"]*sw-registro\.js"><\/script>/,'');
  const url='https://x.test/noatests/'+rel.replace(/index\.html$/,'');
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],key:i=>Object.keys(store)[i],get length(){return Object.keys(store).length;}}});
  w.scrollTo=()=>{};
  w.fetch=u=>{const p=new URL(u,url).pathname.replace(/^\/noatests\//,'');return Promise.resolve({json:()=>Promise.resolve(JSON.parse(fs.readFileSync(path.join(raiz,p),'utf8')))});};
  [...dom.window.document.querySelectorAll('script[src]')].forEach(s=>{const p=new URL(s.getAttribute('src'),url).pathname.replace(/^\/noatests\//,'').replace(/\?.*$/,'');w.eval(fs.readFileSync(path.join(raiz,p),'utf8'));});
  return new Promise(res=>setTimeout(()=>res(w.document),50));
}
// datos como los guarda examen.js (formato actual) + uno antiguo sin 'titulo' ni 'tipos'
const R='/noatests/matematicas/temas1-2-numeros-y-planos/';
const store={
  ['noatests-mates:'+R+'examen1/']:JSON.stringify({fecha:'2026-10-18T10:00:00Z',nota1:9.5,notaCorr:null,respuestas:{}}),
  ['noatests-mates:'+R+'examen1/:historial']:JSON.stringify([{fecha:'2026-10-17T10:00:00Z',nota1:7,notaCorr:8.5},{fecha:'2026-10-18T10:00:00Z',nota1:9.5,notaCorr:null,tipos:{recta:{bien:3,total:4},plano:{bien:1,total:1}}}]),
  ['noatests-mates:'+R+'examen3/']:JSON.stringify({fecha:'2026-10-18T12:00:00Z',titulo:'Examen 3 · Matemáticas',nota1:6.5,notaCorr:8.75,tipos:{redondear:{bien:1,total:3}},respuestas:{}}),
  ['noatests-mates:'+R+'examen3/:historial']:JSON.stringify([{fecha:'2026-10-18T12:00:00Z',nota1:6.5,notaCorr:8.75,tipos:{redondear:{bien:1,total:3}}}]),
  'noatests-arts-examen1':JSON.stringify([{img:'data:x',nombre:'Pepe'},null,null,null,null]),
};
(async()=>{
  console.log('listas');
  let d=await abrir('index.html',store);
  const port=[...d.querySelectorAll('a.examen')].map(a=>a.textContent.split('\n')[0].trim());
  if(port.length<3||!d.querySelector('a[href="matematicas/"]')||!d.querySelector('a[href="notas/"]'))fallo('portada: faltan tarjetas: '+port.join(' | '));else console.log('  ✓ portada: '+d.querySelectorAll('a.examen').length+' tarjetas');
  d=await abrir('matematicas/index.html',store);
  const tm=d.querySelector('a.examen');if(!tm||!/7 exámenes · 2 hechos/.test(tm.textContent))fallo('materia: texto del tema incorrecto: '+(tm&&tm.textContent));else console.log('  ✓ materia: '+tm.textContent.replace(/\s+/g,' ').trim());
  d=await abrir('matematicas/temas1-2-numeros-y-planos/index.html',store);
  const ex=[...d.querySelectorAll('a.examen')];if(ex.length!==7)fallo('tema: '+ex.length+' exámenes en vez de 7');
  const n1=d.querySelector('a[href="examen1/"] .nota-lista'),n3=d.querySelector('a[href="examen3/"] .nota-lista'),n2=d.querySelector('a[href="examen2/"] .nota-lista');
  if(!n1||n1.textContent!=='9,50')fallo('tema: nota examen1 = '+(n1&&n1.textContent));
  if(!n3||n3.textContent!=='6,50 → 8,75')fallo('tema: nota examen3 = '+(n3&&n3.textContent));
  if(n2)fallo('tema: examen2 muestra nota sin haberse hecho');
  if(!errores)console.log('  ✓ tema: 7 exámenes, notas 9,50 y 6,50 → 8,75');
  d=await abrir('arts/index.html',store);if(d.querySelectorAll('a.examen').length!==1)fallo('arts: lista incorrecta');

  console.log('Mis notas (pantallas)');
  const ir=async(d,hash)=>{d.defaultView.location.hash=hash;d.defaultView.__noatestsNotas.pintar();await new Promise(r=>setTimeout(r,10));};
  const tarjetas=d=>[...d.querySelectorAll('#contenido a.tarjeta')];
  const txt=e=>e?e.textContent.replace(/\s+/g,' ').trim():'(nada)';
  d=await abrir('notas/index.html',store);
  // resumen
  let ts=tarjetas(d);
  if(ts.length!==2)fallo('resumen: '+ts.length+' materias en vez de 2');
  if(!/Matemáticas.*2 de 7 exámenes hechos.*media 8,00/.test(txt(ts[0])))fallo('resumen: tarjeta de mates: '+txt(ts[0]));
  if(!/último: Examen 3, 18 oct/.test(txt(ts[0])))fallo('resumen: no indica el último examen hecho: '+txt(ts[0]));
  if(!/Arts.*1 de 1 con dibujos.*sin nota/.test(txt(ts[1])))fallo('resumen: tarjeta de Arts: '+txt(ts[1]));
  if(d.getElementById('extras').style.display==='none'||!d.getElementById('btn-exportar'))fallo('resumen: faltan nube y exportar/importar');
  if(d.getElementById('titulo').textContent!=='Mis notas'||/Mis notas<\/a>/.test(d.getElementById('migas').innerHTML))fallo('resumen: título o migas incorrectos');
  if(!errores)console.log('  ✓ resumen: una tarjeta por materia con media, hechos y último; nube y copia visibles');
  // materia
  await ir(d,'#/matematicas');ts=tarjetas(d);
  if(ts.length!==1||!/Temas 1 y 2.*2 de 7 hechos.*8,00/.test(txt(ts[0])))fallo('materia: tarjeta del tema: '+txt(ts[0]));
  if(ts[0].getAttribute('href')!=='#/matematicas/temas1-2-numeros-y-planos')fallo('materia: enlace al tema: '+ts[0].getAttribute('href'));
  if(!d.querySelector('.pestanas a.activa')||txt(d.querySelector('.pestanas a.activa'))!=='Temas')fallo('materia: la pestaña activa debería ser Temas');
  if(!/Lo que mejor llevas: Planos \(100%\).*Para repasar: Redondear \(33%\)/.test(txt(d.querySelector('.resumen-tipos'))))fallo('materia: línea de resumen: '+txt(d.querySelector('.resumen-tipos')));
  if(d.querySelector('.tipos'))fallo('materia: la tabla de tipos no debe estar en la pestaña Temas');
  if(d.getElementById('extras').style.display!=='none')fallo('materia: nube y copia deberían ocultarse fuera del resumen');
  if(txt(d.getElementById('migas'))!=='Inicio › Mis notas › Matemáticas'||!d.querySelector('#migas a[href="#/"]'))fallo('materia: migas '+txt(d.getElementById('migas')));
  if(!errores)console.log('  ✓ materia: temas con media, línea de resumen, pestaña Temas activa, migas y extras ocultos');
  await ir(d,'#/matematicas/progreso');
  if(txt(d.querySelector('.pestanas a.activa'))!=='Progreso'||tarjetas(d).length)fallo('materia/progreso: pestaña o contenido incorrecto');
  if(!d.querySelector('svg.grafica'))fallo('materia/progreso: falta la gráfica (hay 3 intentos)');
  else if(/tras corregir/.test(txt(d.querySelector('.leyenda'))))fallo('materia/progreso: la gráfica de materia no debería mostrar correcciones');
  const rep=[...d.querySelectorAll('table.repasar tr')].map(txt),mej=[...d.querySelectorAll('table.mejores tr')].map(txt);
  if(rep.length<1||rep.length>3||!/^Redondear/.test(rep[0]))fallo('materia/progreso: para repasar: '+rep.join(' | '));
  if(mej.length<1||mej.length>3||!/^Planos/.test(mej[0]))fallo('materia/progreso: lo mejor: '+mej.join(' | '));
  if(rep.some(x=>mej.includes(x)))fallo('materia/progreso: un contenido aparece en repasar y en mejor a la vez');
  if(!d.querySelector('table.repasar a[href="#/matematicas/temas1-2-numeros-y-planos/progreso"]'))fallo('materia/progreso: falta el enlace al progreso del tema');
  if(txt(d.getElementById('migas'))!=='Inicio › Mis notas › Matemáticas')fallo('materia/progreso: migas '+txt(d.getElementById('migas')));
  if(!errores)console.log('  ✓ materia/progreso: gráfica, "para repasar" y "lo mejor" con máximo 3, sin solaparse y con enlace al tema');
  // tema
  await ir(d,'#/matematicas/temas1-2-numeros-y-planos');ts=tarjetas(d);
  const t1=ts.find(a=>/Examen 1/.test(txt(a))),t2=ts.find(a=>/Examen 2/.test(txt(a))),t3=ts.find(a=>/Examen 3/.test(txt(a)));
  if(ts.length!==7)fallo('tema: '+ts.length+' exámenes en vez de 7');
  if(!/9,50.*/.test(txt(t1))||!/2 intentos/.test(txt(t1)))fallo('tema: examen1: '+txt(t1));
  if(!/6,50 → 8,75/.test(txt(t3)))fallo('tema: examen3: '+txt(t3));
  if(!/sin hacer/.test(txt(t2))||!t2.parentElement.classList.contains('gris'))fallo('tema: examen2 debería estar en gris y "sin hacer"');
  if(!/media 8,00/.test(txt(d.querySelector('.cabecera'))))fallo('tema: media de cabecera');
  if(d.querySelector('.tipos'))fallo('tema: la tabla de tipos no debe estar en la pestaña Exámenes');
  if(!d.querySelector('.resumen-tipos'))fallo('tema: falta la línea de resumen');
  await ir(d,'#/matematicas/temas1-2-numeros-y-planos/progreso');
  const pct=[...d.querySelectorAll('.tipos td.nota')].map(t=>t.textContent);if(!pct.includes('100%')||!pct.includes('33%'))fallo('tema/progreso: porcentajes por tipo: '+pct.join(','));
  if(!d.querySelector('svg.grafica')||tarjetas(d).length)fallo('tema/progreso: falta la gráfica o sobran tarjetas');
  if(txt(d.getElementById('migas'))!=='Inicio › Mis notas › Matemáticas › Temas 1 y 2 · Números y planos')fallo('tema/progreso: migas');
  await ir(d,'#/matematicas/temas1-2-numeros-y-planos');
  if(txt(d.getElementById('migas'))!=='Inicio › Mis notas › Matemáticas › Temas 1 y 2 · Números y planos')fallo('tema: migas '+txt(d.getElementById('migas')));
  if(!errores)console.log('  ✓ tema: 7 exámenes con nota, intentos, "sin hacer" en gris, tipos y migas');
  // examen con 2 intentos: gráfica
  await ir(d,'#/matematicas/temas1-2-numeros-y-planos/examen1');
  const filasI=[...d.querySelectorAll('table.intentos tr')].filter(tr=>tr.querySelector('td'));
  if(filasI.length!==2)fallo('examen1: '+filasI.length+' intentos en vez de 2');
  if(!/9,50/.test(txt(filasI[0]))||!/7,00.*8,50/.test(txt(filasI[1])))fallo('examen1: orden o notas de los intentos: '+filasI.map(txt).join(' | '));
  if(!d.querySelector('svg.grafica'))fallo('examen1: falta la gráfica con 2 intentos');
  else{const svg=d.querySelector('svg.grafica').outerHTML;if(/NaN|undefined/.test(svg))fallo('examen1: la gráfica tiene NaN');if((svg.match(/<circle/g)||[]).length!==3)fallo('examen1: la gráfica debería tener 3 puntos (2 intentos + 1 corrección)');}
  const cif=txt(d.querySelector('.cifras'));if(!/Último\s*9,50.*Mejor\s*9,50.*Intentos\s*2/.test(cif))fallo('examen1: cifras '+cif);
  if(d.querySelector('.cabecera a.boton').getAttribute('href')!==R+'examen1/')fallo('examen1: el botón no abre el examen');
  if(!errores)console.log('  ✓ examen: intentos del más reciente al más antiguo, cifras, gráfica sin NaN y botón para abrirlo');
  // examen con 1 intento: sin gráfica; sin hacer: mensaje
  await ir(d,'#/matematicas/temas1-2-numeros-y-planos/examen3');if(d.querySelector('svg.grafica'))fallo('examen3: con 1 intento no debe haber gráfica');
  await ir(d,'#/matematicas/temas1-2-numeros-y-planos/examen2');if(!/Todavía no has hecho este examen/.test(d.body.textContent)||!/Hacer el examen/.test(txt(d.querySelector('a.boton'))))fallo('examen2: estado sin hacer');
  if(!errores)console.log('  ✓ examen: sin gráfica con 1 intento; "sin hacer" con botón para hacerlo');
  // Arts: miniaturas
  await ir(d,'#/arts');const imgs=d.querySelectorAll('.miniaturas img');if(imgs.length!==1||imgs[0].getAttribute('src')!=='data:x')fallo('arts: miniaturas '+imgs.length);
  if(!d.querySelector('.arte a.boton[href="/noatests/arts/examen1/"]'))fallo('arts: falta el botón para abrir el examen');
  if(!errores)console.log('  ✓ Arts: miniaturas de los dibujos guardados y botón para abrir');
  // direcciones raras: vuelven a un sitio válido sin romper
  for(const h of ['#/progreso','#/arts/progreso','#/matematicas/progreso/progreso','#/no-existe','#/matematicas/no-existe','#/matematicas/temas1-2-numeros-y-planos/examen99','#/arts/lo-que-sea','#%E0%A4%A','#/matematicas/temas1-2-numeros-y-planos/examen1/extra']){
    try{await ir(d,h);}catch(e){fallo('dirección "'+h+'" lanza error: '+e.message);continue;}
    if(!tarjetas(d).length&&!d.querySelector('.bloque')&&!d.querySelector('.cifras'))fallo('dirección "'+h+'" deja la pantalla vacía');
  }
  if(!errores)console.log('  ✓ direcciones inexistentes o mal formadas llevan a la pantalla válida más cercana');
  // muchos contenidos: tope de 3 por bloque
  {
    const st={};const tipos={};['leer-escribir','descomponer','valor-posicion','recta','comparar','ordenar','redondear','estimar','plano','traslacion'].forEach((t,i)=>tipos[t]={bien:i,total:10});
    st['noatests-mates:'+R+'examen4/:historial']=JSON.stringify([{fecha:'2026-10-20T10:00:00Z',nota1:5,notaCorr:null,tipos}]);
    const d2=await abrir('notas/index.html',st);await ir(d2,'#/matematicas/progreso');
    const rep=[...d2.querySelectorAll('table.repasar tr')].map(txt),mej=[...d2.querySelectorAll('table.mejores tr')].map(txt);
    if(rep.length!==3||mej.length!==3)fallo('con 10 contenidos: '+rep.length+' para repasar y '+mej.length+' mejores (deben ser 3 y 3)');
    else if(!/^Leer y escribir números.*0%/.test(rep[0])||!/^Traslaciones.*90%/.test(mej[0]))fallo('con 10 contenidos: orden incorrecto: '+rep[0]+' / '+mej[0]);
    else console.log('  ✓ con 10 contenidos la materia muestra solo 3 para repasar y 3 mejores, bien ordenados');
  }
  // sin datos
  d=await abrir('notas/index.html',{});
  if(!/sin exámenes hechos/.test(d.body.textContent))fallo('notas vacías: resumen');
  await ir(d,'#/matematicas/temas1-2-numeros-y-planos');if(tarjetas(d).filter(a=>/sin hacer/.test(txt(a))).length!==7)fallo('notas vacías: tema');
  if(d.querySelector('.tipos')||d.querySelector('.resumen-tipos'))fallo('notas vacías: no debería haber tabla ni resumen de tipos');
  await ir(d,'#/matematicas/progreso');if(d.querySelector('svg.grafica')||!/al menos 2 exámenes/.test(d.body.textContent)||!/verás aquí qué repasar/.test(d.body.textContent))fallo('notas vacías: progreso de materia');
  await ir(d,'#/matematicas/temas1-2-numeros-y-planos/progreso');if(d.querySelector('svg.grafica')||!/verás aquí qué se te da mejor/.test(d.body.textContent))fallo('notas vacías: progreso de tema');
  if(!errores)console.log('  ✓ sin datos: todo "sin hacer" y sin tablas vacías');
  console.log('exportar / importar');
  {
    const st={};const k1='noatests-mates:'+R+'examen1/',h1=k1+':historial';
    st[k1]=JSON.stringify({fecha:'2026-10-18T10:00:00Z',nota1:9.5,notaCorr:null,respuestas:{}});
    st[h1]=JSON.stringify([{fecha:'2026-10-17T10:00:00Z',nota1:7,notaCorr:8.5},{fecha:'2026-10-18T10:00:00Z',nota1:9.5,notaCorr:null}]);
    const d2=await abrir('notas/index.html',st);
    if(!d2.getElementById('btn-exportar')||!d2.getElementById('inp-importar'))fallo('la caja de exportar/importar no está en la página tras cargar el catálogo');
    const fus=d2.defaultView.__noatestsFusionar;
    // entrante: un intento repetido (misma fecha), uno nuevo más reciente, y un examen3 que no teníamos
    const res=fus({[k1]:{fecha:'2026-10-19T09:00:00Z',nota1:8,notaCorr:null,respuestas:{}},[h1]:[{fecha:'2026-10-18T10:00:00Z',nota1:9.5,notaCorr:null},{fecha:'2026-10-19T09:00:00Z',nota1:8,notaCorr:null}],
      ['noatests-mates:'+R+'examen3/']:{fecha:'2026-10-18T12:00:00Z',nota1:6.5,notaCorr:8.75,respuestas:{}},['noatests-mates:'+R+'examen3/:historial']:[{fecha:'2026-10-18T12:00:00Z',nota1:6.5,notaCorr:8.75}],
      'noatests-arts-examen1':[{img:'x'}]});
    const hist=JSON.parse(st[h1]);const ult=JSON.parse(st[k1]);
    if(res.intentos!==2||res.examenes!==2||res.dibujos!==1)fallo('fusión: contadores '+JSON.stringify(res));
    if(hist.length!==3||hist[2].nota1!==8)fallo('fusión: historial no unido sin duplicados: '+JSON.stringify(hist));
    if(ult.nota1!==8)fallo('fusión: no se quedó con el último intento más reciente');
    // importar lo mismo otra vez no cambia nada
    const res2=fus({[h1]:JSON.parse(st[h1]),[k1]:JSON.parse(st[k1])});if(res2.intentos||res2.examenes)fallo('fusión: reimportar duplica');
    // un último intento más antiguo no pisa al actual
    const res3=fus({[k1]:{fecha:'2026-10-01T00:00:00Z',nota1:1}});if(res3.examenes||JSON.parse(st[k1]).nota1!==8)fallo('fusión: un intento antiguo ha pisado al reciente');
    if(!errores)console.log('  ✓ fusiona sin duplicar, conserva lo más reciente y no borra nada');
  }
  if(errores){console.error('\n'+errores+' error(es)');process.exit(1);}else console.log('\nCatálogo, listas y Mis notas correctos.');
})();
