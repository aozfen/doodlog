// Ekim 2026 ay sayfası. 1 Ekim = Perşembe, bugün = 25.
const MEM={3:'cift_03',7:'cift_07',12:'cift_02',15:'cift_05',18:'cift_04',21:'cift_06',24:'cift_08',25:'cift_01'};
document.querySelectorAll('[data-month]').forEach(el=>{
  let h=['Pt','Sa','Ça','Pe','Cu','Ct','Pz'].map(d=>`<b>${d}</b>`).join('')+'<i></i>'.repeat(3);
  for(let d=1;d<=31;d++){
    const m=(el.dataset.only?JSON.parse(el.dataset.only):{...MEM,...(el.dataset.month?JSON.parse(el.dataset.month):{})})[d],c=[m&&'has',d==25&&'today',d>25&&'fut'].filter(Boolean).join(' ');
    h+=`<span class="${c}"><em>${d}</em>${m?`<img class="stk" src="assets/${m}.png" alt="" style="--r:${d*37%13-6}deg">`:''}</span>`;
  }
  el.innerHTML=h;
});
// Ortak ikonlar: <svg data-i="book">
const I={
  nb:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12.5 8h3.5M12.5 12h3.5"/>',
  book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  brush:'<path d="M14 4l6 6-8 8-6-6z"/><path d="M6 12l-2 6 6-2"/>',
  share:'<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6h14v-6"/>',
  img:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  redo:'<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  dl:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  check:'<path d="M5 12l5 5 9-10"/>',
  me:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'
};
document.querySelectorAll('svg[data-i]').forEach(s=>{
  s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');
  s.setAttribute('stroke-width','2');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');
  s.setAttribute('aria-hidden','true');s.innerHTML=I[s.dataset.i];
});
// Prototip gezinme: üstte sabit menü + her telefonun üstünde adı (önündeki HTML yorumundan).
const NAV=[['a-onboarding.html','1 · İlk açılış'],['a-v2.html','2 · Ana sayfa'],['a-ekle.html','3 · Anı ekle'],['a-takvim.html','4 · Takvim'],['a-firca.html','5 · Fırça'],['a-widget.html','6 · Widget'],['a-ortak.html','7 · Ortak defter'],['a-defter.html','8 · Yeni defter'],['a-davet-yakinda.html','9 · Davet (yakında)'],['a-ayarlar.html','10 · Ayarlar'],['a-ani-menu.html','11 · Anı menüsü'],['a-defter-ayar.html','12 · Defter ayarları'],['a-hata.html','13 · İzin ve hata']],
ARC=[];
(()=>{
  const cur=location.pathname.split('/').pop()||'a-v2.html',ln=([h,t])=>`<a href="${h}"${h==cur?' aria-current="page"':''}>${t}</a>`;
  const n=document.createElement('nav');n.className='pnav';
  n.innerHTML=`<div>${NAV.map(ln).join('')}</div>${ARC.length?`<div class="arc">Arşiv: ${ARC.map(ln).join('')}</div>`:''}`;
  document.body.prepend(n);
  document.querySelectorAll('.phone').forEach(p=>{
    let c=p.previousSibling;while(c&&c.nodeType==3)c=c.previousSibling;
    const w=document.createElement('div');w.className='pw';p.before(w);
    if(c&&c.nodeType==8){const s=document.createElement('span');s.textContent=c.data.trim();w.append(s)}
    w.append(p);
  });
})();
