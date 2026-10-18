/* En las listas de exámenes, añade la última nota guardada en este navegador junto a cada enlace. */
(function(){
  const base=location.pathname.replace(/\/index\.html$/,'/');
  document.querySelectorAll('a.examen').forEach(a=>{
    const ruta=new URL(a.getAttribute('href'),location.href).pathname.replace(/\/index\.html$/,'/');
    let res=null;try{res=JSON.parse(localStorage.getItem('noatests-mates:'+ruta));}catch(e){}
    if(!res)return;
    const n=v=>v.toFixed(2).replace('.',',');
    const b=document.createElement('b');b.className='nota-lista';
    b.textContent=res.notaCorr!=null?n(res.nota1)+' → '+n(res.notaCorr):n(res.nota1);
    b.style.cssText='float:right;background:'+(res.nota1>=8?'#4caf50':res.nota1>=5?'#f7a823':'#e4452c')+';color:#fff;border-radius:12px;padding:2px 10px;font-size:.95rem';
    a.appendChild(b);
  });
})();
