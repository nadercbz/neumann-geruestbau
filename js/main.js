(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
var pad=function(n,l){n=String(n);while(n.length<l)n='0'+n;return n};

/* ---------- Scroll Sequenz ---------- */
var F=window.NEUMANN_FRAMES, N=F.count, scrolly=$('#scrolly'), stage=$('.stage'), canvas=$('#seq'), ctx=canvas.getContext('2d');
var mobile=window.matchMedia('(max-width:860px)'), dir=mobile.matches?'m':'d';
var imgs=new Array(N), loaded=new Array(N), nLoaded=0, cur=0, target=0, needs=true;
var HOLD=0.94; // die letzten 6 % des Scrollwegs bleibt das Schlussbild stehen
var phases=$$('.phases li').map(function(el){return{el:el,a:+el.dataset.a,b:+el.dataset.b,hero:el.classList.contains('is-hero')}});
var hero=$('.hero'), meterNum=$('#meterNum'), meterBar=$('#meterBar'), meterPct=$('#meterPct'), cue=$('#scrollcue'), loader=$('#loader'), loaderBar=$('#loader i'), nav=$('#nav');

function src(i){return 'assets/frames/'+dir+'/f_'+pad(i+1,3)+'.webp?v='+(F.v||1)}
function order(){var seen={},out=[];[16,8,4,2,1].forEach(function(s){for(var i=0;i<N;i+=s){if(!seen[i]){seen[i]=1;out.push(i)}}});return out}
var queue=order(), active=0;
function pump(){
  while(active<6&&queue.length){(function(i){
    active++;var im=new Image();im.decoding='async';
    im.onload=im.onerror=function(){active--;if(im.naturalWidth){imgs[i]=im;loaded[i]=true}nLoaded++;needs=true;
      loaderBar.style.width=(nLoaded/N*100)+'%';if(nLoaded>=N)loader.classList.add('is-done');pump()};
    im.src=src(i);
  })(queue.shift())}
}
function nearest(i){if(loaded[i])return i;for(var d=1;d<N;d++){if(i-d>=0&&loaded[i-d])return i-d;if(i+d<N&&loaded[i+d])return i+d}return -1}
function size(){var dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(stage.clientWidth*dpr);canvas.height=Math.round(stage.clientHeight*dpr);needs=true}
function drawImg(im,alpha){
  var cw=canvas.width,ch=canvas.height,iw=im.naturalWidth,ih=im.naturalHeight,s,dx,dy;
  if(mobile.matches){ // Hochformat: Haus oben, Fokus auf das Gebäude rechts der Bildmitte
    var hh=ch*0.66; s=Math.max(cw/iw,hh/ih); dx=clamp(cw*0.5-iw*s*0.6,cw-iw*s,0); dy=0;
  }else{ s=Math.max(cw/iw,ch/ih); dx=(cw-iw*s)/2; dy=(ch-ih*s)*0.5; }
  ctx.globalAlpha=alpha;ctx.drawImage(im,dx,dy,iw*s,ih*s);ctx.globalAlpha=1;
}
function render(){
  var a=Math.floor(cur),b=Math.min(N-1,a+1),t=cur-a,ia=nearest(a),ib=nearest(b);
  if(ia<0)return;
  ctx.fillStyle='#0c0d10';ctx.fillRect(0,0,canvas.width,canvas.height);
  drawImg(imgs[ia],1);
  if(ib>=0&&ib!==ia&&t>0.01)drawImg(imgs[ib],t);
}
// Gerüstlagen passend zu den vier Clips: Aufbau unten, Aufbau oben, Standzeit, Abbau
function levelAt(fp){
  if(fp<0.03)return 0; if(fp<0.25)return (fp-0.03)/0.22*2; if(fp<0.5)return 2+(fp-0.25)/0.25*4;
  if(fp<0.77)return 6; if(fp<0.97)return 6-(fp-0.77)/0.2*6; return 0;
}
var lastFp=-1;
function onScroll(){
  var r=scrolly.getBoundingClientRect(),total=r.height-window.innerHeight,p=clamp(-r.top/total,0,1),fp=clamp(p/HOLD,0,1);
  target=fp*(N-1);
  if(fp!==lastFp){
    lastFp=fp;
    phases.forEach(function(s){s.el.classList.toggle('is-on',!s.hero&&fp>=s.a&&fp<s.b)});
    hero.classList.toggle('is-off',fp>0.035);
    cue.classList.toggle('is-off',fp>0.02);
  }
  nav.classList.toggle('is-solid',r.bottom<80);
}
function tick(){
  var d=target-cur;if(Math.abs(d)>0.002){cur+=d*(reduce?1:0.12);needs=true}else if(cur!==target){cur=target;needs=true}
  if(needs){needs=false;render();
    var fp=cur/(N-1),lv=levelAt(fp);meterNum.textContent=pad(Math.round(lv),2);
    if(mobile.matches){meterBar.style.width=(lv/6*100)+'%';meterBar.style.height=''}else{meterBar.style.height=(lv/6*100)+'%';meterBar.style.width=''}
    meterPct.textContent=pad(Math.round(fp*100),3)+' %';}
  requestAnimationFrame(tick);
}
size();pump();onScroll();tick();
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',function(){size();onScroll()});

/* ---------- Navigation ---------- */
var burger=$('#burger'), menu=$('#menu');
function closeMenu(){menu.classList.remove('is-open');burger.setAttribute('aria-expanded','false');burger.setAttribute('aria-label','Menü öffnen');document.body.style.overflow=''}
burger.addEventListener('click',function(){
  if(menu.classList.contains('is-open')){closeMenu();return}
  menu.classList.add('is-open');burger.setAttribute('aria-expanded','true');burger.setAttribute('aria-label','Menü schließen');document.body.style.overflow='hidden';
});
$$('a',menu).forEach(function(a){a.addEventListener('click',closeMenu)});

/* ---------- Text Wort für Wort einblenden ---------- */
$$('.split').forEach(function(el){
  var words=el.textContent.trim().split(/\s+/);el.textContent='';
  words.forEach(function(w,i){var o=document.createElement('span');o.className='w';var n=document.createElement('span');n.textContent=w;n.style.transitionDelay=(i*45)+'ms';o.appendChild(n);el.appendChild(o);el.appendChild(document.createTextNode(' '))});
});

if('IntersectionObserver' in window){
  var links={};$$('a',menu).forEach(function(a){links[a.getAttribute('href').slice(1)]=a});
  var so=new IntersectionObserver(function(es){es.forEach(function(e){var l=links[e.target.id];if(l)l.classList.toggle('is-active',e.isIntersecting)})},{rootMargin:'-45% 0px -50% 0px'});
  Object.keys(links).forEach(function(id){var el=document.getElementById(id);if(el)so.observe(el)});
  var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');ro.unobserve(e.target)}})},{rootMargin:'0px 0px -10% 0px'});
  $$('.reveal,.split,.reveal-clip').forEach(function(el){ro.observe(el)});
  var co=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){count(e.target);co.unobserve(e.target)}})},{threshold:.6});
  $$('[data-count]').forEach(function(el){co.observe(el)});
}else{$$('.reveal,.split,.reveal-clip').forEach(function(el){el.classList.add('is-in')})}

function count(el){
  var to=+el.dataset.count,from=to>1000?to-60:0,t0=null,dur=1400;
  if(reduce){el.textContent=to;return}
  function step(ts){if(!t0)t0=ts;var k=clamp((ts-t0)/dur,0,1);k=1-Math.pow(1-k,3);el.textContent=Math.round(from+(to-from)*k);if(k<1)requestAnimationFrame(step)}
  requestAnimationFrame(step);
}

/* ---------- Akkordeon ---------- */
$$('.acc').forEach(function(acc){
  $('.acc__btn',acc).addEventListener('click',function(){
    var open=acc.classList.contains('is-open');
    $$('.acc').forEach(function(a){a.classList.remove('is-open');$('.acc__btn',a).setAttribute('aria-expanded','false')});
    if(!open){acc.classList.add('is-open');this.setAttribute('aria-expanded','true')}
  });
});

/* ---------- Koordinaten-Raster (folgt der Maus) ---------- */
var strip=$('#coordStrip');
if(strip){
  var cImg=$('.coord__img',strip),cX=$('.coord__x',strip),cY=$('.coord__y',strip),cH=$('.coord__h',strip),cV=$('.coord__v',strip),bx=$('#cx'),by=$('#cy');
  var tx=99,ty=141,px=99,py=141,run=false;
  function place(){
    px+=(tx-px)*.12;py+=(ty-py)*.12;
    var off=parseFloat(getComputedStyle(strip).paddingLeft)||0, L=Math.max(24,px), T=Math.max(20,py);
    cImg.style.transform='translate('+(L)+'px,'+(T)+'px)';
    cH.style.transform='translateY('+(T+140)+'px)';cV.style.transform='translateX('+(L+110)+'px)';
    cX.style.transform='translate('+(L+124)+'px,'+(T+56)+'px)';cY.style.transform='translate('+(L+30)+'px,'+(T+152)+'px)';
    bx.textContent=Math.round(L);by.textContent=Math.round(T);
    if(Math.abs(tx-px)>.3||Math.abs(ty-py)>.3)requestAnimationFrame(place);else run=false;
  }
  function go(){if(!run){run=true;requestAnimationFrame(place)}}
  strip.addEventListener('mousemove',function(e){var r=strip.getBoundingClientRect();var maxX=(mobile.matches?r.width:r.width*0.64)-150;tx=clamp(e.clientX-r.left-55,24,maxX);ty=clamp(e.clientY-r.top-70,20,r.height-180);go()});
  // ohne Maus wandert das Bild langsam von selbst
  var auto=0;setInterval(function(){if(strip.matches(':hover'))return;auto+=1;var r=strip.getBoundingClientRect();var maxX=(mobile.matches?r.width:r.width*0.64)-150;tx=24+(Math.sin(auto*.7)*.5+.5)*(maxX-24);ty=20+(Math.cos(auto*.5)*.5+.5)*Math.max(10,r.height-200);go()},1600);
  place();
}

/* ---------- Leistungen: Bild folgt der Maus ---------- */
var fl=$('#svcFloat'),flImg=$('img',fl),flC=$('#svcCoord'),fx=0,fy=0,gx=0,gy=0,frun=false;
function fmove(){fx+=(gx-fx)*.16;fy+=(gy-fy)*.16;fl.style.transform='translate('+(fx+28)+'px,'+(fy-90)+'px)';flC.textContent='X '+pad(Math.round(gx),4)+' · Y '+pad(Math.round(gy),4);if(Math.abs(gx-fx)>.4||Math.abs(gy-fy)>.4)requestAnimationFrame(fmove);else frun=false}
$$('#svc li').forEach(function(li){
  li.addEventListener('mouseenter',function(){flImg.src=li.dataset.img;fl.classList.add('is-on')});
  li.addEventListener('mouseleave',function(){fl.classList.remove('is-on')});
  li.addEventListener('mousemove',function(e){gx=e.clientX;gy=e.clientY;if(!frun){frun=true;if(!fl.classList.contains('was')){fx=gx;fy=gy;fl.classList.add('was')}requestAnimationFrame(fmove)}});
});

/* ---------- Referenzen ---------- */
var refs=window.NEUMANN_REFS||[], tabs=$('#tabs'), grid=$('#grid'), cats=['Highlights'], lb=$('#lightbox');
var HI=['Olympiastadion','Bahnhof Ostkreuz','Zoofenster','Konzerthaus Berlin','Jüdisches Museum','Hamburger Bahnhof','Europacenter','Kirche St. Bonifatius'];
refs.forEach(function(r){if(cats.indexOf(r.k)<0)cats.push(r.k)});
function list(c){if(c!=='Highlights')return refs.filter(function(r){return r.k===c});return HI.map(function(t){return refs.filter(function(r){return r.t===t})[0]}).filter(Boolean)}
function show(c){
  $$('button',tabs).forEach(function(b){b.setAttribute('aria-selected',b.dataset.c===c?'true':'false')});
  grid.innerHTML='';
  list(c).forEach(function(r,i){
    var b=document.createElement('button');b.className='tile';b.type='button';b.style.animationDelay=(i*50)+'ms';
    var im=document.createElement('img');im.loading='lazy';im.src=r.f;im.alt=(r.t||r.k)+', eingerüstet von Neumann Gerüstbau';
    var s=document.createElement('span'),sm=document.createElement('small');sm.textContent=pad(i+1,2)+' · '+r.k;s.appendChild(sm);s.appendChild(document.createTextNode(r.t||'Referenzobjekt'));
    b.appendChild(im);b.appendChild(s);
    b.addEventListener('click',function(){$('img',lb).src=r.f;$('img',lb).alt=im.alt;$('figcaption',lb).textContent=(r.t||'Referenzobjekt')+' · '+r.k;lb.hidden=false});
    grid.appendChild(b);
  });
}
cats.forEach(function(c){
  var b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.dataset.c=c;b.textContent=c;
  var n=document.createElement('sup');n.textContent=list(c).length;b.appendChild(n);
  b.addEventListener('click',function(){show(c)});tabs.appendChild(b);
});
show('Highlights');
lb.addEventListener('click',function(e){if(e.target.tagName!=='IMG')lb.hidden=true});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){lb.hidden=true;closeMenu()}});

/* ---------- Anfrage per E-Mail ---------- */
var form=$('#form');
form.addEventListener('submit',function(e){
  e.preventDefault();var ok=true,d={};
  $$('input,select,textarea',form).forEach(function(f){d[f.name]=f.value.trim();var bad=f.required&&!d[f.name];f.classList.toggle('is-bad',bad);if(bad)ok=false});
  if(!ok){$('#formNote').textContent='Bitte Name und Telefonnummer ausfüllen.';return}
  var body='Guten Tag,\n\nich bitte um ein Angebot.\n\nLeistung: '+d.leistung+'\nName: '+d.name+(d.firma?'\nFirma: '+d.firma:'')+'\nTelefon: '+d.tel+'\n\n'+(d.msg||'')+'\n';
  window.location.href='mailto:info@geruestbau-neumann.de?subject='+encodeURIComponent('Anfrage '+d.leistung)+'&body='+encodeURIComponent(body);
  $('#formNote').textContent='Ihr E-Mail-Programm öffnet sich. Falls nicht, rufen Sie uns an: 030 925 14 43.';
});
var y=new Date().getFullYear();$('#year').textContent=y;$('#yearHero').textContent=y;
})();
