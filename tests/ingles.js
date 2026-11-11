/* Comprueba los ejercicios de inglés recalculando cada respuesta que depende de un dibujo o de una regla, con su propia tabla:
   - 10 preguntas; con todo bien da 10,00 y con una mal, menos
   - letras de .comidas: la fila "A is …" / "A [hueco]" tiene como respuesta la comida de la letra A
   - .bandeja: There's some / There are some / There isn't any / There aren't any, y Is there any…? / Are there any…?,
     según lo que hay dentro y si la comida se cuenta (tabla del libro, páginas 23 y 27)
   - Is/Are, some/any (negativa → any), Can you count it?, First/Next/Finally por posición, 1-2-3 por la palabra de orden, c o s
   - cada comida que se dibuja existe en el dibujo, y cada pregunta que dice "Look" tiene dibujo
   Uso: node tests/ingles.js */
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const raiz=path.join(__dirname,'..');
const dir=path.join(raiz,'ingles');
const examenes=[];(function busca(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())busca(p);else if(e.name==='index.html'&&/\/examen\d+\/index\.html$/.test(p))examenes.push(p);}})(dir);
let errores=0;const fallo=m=>{console.error('  ✗ '+m);errores++;};
const norm=s=>String(s).toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
// Tabla propia del test (no la del generador ni la del dibujo): se cuenta = true
const SE_CUENTA={pancakes:true,strawberries:true,mushrooms:true,sandwiches:true,biscuits:true,vegetables:true,crisps:true,
  pasta:false,rice:false,chocolate:false,salad:false,cheese:false,bread:false,fruit:false,chicken:false,'ice cream':false,tuna:false,'tomato sauce':false};
const ORDEN=['first','next','finally'];
// comida que el libro clasifica en sus tablas (p23, p27) o con There's some / There are some (rice p23, sandwiches p24): solo de estas se pregunta si se cuenta
const LIBRO_CLASIFICA=['pasta','tomato sauce','chocolate','pancakes','mushrooms','strawberries','ice cream','fruit','chicken','biscuits','crisps','vegetables','rice','sandwiches'];
const SPELL={juice:1,nice:1,sandwich:1,salad:1};
const respuestaDe=f=>{const g=f.querySelector('.grupo');const i=f.querySelector('input[data-r]');return g?g.dataset.r:i?i.dataset.r:null;};

for(const f of examenes.sort()){
  const rel=path.relative(raiz,f);console.log(rel);
  const html=fs.readFileSync(f,'utf8').replace(/<script src="[^"]*"><\/script>/g,'');
  const abrir=()=>{const dom=new JSDOM(html,{url:'https://x.test/noatests/'+rel.replace('index.html',''),runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;const st={};
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>st[k]??null,setItem:(k,v)=>st[k]=String(v),removeItem:k=>delete st[k],key:i=>Object.keys(st)[i],get length(){return Object.keys(st).length;}}});
    w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};w.requestAnimationFrame=()=>0;w.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},save(){},restore(){},translate(){},rotate(){}});
    w.eval(fs.readFileSync(path.join(dir,'dibujos.js'),'utf8'));w.eval(fs.readFileSync(path.join(raiz,'comun/examen.js'),'utf8'));return w;};
  let w;try{w=abrir();}catch(e){fallo('no carga: '+e.message);continue;}
  const d=w.document;const qs=[...d.querySelectorAll('.pregunta')];let comprobadas=0;
  if(qs.length!==10)fallo(qs.length+' preguntas, no 10');
  if(d.documentElement.dataset.voz!=='en-GB')fallo('la página no lee en voz alta en inglés (falta data-voz="en-GB")');
  qs.forEach((q,k)=>{
    const P='pregunta '+(k+1)+': ';const h=q.querySelector('h2').textContent;
    if(/^\s*\d*\s*Look/.test(h)&&!q.querySelector('.comidas,.bandeja,.comida'))fallo(P+'dice "Look" y no tiene dibujo');
    const letras={};q.querySelectorAll('.comidas').forEach(c=>{const vis=[...c.querySelectorAll('.letra-ing')].map(x=>x.textContent);
      c.dataset.letras.split(';').forEach(p=>{const [L,v]=p.split('=');letras[L]=v;if(!vis.includes(L))fallo(P+'la letra '+L+' no se ve');if(!(v in SE_CUENTA))fallo(P+v+' no es comida de la unidad');});
      if(!c.querySelectorAll('.emoji').length)fallo(P+'las tarjetas de comida no se han pintado');});
    const ban=q.querySelector('.bandeja');const hay=ban?ban.dataset.hay.split(',').map(s=>s.trim()):null;
    if(ban&&!ban.querySelector('.dentro span'))fallo(P+'la bandeja no se ha pintado');
    if(ban&&ban.querySelectorAll('.dentro .item').length!==hay.length)fallo(P+'la bandeja pinta '+ban.querySelectorAll('.dentro .item').length+' cosas y hay '+hay.length);
    q.querySelectorAll('.fila').forEach(fi=>{
      const r=respuestaDe(fi);const t=fi.textContent;
      const ok=(esperado,que)=>{comprobadas++;if(r==null)return fallo(P+que+': sin hueco');if(norm(r)!==norm(esperado))fallo(P+que+': la respuesta es "'+r+'" y debería ser "'+esperado+'"');};
      const b=[...fi.querySelectorAll('b')].find(x=>/^[A-Z]$/.test(x.textContent.trim()));
      if(b){const L=b.textContent.trim();if(!(L in letras))fallo(P+'pregunta por '+L+' y no está en el dibujo');else ok(letras[L],'letra '+L);}
      const cm=fi.dataset.comida;if(cm){if(!hay)fallo(P+'frase sin bandeja');else{const c=SE_CUENTA[cm],si=hay.includes(cm);ok(si?(c?'There are some':"There's some"):(c?"There aren't any":"There isn't any"),cm);}}
      const pr=fi.dataset.pregunta;if(pr){if(!hay)fallo(P+'pregunta sin bandeja');else{const c=SE_CUENTA[pr],si=hay.includes(pr);
        if(!new RegExp('^'+(c?'Are':'Is')+' there any '+pr+'\\?').test(t.trim()))fallo(P+'la pregunta sobre '+pr+' debería empezar por "'+(c?'Are':'Is')+' there any"');
        ok(c?(si?'Yes, there are.':"No, there aren't."):(si?'Yes, there is.':"No, there isn't."),'Is/Are there any '+pr);}}
      const ia=fi.dataset.isare;if(ia)ok(SE_CUENTA[ia]?'Are':'Is','Is/Are '+ia);
      const ct=fi.dataset.contar;if(ct&&!LIBRO_CLASIFICA.includes(ct))fallo(P+'el libro no dice si '+ct+' se cuenta (tablas de las páginas 23 y 27)');if(ct){ok(SE_CUENTA[ct]?'Yes':'No','¿se cuenta '+ct+'?');if(!fi.querySelector('.comida'))fallo(P+'falta el dibujo de '+ct);}
      const sa=fi.dataset.someany;if(sa)ok(/n't/.test(t)?'any':'some','some/any '+sa);
      const ps=fi.dataset.paso;if(ps)ok(['First','Next','Finally'][+ps-1],'paso '+ps);
      if(fi.dataset.orden){const pal=norm(t).match(/^(first|next|finally)\b/);if(!pal)fallo(P+'frase sin first/next/finally');else ok(String(ORDEN.indexOf(pal[1])+1),'orden de "'+t.slice(0,25)+'"');}
      const pa=fi.dataset.palabra;if(pa){if(!SPELL[pa])fallo(P+pa+' no es de Say and spell');ok(pa[+fi.dataset.pos],'letra de '+pa);
        const vis=fi.querySelector('.palabra');const pos=+fi.dataset.pos;if(!vis||vis.textContent!==pa.slice(0,pos)+'_'+pa.slice(pos+1))fallo(P+'la palabra con hueco no corresponde a '+pa);}
    });
    q.querySelectorAll('.grupo').forEach(g=>{const ops=[...g.querySelectorAll('.opcion')].map(o=>norm(o.textContent));if(!ops.includes(norm(g.dataset.r)))fallo(P+'la respuesta no está entre las opciones');if(new Set(ops).size!==ops.length)fallo(P+'opciones repetidas');});
  });
  const rellenar=(d,fallar)=>{d.querySelectorAll('input[data-r]').forEach(i=>i.value=i.dataset.r);
    d.querySelectorAll('.grupo').forEach((g,k)=>{const ops=[...g.querySelectorAll('.opcion')];(k===fallar?ops.find(o=>norm(o.textContent)!==norm(g.dataset.r)):ops.find(o=>norm(o.textContent)===norm(g.dataset.r))).click();});
    d.getElementById('corregir').click();return d.getElementById('r-nota').textContent;};
  // pistas en castellano: cada dibujo de comida tiene la suya, escondida hasta tocar 💡
  const CAST=w.noatestsIngles.CASTELLANO;
  d.querySelectorAll('.tarjeta-comida,.bandeja,.comida-pista').forEach(c=>{const ts=[...c.querySelectorAll('.pista-txt')];
    if(!c.querySelector('.pista')||!ts.length)fallo('un dibujo no tiene pista en castellano');
    if(ts.some(t=>!t.hidden))fallo('una pista se ve sin tocar 💡');
    c.querySelector('.pista').click();if(ts.some(t=>t.hidden))fallo('tocar 💡 no enseña la pista');c.querySelector('.pista').click();});
  d.querySelectorAll('.tarjeta-comida').forEach(c=>{const L=c.querySelector('.letra-ing').textContent;const q=c.closest('.pregunta');const v=(q.querySelector('.comidas').dataset.letras.split(';').map(x=>x.split('=')).find(([l])=>l===L)||[])[1];
    if(c.querySelector('.pista-txt').textContent!==CAST[v])fallo('la pista de '+v+' no es '+CAST[v]);});
  // la voz no lee dibujos, pistas ni lo que hay que escribir
  qs.forEach((q,k)=>{const t=w.__noatestsLeer(q);const P='pregunta '+(k+1)+': la voz ';
    if(/[\p{Extended_Pictographic}]/u.test(t))fallo(P+'lee un dibujo: '+t.slice(0,80));
    {const ps=[...q.querySelectorAll('.pista-txt')];const antes=ps.map(x=>x.textContent);ps.forEach(x=>x.textContent='zzpistazz');if(w.__noatestsLeer(q).includes('zzpistazz'))fallo(P+'lee las pistas en castellano');ps.forEach((x,k)=>x.textContent=antes[k]);}
    q.querySelectorAll('input[data-r]').forEach(x=>{if(new RegExp('\\b'+x.dataset.r+'\\b','i').test(t))fallo(P+'dice la respuesta "'+x.dataset.r+'"');});
    if(/_____/.test(t))fallo(P+'lee las rayas de los huecos');});
  // usar pistas no cambia la nota
  {const w4=abrir();w4.document.querySelectorAll('.pista').forEach(b=>b.click());if(!rellenar(w4.document,-1).startsWith('10,00'))fallo('usar las pistas cambia la nota');}
  const n1=rellenar(d,-1);if(!n1.startsWith('10,00'))fallo('con todo bien da '+n1);
  const w2=abrir();if(rellenar(w2.document,0).startsWith('10,00'))fallo('con una mal sigue dando 10');
  if(!errores)console.log('  ✓ 10,00 · '+comprobadas+' respuestas recalculadas desde el dibujo o la regla');
}
if(errores){console.error('\n'+errores+' error(es)');process.exit(1);}else console.log('\nTodo correcto ('+examenes.length+' ejercicios de inglés).');
