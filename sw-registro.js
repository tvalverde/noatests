if('serviceWorker' in navigator){
  const base=location.pathname.split('/')[1]==='noatests'?'/noatests/':'/';
  navigator.serviceWorker.register(base+'sw.js',{scope:base}).catch(()=>{});
}
