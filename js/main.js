(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};

/* ---------- Scroll Sequenz ---------- */
var F=window.NEUMANN_FRAMES, N=F.count, scrolly=$('#scrolly'), stage=$('.stage'), canvas=$('#seq'), ctx=canvas.getContext('2d');
var mobile=window.matchMedia('(max-width:860px)'), dir=mobile.matches?'m':'d';
var imgs=new Array(N), loaded=new Array(N), nLoaded=0, cur=0, target=0, needs=true;
var HOLD=0.93; // auf den letzten 7 % des Scrollwegs bleibt das Schlussbild stehen
var steps=$$('.step').map(function(el){return{el:el,a:+el.dataset.from,b:+el.dataset.to,right:el.classList.contains('step--right'),end:el.classList.contains('step--end')}});
var hudNum=$('#hudNum'), hudBar=$('#hudBar'), hudPhase=$('#hudPhase'), hint=$('#scrollhint'), loader=$('#loader'), loaderBar=$('#loader i'), nav=$('#nav');

function src(i){var n=('00'+(i+1)).slice(-3);return 'assets/frames/'+dir+'/f_'+n+'.webp'}
function order(){ // erst grob, dann immer feiner laden
  var seen={},out=[],st=[16,8,4,2,1];
  st.forEach(function(s){for(var i=0;i<N;i+=s){if(!seen[i]){seen[i]=1;out.push(i)}}});
  return out;
}
var queue=order(), active=0;
function pump(){
  while(active<6&&queue.length){(function(i){
    active++;var im=new Image();im.decoding='async';
    im.onload=im.onerror=function(){active--;if(im.naturalWidth){imgs[i]=im;loaded[i]=true}nLoaded++;needs=true;
      loaderBar.style.width=(nLoaded/N*100)+'%';if(nLoaded>=N)loader.classList.add('is-done');pump()};
    im.src=src(i);
  })(queue.shift())}
}
function nearest(i){ if(loaded[i])return i; for(var d=1;d<N;d++){ if(i-d>=0&&loaded[i-d])return i-d; if(i+d<N&&loaded[i+d])return i+d } return -1 }
function size(){
  var dpr=Math.min(window.devicePixelRatio||1,2), w=stage.clientWidth, h=stage.clientHeight;
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);needs=true;
}
function drawImg(im,alpha){
  var cw=canvas.width,ch=canvas.height,iw=im.naturalWidth,ih=im.naturalHeight,s,dx,dy;
  if(mobile.matches){ // Hochformat: Haus oben, Text unten
    var hh=ch*0.6; s=Math.max(cw/iw,hh/ih); dx=(cw-iw*s)/2; dy=0;
  }else{ s=Math.max(cw/iw,ch/ih); dx=(cw-iw*s)/2; dy=(ch-ih*s)*0.5; }
  ctx.globalAlpha=alpha;ctx.drawImage(im,dx,dy,iw*s,ih*s);ctx.globalAlpha=1;
}
function render(){
  var a=Math.floor(cur), b=Math.min(N-1,a+1), t=cur-a, ia=nearest(a), ib=nearest(b);
  if(ia<0)return;
  ctx.fillStyle='#0a0e1c';ctx.fillRect(0,0,canvas.width,canvas.height);
  drawImg(imgs[ia],1);
  if(ib>=0&&ib!==ia&&t>0.01)drawImg(imgs[ib],t); // weiche Ueberblendung zwischen zwei Bildern
}
function levelAt(fp){ // Geruestebene passend zur Sequenz
  if(fp<0.0625)return 0; if(fp<0.33)return (fp-0.0625)/(0.33-0.0625)*5;
  if(fp<0.72)return 5; if(fp<0.94)return 5-(fp-0.72)/(0.94-0.72)*5; return 0;
}
function phaseAt(fp){return fp<0.0625?'Bestand':fp<0.34?'Aufbau':fp<0.72?'Standzeit':fp<0.94?'Abbau':'Fertig'}
var lastP=-1;
function onScroll(){
  var r=scrolly.getBoundingClientRect(), total=r.height-window.innerHeight, p=clamp(-r.top/total,0,1);
  target=clamp(p/HOLD,0,1)*(N-1);
  if(p!==lastP){
    lastP=p;var right=false,end=false;
    steps.forEach(function(s){var on=p>=s.a&&p<s.b;s.el.classList.toggle('is-on',on);if(on){right=s.right;end=s.end}});
    stage.classList.toggle('is-right',right);stage.classList.toggle('is-end',end);
    hint.classList.toggle('is-off',p>0.02);
  }
  nav.classList.toggle('is-solid',r.bottom<80);
}
function tick(){
  var d=target-cur; if(Math.abs(d)>0.002){cur+=d*0.14;needs=true}else if(cur!==target){cur=target;needs=true}
  if(needs){needs=false;render();
    var fp=cur/(N-1),lv=levelAt(fp);hudNum.textContent='0'+Math.round(lv);hudBar.style.height=(lv/5*100)+'%';hudPhase.textContent=phaseAt(fp);}
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
var links={};$$('a',menu).forEach(function(a){links[a.getAttribute('href').slice(1)]=a});
if('IntersectionObserver' in window){
  var so=new IntersectionObserver(function(es){es.forEach(function(e){var l=links[e.target.id];if(l)l.classList.toggle('is-active',e.isIntersecting)})},{rootMargin:'-45% 0px -50% 0px'});
  Object.keys(links).forEach(function(id){var el=document.getElementById(id);if(el)so.observe(el)});
  var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');ro.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  $$('.reveal').forEach(function(el,i){el.style.transitionDelay=(i%3*90)+'ms';ro.observe(el)});
}else{$$('.reveal').forEach(function(el){el.classList.add('is-in')})}

/* ---------- Referenzen ---------- */
var refs=window.NEUMANN_REFS||[], tabs=$('#tabs'), grid=$('#grid'), cats=['Highlights'], lb=$('#lightbox');
var HI=['Olympiastadion','Bahnhof Ostkreuz','Zoofenster','Konzerthaus Berlin','Jüdisches Museum','Hamburger Bahnhof','Europacenter','Kirche St. Bonifatius'];
refs.forEach(function(r){if(cats.indexOf(r.k)<0)cats.push(r.k)});
function list(c){
  if(c!=='Highlights')return refs.filter(function(r){return r.k===c});
  return HI.map(function(t){return refs.filter(function(r){return r.t===t})[0]}).filter(Boolean);
}
function show(c){
  $$('button',tabs).forEach(function(b){b.setAttribute('aria-selected',b.dataset.c===c?'true':'false')});
  grid.innerHTML='';
  list(c).forEach(function(r,i){
    var b=document.createElement('button');b.className='tile';b.type='button';b.style.animationDelay=(i*35)+'ms';
    var im=document.createElement('img');im.loading='lazy';im.src=r.f;im.alt=(r.t||r.k)+', eingerüstet von Neumann Gerüstbau';
    var s=document.createElement('span'),sm=document.createElement('small');sm.textContent=r.k;s.appendChild(sm);s.appendChild(document.createTextNode(r.t||'Referenzobjekt'));
    b.appendChild(im);b.appendChild(s);
    b.addEventListener('click',function(){$('img',lb).src=r.f;$('img',lb).alt=im.alt;$('figcaption',lb).textContent=(r.t||'Referenzobjekt')+' · '+r.k;lb.hidden=false});
    grid.appendChild(b);
  });
}
cats.forEach(function(c){
  var b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.dataset.c=c;
  b.textContent=c;var n=document.createElement('sup');n.textContent=list(c).length;b.appendChild(n);
  b.addEventListener('click',function(){show(c)});tabs.appendChild(b);
});
show('Highlights');
lb.addEventListener('click',function(e){if(e.target.tagName!=='IMG')lb.hidden=true});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){lb.hidden=true;closeMenu()}});

/* ---------- Parallax Bild ---------- */
var feat=$('.feature img');
if(feat&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches){
  window.addEventListener('scroll',function(){var r=feat.parentNode.getBoundingClientRect();if(r.bottom<0||r.top>window.innerHeight)return;
    var k=(r.top+r.height/2-window.innerHeight/2)/window.innerHeight;feat.style.transform='translateY('+(k*-7)+'%)'},{passive:true});
}

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
$('#year').textContent=new Date().getFullYear();
})();
