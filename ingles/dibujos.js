/* Dibujos de los ejercicios de inglés: comida con emoji (se ven en color en móviles y tablets; no se copia ninguna imagen del libro).
   Las respuestas que dependen del dibujo salen de los mismos datos (los tests lo comprueban con su propia tabla).
   <div class="comidas" data-letras="A=pancakes;B=cheese"></div>        → tarjetas con la comida y una letra roja
   <div class="bandeja" data-hay="pasta,salad" data-titulo="Rick's lunch" data-estilo="bandeja|bolsa|tienda|nevera|cesta"></div>
        → lo que hay dentro; lo que no está en data-hay no está
   <span class="comida" data-comida="rice"></span>                       → una comida pequeña dentro de una frase
   Comida que se cuenta (countable) se pinta repetida (🍓🍓🍓) para que se vea que son varias. */
(function(){
'use strict';
// Pista en castellano de cada dibujo: se ve al tocar 💡, se puede usar siempre y no cuenta en la nota
const CASTELLANO={pancakes:'tortitas',strawberries:'fresas',mushrooms:'champiñones',sandwiches:'sándwiches',biscuits:'galletas',vegetables:'verduras',
  pasta:'pasta',rice:'arroz',chocolate:'chocolate',salad:'ensalada',cheese:'queso',bread:'pan',fruit:'fruta',chicken:'pollo','ice cream':'helado',juice:'zumo'};
const COMIDAS={
  pancakes:{e:'🥞🥞',c:true}, strawberries:{e:'🍓🍓🍓',c:true}, mushrooms:{e:'🍄🍄',c:true}, sandwiches:{e:'🥪🥪',c:true},
  biscuits:{e:'🍪🍪🍪',c:true}, vegetables:{e:'🥕🥦🌽',c:true},
  pasta:{e:'🍝',c:false}, rice:{e:'🍚',c:false}, chocolate:{e:'🍫',c:false}, salad:{e:'🥗',c:false}, cheese:{e:'🧀',c:false},
  bread:{e:'🍞',c:false}, fruit:{e:'🍎🍌🍇',c:false}, chicken:{e:'🍗',c:false}, 'ice cream':{e:'🍨',c:false}, juice:{e:'🧃',c:false}
};
const ESTILOS={bandeja:['🍽️','#fdf1d8','#d9a441'],bolsa:['🛍️','#eaf6ec','#4caf50'],tienda:['🏪','#e8f3fb','#2b8fc0'],nevera:['🧊','#eef4fb','#8aa9c9'],cesta:['🧺','#fbefe3','#b9793a']};
const css=`.comidas{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:10px 0}
.comidas .tarjeta-comida{position:relative;background:#fff;border:2px solid #e5e5e5;border-radius:16px;min-width:96px;padding:14px 10px 8px;text-align:center}
.comidas .emoji{font-size:2.4rem;line-height:1.2;white-space:nowrap}
.comidas .nombre{font-weight:800;font-size:1rem}
.letra-ing{position:absolute;top:-10px;left:-10px;width:30px;height:30px;border-radius:50%;background:#fff;border:3px solid #e4452c;color:#e4452c;font-weight:800;line-height:24px;text-align:center}
.bandeja{border-radius:18px;padding:10px 12px 14px;margin:10px auto;max-width:420px;border:3px solid var(--borde);background:var(--fondo)}
.bandeja .titulo-ban{font-weight:800;text-align:center;margin-bottom:6px}
.bandeja .dentro{display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:center;font-size:2.3rem;line-height:1.25}
.raya{display:inline-block;min-width:3.2em;border-bottom:3px solid #c0392b;color:transparent;margin:0 2px}
.palabra{font-size:1.4rem;letter-spacing:4px;margin-right:6px}
.pista{border:2px solid #f2d27a;background:#fff8dc;border-radius:50%;width:32px;height:32px;padding:0;font-size:1rem;cursor:pointer;vertical-align:middle;margin:0 4px}
.pista:focus-visible{outline:3px solid #2b6cd9}
.pista-txt{display:block;font-size:.9rem;font-weight:700;color:#7a5b00;font-style:italic;line-height:1.2}
.pista-txt[hidden]{display:none}
.comida-pista .pista-txt{display:inline;margin-left:4px}
.comida-pista .pista-txt[hidden]{display:none}
.tarjeta-comida .pista{position:absolute;bottom:-12px;right:-10px}
.comidas{row-gap:20px!important}
.bandeja .dentro span.item{display:inline-flex;flex-direction:column;align-items:center}
.comida{font-size:1.9rem;vertical-align:middle;margin:0 4px;white-space:nowrap}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const emoji=n=>{const c=COMIDAS[n.trim()];if(!c)throw new Error('Comida sin dibujo: '+n);return c.e;};
const letras=s=>(s||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i).trim(),x.slice(i+1).trim()];});
const castellano=n=>{const c=CASTELLANO[n.trim()];if(!c)throw new Error('Comida sin pista: '+n);return c;};
const boton=()=>`<button type="button" class="pista" aria-label="Pista en castellano" title="Pista en castellano">💡</button>`;
const txt=n=>`<span class="pista-txt" hidden>${castellano(n)}</span>`;
// tocar 💡 enseña u oculta las pistas de su dibujo (el contenedor más cercano con pistas)
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.pista');if(!b)return;
  const caja=b.closest('.tarjeta-comida,.bandeja,.comida-pista');if(!caja)return;const ts=caja.querySelectorAll('.pista-txt');const ver=[...ts].some(t=>t.hidden);ts.forEach(t=>t.hidden=!ver);});
document.querySelectorAll('.comidas').forEach(d=>{
  d.innerHTML=letras(d.dataset.letras).map(([L,n])=>`<div class="tarjeta-comida"><span class="letra-ing">${L}</span>${boton()}<div class="emoji" role="img" aria-label="${L}">${emoji(n)}</div>${txt(n)}</div>`).join('');
});
document.querySelectorAll('.bandeja').forEach(d=>{
  const [ico,fondo,borde]=ESTILOS[d.dataset.estilo||'bandeja'];d.style.setProperty('--fondo',fondo);d.style.setProperty('--borde',borde);
  const hay=(d.dataset.hay||'').split(',').map(x=>x.trim()).filter(Boolean);
  d.innerHTML=`<div class="titulo-ban">${ico} ${d.dataset.titulo||''} ${boton()}</div><div class="dentro">${hay.map(n=>`<span class="item"><span role="img" aria-label="food">${emoji(n)}</span>${txt(n)}</span>`).join('')}</div>`;
});
document.querySelectorAll('.comida').forEach(d=>{d.textContent=emoji(d.dataset.comida);d.setAttribute('role','img');d.setAttribute('aria-label','food');
  const w=document.createElement('span');w.className='comida-pista';d.replaceWith(w);w.appendChild(d);w.insertAdjacentHTML('beforeend',boton()+txt(d.dataset.comida));});
window.noatestsIngles={COMIDAS,CASTELLANO};
})();
