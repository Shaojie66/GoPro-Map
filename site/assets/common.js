// 全站共用：导航、页脚、小红书卡片、作品列表。
(function(){
const page=document.body.dataset.page;
const tabs=[["index.html","首页","home"],["map.html","地图","map"],["stops.html","每一站","stops"],["community.html","社区","community"],["join.html","报名","join"]];
const nav=document.createElement("nav"); nav.className="nav"; nav.setAttribute("aria-label","主导航");
const inner=document.createElement("div"); inner.className="nav-in";
const brand=document.createElement("a"); brand.className="brand"; brand.href="index.html"; brand.textContent="GoPro 流浪计划";
inner.append(brand);
tabs.slice(1).forEach(([href,label,key])=>{
  const a=document.createElement("a"); a.className="tab"+(key==="join"?" join":""); a.href=href; a.textContent=label;
  if(key===page) a.setAttribute("aria-current","page");
  inner.append(a);
});
nav.append(inner); document.body.prepend(nav);

const wrap=document.querySelector(".wrap");
if(wrap){
  const f=document.createElement("footer");
  f.innerHTML=`<div class="host"><img src="${GP.avatarSrc(GP.host.avatar)}" alt="发起人${GP.host.name}的头像"><div class="hn">发起人 ${GP.host.name}<div class="muted">小红书私信我，拿地图链接、进围观群</div></div></div>
  <div class="ht">#GoPro流浪计划</div><div>每周更新，在小红书、抖音、B 站搜话题就能找到</div><div><a href="about.html">关于这个计划</a></div>`;
  wrap.append(f);
}
})();

GP.copyBtn=function(text,target){
  const b=document.createElement("button"); b.className="btn"; b.type="button"; b.textContent="复制";
  b.addEventListener("click",()=>{
    const sel=()=>{const r=document.createRange();r.selectNodeContents(target);const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent="已选中，长按复制";};
    try{navigator.clipboard.writeText(text).then(()=>{b.textContent="已复制";setTimeout(()=>b.textContent="复制",1500);},sel);}catch(e){sel();}
  });
  return b;
};
GP.xhsRow=function(s){
  const row=document.createElement("div"); row.className="xhs";
  if(s.avatar){const im=document.createElement("img"); im.src=GP.avatarSrc(s.avatar); im.alt=`${s.xhs}的头像`; row.append(im);}
  const l=document.createElement("span"); l.className="xhs-label"; l.textContent="小红书";
  const v=document.createElement("span"); v.className="xhs-id"; v.textContent=s.xhs||"即将公布";
  row.append(l,v);
  if(s.xhs) row.append(GP.copyBtn(s.xhs,v));
  return row;
};
GP.worksList=function(works,emptyText){
  if(!works||!works.length){const d=document.createElement("div"); d.className="empty"; d.textContent=emptyText; return d;}
  const ul=document.createElement("ul"); ul.className="works";
  works.forEach(w=>{
    const li=document.createElement("li"), a=document.createElement("a");
    a.href=w.url; a.target="_blank"; a.rel="noopener";
    const p=document.createElement("span"); p.className="plat"; p.textContent=w.platform;
    const t=document.createElement("span"); t.textContent=w.title||"去看看";
    a.append(p,t); li.append(a); ul.append(li);
  });
  return ul;
};
// 站点列表：只列已经开始的站。
GP.stopList=function(){
  const ol=document.createElement("ol"); ol.className="stops";
  GP.shown.map((s,i)=>({s,i})).reverse().forEach(({s,i})=>{
    const li=document.createElement("li"), a=document.createElement("a");
    a.className="stop"+(i===GP.cur?" now":""); a.href=`stop.html?n=${i+1}`;
    a.innerHTML=`<div class="wk">${i+1}<small>第 ${i+1} 站</small></div><div class="who"><div class="n"></div><div class="m"></div></div><span class="st ${i===GP.cur?"now":"done"}">${i===GP.cur?"正在拍":"看作品"}</span>`;
    a.querySelector(".n").textContent=GP.ZH[s.city];
    a.querySelector(".m").textContent=`${GP.md(s.start)} 起 · ${s.xhs||"持有人"}`;
    li.append(a); ol.append(li);
  });
  return ol;
};
