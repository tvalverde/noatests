/* Comprueba los ejercicios de Lengua recalculando cada respuesta con tablas propias sacadas del libro (no las del generador):
   infinitivos, conjugación por la terminación, singular/plural, persona y número, verbos de sonidos de animales,
   onomatopeyas, frases del cuento por partes, apartados de la ficha de un animal, orden de Pulgarcito y la conjugación regular.
   Además: 10 preguntas, todo bien da 10,00 y una mal, menos.
   Uso: node tests/lengua.js */
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const raiz=path.join(__dirname,'..');const dir=path.join(raiz,'lengua');
const examenes=[];(function busca(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())busca(p);else if(e.name==='index.html'&&/\/examen\d+\/index\.html$/.test(p))examenes.push(p);}})(dir);
let errores=0;const fallo=m=>{console.error('  ✗ '+m);errores++;};
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
// ---- tablas del libro (páginas 44-49) ----
const INF={'pía':'piar','subirá':'subir','comían':'comer','duerme':'dormir','ladran':'ladrar','corría':'correr',
  'seca':'secar','nada':'nadar','vuelan':'volar','come':'comer','viven':'vivir','salta':'saltar','llena':'llenar','riégala':'regar','pon':'poner','espera':'esperar','haz':'hacer','introduce':'introducir','rellénala':'rellenar','mete':'meter','recibirás':'recibir'};
const ES_VERBO={cantar:true,abridor:false,piar:true,billar:false,aburrir:true,saltar:true,mesa:false,correr:true,bonito:false,escribir:true};
const N=['singular','plural'];
const PN={'pide':[3,0],'paseaban':[3,1],'salimos':[1,1],'entrenarás':[2,0],'sumó':[3,0],
  'sueño':[1,0],'entiendes':[2,0],'dice':[3,0],'responsabilizamos':[1,1],'estáis':[2,1],'crecen':[3,1]};
const ANIMAL={croa:'rana',mugía:'vaca',cacarea:'gallina',rugieron:'león',balaban:'oveja','gruñirá':'cerdo'};
const ONO={aplaudir:'plas, plas',chapotear:'chap, chap',traquetear:'traca, traca',piar:'pío, pío',mugir:'muuu',chasquear:'chas',
  'el perro':'guau','la vaca':'muuu','la rana':'croac','el gallo':'quiquiriquí','aplaudir':'plas, plas','comer algo rico':'ñam, ñam','una pelota que bota':'boing',
  'un plato que se rompe':'crac','el teléfono':'ring, ring','el reloj':'tic-tac','un perro inglés':'woof','el gato':'miau','la vaca':'muuu'};
const PARTE={'érase una vez…':'Inicio','en un país muy lejano…':'Inicio','hace muchos años…':'Inicio','pasó en…':'Inicio',
  'de repente…':'Nudo','de pronto…':'Nudo','entonces…':'Nudo','en un momento dado…':'Nudo',
  'finalmente…':'Desenlace','por fin…':'Desenlace','y así concluyó…':'Desenlace','todo terminó…':'Desenlace','y colorín colorado, este cuento se ha acabado.':'Desenlace','y fueron felices y comieron perdices.':'Desenlace'};
const VOC={'Cómo es':['pelo','plumas','patas','pezuñas','escamas','cuernos','alas','aletas','antenas','caparazón'],'Cómo se desplaza':['camina','repta','vuela','nada','salta'],
  'Qué come':['plantas','flores','frutas','otros animales','de todo'],'Dónde vive':['bosque','ciudad','mar','río']};
const PULGARCITO=[[/habia una vez un nino diminuto/,'1'],[/su padre los abandono en el bosque/,'2'],[/ayudo al rey/,'3']];
// presente de los verbos regulares (como cuidar y crecer en el libro): terminación de cada persona
const TERM={ar:{yo:'o','tú':'as','él':'a',ella:'a',nosotros:'amos',vosotros:'áis',ellos:'an',ellas:'an'},er:{yo:'o','tú':'es','él':'e',ella:'e',nosotros:'emos',vosotros:'éis',ellos:'en',ellas:'en'},ir:{yo:'o','tú':'es','él':'e',ella:'e',nosotros:'imos',vosotros:'ís',ellos:'en',ellas:'en'}};
const PRON={yo:[1,0],'tú':[2,0],'él':[3,0],ella:[3,0],nosotros:[1,1],vosotros:[2,1],ellos:[3,1],ellas:[3,1]};
// persona y número de una forma regular: se busca qué pronombre da esa forma con la raíz del infinitivo
function personaNumero(forma,inf){const t=inf.slice(-2),r=inf.slice(0,-2);const p=Object.keys(TERM[t]||{}).find(k=>norm(r+TERM[t][k])===norm(forma));return p?PRON[p]:undefined;}
const SONIDOS=new Set(['guau','miau','muuu','pio, pio','croac','quiquiriqui','beee','tic-tac','crac','ring, ring','nam, nam','ñam, ñam','boing','plas, plas','chap, chap','traca, traca','chas','woof','cri cri']);
const limpiaOno=x=>norm(x).replace(/[¡!]/g,'').trim();
const FORMAS={corren:'correr',saltan:'saltar',comes:'comer'};
// las claves se comparan sin tildes ni mayúsculas, igual que las respuestas
const sinTildes=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[norm(k),v]));
const ONOK=x=>norm(x).replace(/[^a-zñáéíóúü ,-]/g,'').trim();
const INFN=sinTildes(INF),PNN=sinTildes(PN),ANIMALN=sinTildes(ANIMAL),ONON=Object.fromEntries(Object.entries(ONO).map(([k,v])=>[ONOK(k),v])),PARTEN=sinTildes(PARTE);
const VOCN=Object.fromEntries(Object.entries(VOC).map(([k,v])=>[k,v.map(norm)]));
const respuestaDe=f=>{const g=f.querySelector('.grupo');const i=f.querySelector('input[data-r]');return g?g.dataset.r:i?i.dataset.r:null;};

for(const f of examenes.sort()){
  const rel=path.relative(raiz,f);console.log(rel);
  const html=fs.readFileSync(f,'utf8').replace(/<script src="[^"]*"><\/script>/g,'');
  const abrir=()=>{const dom=new JSDOM(html,{url:'https://x.test/noatests/'+rel.replace('index.html',''),runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;const st={};
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>st[k]??null,setItem:(k,v)=>st[k]=String(v),removeItem:k=>delete st[k],key:i=>Object.keys(st)[i],get length(){return Object.keys(st).length;}}});
    w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};w.requestAnimationFrame=()=>0;
    w.eval(fs.readFileSync(path.join(raiz,'comun/examen.js'),'utf8'));return w;};
  let w;try{w=abrir();}catch(e){fallo('no carga: '+e.message);continue;}
  const d=w.document;const qs=[...d.querySelectorAll('.pregunta')];let n=0;
  if(qs.length!==10)fallo(qs.length+' preguntas, no 10');
  qs.forEach((q,k)=>{const P='pregunta '+(k+1)+': ';
    q.querySelectorAll('.fila').forEach(fi=>{const r=respuestaDe(fi);const ds=fi.dataset;
      const ok=(esp,que)=>{n++;if(esp===undefined)return fallo(P+que+': no está en las tablas del libro');if(r==null)return fallo(P+que+': sin hueco');if(norm(r)!==norm(esp))fallo(P+que+': la respuesta es "'+r+'" y debería ser "'+esp+'"');};
      if(ds.inf)ok(INFN[norm(ds.inf)],'infinitivo de '+ds.inf);
      if(ds.esverbo)ok(ds.esverbo in ES_VERBO?(ES_VERBO[ds.esverbo]?'Sí':'No'):undefined,'¿es verbo '+ds.esverbo+'?');
      if(ds.conj){const t=ds.conj.slice(-2);ok({ar:'1.ª conjugación',er:'2.ª conjugación',ir:'3.ª conjugación'}[t],'conjugación de '+ds.conj);}
      if(ds.num){const [fo,inf]=ds.num.split('|');const pn=inf?personaNumero(fo,inf):PNN[norm(fo)];ok(pn?N[pn[1]]:undefined,'número de '+fo);}
      if(ds.per){const [fo,inf]=ds.per.split('|');const pn=inf?personaNumero(fo,inf):PNN[norm(fo)];ok(pn?pn[0]+'.ª persona':undefined,'persona de '+fo);}
      if(ds.esono){const ops=[...fi.querySelectorAll('.opcion')].map(o=>o.textContent);const son=ops.filter(o=>SONIDOS.has(limpiaOno(o)));n++;if(son.length!==1)fallo(P+'hay '+son.length+' onomatopeyas entre las opciones: '+ops.join(' / '));else if(norm(son[0])!==norm(r))fallo(P+'la onomatopeya es '+son[0]+' y la respuesta '+r);}
      if(ds.misteriosa){const [t,per,num]=ds.misteriosa.split('|');const ops=[...fi.querySelectorAll('.opcion')].map(o=>o.textContent);
        const val=ops.filter(o=>{const inf=FORMAS[norm(o)];if(!inf||!inf.endsWith(t))return false;const pn=personaNumero(o,inf);return pn&&pn[0]===+per&&N[pn[1]]===num;});n++;
        if(val.length!==1)fallo(P+'la palabra misteriosa tiene '+val.length+' soluciones');else if(norm(val[0])!==norm(r))fallo(P+'la palabra misteriosa es '+val[0]);}
      if(ds.pn)ok(PNN[norm(ds.pn)]?PNN[norm(ds.pn)][0]+'.ª persona del '+N[PNN[norm(ds.pn)][1]]:undefined,'persona de '+ds.pn);
      if(ds.animal){const a=ANIMALN[norm(ds.animal)];n++;if(!a)fallo(P+ds.animal+' no está en la tabla');else if(!norm(r).includes(norm(a)))fallo(P+ds.animal+' es de '+a+' y la respuesta es '+r);}
      if(ds.ono){const o=ONON[ONOK(ds.ono)];n++;if(!o)fallo(P+ds.ono+' no está en la tabla');else if(norm(r).replace(/[¡!]/g,'').trim()!==norm(o))fallo(P+ds.ono+' hace "'+o+'" y la respuesta es '+r);}
      if(ds.parte)ok(PARTEN[norm(ds.parte)],'parte de '+ds.parte);
      if(ds.voc){const ap=Object.keys(VOCN).find(a=>VOCN[a].includes(norm(ds.voc).replace(/ \(.*\)$/,'')));ok(ap,'apartado de '+ds.voc);}
      if(ds.pulgarcito){const t=norm(fi.textContent);const p=PULGARCITO.find(([re])=>re.test(t));ok(p&&p[1],'orden de Pulgarcito');}
      if(ds.conjuga){const [inf,pron]=ds.conjuga.split('|');const raizV=inf.slice(0,-2),t=inf.slice(-2);ok(TERM[t]&&TERM[t][pron]!==undefined?raizV+TERM[t][pron]:undefined,inf+' con '+pron);}
    });
    q.querySelectorAll('.grupo').forEach(g=>{const ops=[...g.querySelectorAll('.opcion')].map(o=>norm(o.textContent));if(!ops.includes(norm(g.dataset.r)))fallo(P+'la respuesta no está entre las opciones');if(new Set(ops).size!==ops.length)fallo(P+'opciones repetidas');});
  });
  const rellenar=(d,fallar)=>{d.querySelectorAll('input[data-r]').forEach(i=>i.value=i.dataset.r);
    d.querySelectorAll('.grupo').forEach((g,k)=>{const ops=[...g.querySelectorAll('.opcion')];(k===fallar?ops.find(o=>norm(o.textContent)!==norm(g.dataset.r)):ops.find(o=>norm(o.textContent)===norm(g.dataset.r))).click();});
    d.getElementById('corregir').click();return d.getElementById('r-nota').textContent;};
  const n1=rellenar(d,-1);if(!n1.startsWith('10,00'))fallo('con todo bien da '+n1);
  if(rellenar(abrir().document,0).startsWith('10,00'))fallo('con una mal sigue dando 10');
  if(!errores)console.log('  ✓ 10,00 · '+n+' respuestas recalculadas con las tablas del libro');
}
if(errores){console.error('\n'+errores+' error(es)');process.exit(1);}else console.log('\nTodo correcto ('+examenes.length+' ejercicios de lengua).');
