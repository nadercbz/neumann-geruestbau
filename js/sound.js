// Geräusche zum Gerüstaufbau: Web Audio, startet erst nach Klick auf den Ton-Schalter (Browser-Regel)
(function(){
'use strict';
var btn=document.getElementById('snd'); if(!btn)return;
var ctx=null, buf={}, master=null, amb=null, ambGain=null, on=false, last=-1, lastPhase='', lastPlay=0;
var FILES=['rohr','rahmen','kupplung','belag','gelaender','abbau','banner','strasse'];
// Ablauf je Gerüstlage aus der Blender-Animation: Lage alle 15 Bilder, Start bei Bild 6
var LF=15, T0=6;
function load(){
  return Promise.all(FILES.map(function(n){return fetch('assets/sfx/'+n+'.mp3').then(function(r){return r.arrayBuffer()}).then(function(a){return new Promise(function(res){ctx.decodeAudioData(a,function(b){buf[n]=b;res()},function(){res()})})})}));
}
function play(name,vol,pan,rate){
  var b=buf[name]; if(!b||!on)return;
  var s=ctx.createBufferSource(); s.buffer=b; s.playbackRate.value=rate||(0.92+Math.random()*0.16);
  var g=ctx.createGain(); g.gain.value=vol;
  var p=ctx.createStereoPanner?ctx.createStereoPanner():null;
  s.connect(g); if(p){p.pan.value=Math.max(-1,Math.min(1,pan||0));g.connect(p);p.connect(master)}else g.connect(master);
  s.start();
}
function eventFor(i,rev){ // welches Bauteil wird bei diesem Bild eingesetzt?
  if(i>=118)return rev?['banner',0.5]:['banner',0.55];
  if(i<T0)return['rahmen',0.35];
  var k=(i-T0)%LF;
  if(rev)return k<5?['abbau',0.7]:k<10?['rohr',0.45]:['belag',0.4];
  if(k<4)return[k%2?'rohr':'rahmen',0.55];
  if(k<7)return['belag',0.5];
  if(k<10)return[k%2?'kupplung':'gelaender',0.45];
  return['rohr',0.3];
}
window.NeumannSound={update:function(phase,i){
  if(!on||phase!=='b'&&phase!=='d'){last=-1;lastPhase=phase;return}
  i=Math.round(i);
  if(phase!==lastPhase||last<0){last=i;lastPhase=phase;return}
  if(i===last)return;
  var now=performance.now(), steps=Math.abs(i-last);
  if(now-lastPlay>65){
    var rev=(phase==='d'), e=eventFor(i,rev), k=(i-T0)%LF;
    var pan=-0.7+((k<0?0:k)/LF)*1.4;
    play(e[0],e[1]*(steps>4?1.15:1),pan);
    if(steps>3&&Math.random()<0.5)setTimeout(function(){play(rev?'rohr':'kupplung',0.3,-pan)},90);
    lastPlay=now;
  }
  last=i;
},visible:function(v){if(ambGain&&ctx)ambGain.gain.setTargetAtTime(on&&v?0.22:0.0,ctx.currentTime,0.6)}};
function startAmb(){
  if(!buf.strasse||amb)return;
  amb=ctx.createBufferSource(); amb.buffer=buf.strasse; amb.loop=true; ambGain=ctx.createGain(); ambGain.gain.value=0;
  amb.connect(ambGain); ambGain.connect(master); amb.start(); ambGain.gain.setTargetAtTime(0.22,ctx.currentTime,0.8);
}
btn.addEventListener('click',function(){
  if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0.9;master.connect(ctx.destination);
    btn.classList.add('is-loading');load().then(function(){btn.classList.remove('is-loading');startAmb()})}
  on=!on; if(ctx.state==='suspended')ctx.resume();
  btn.classList.toggle('is-on',on); btn.setAttribute('aria-pressed',on?'true':'false');
  btn.querySelector('span').textContent=on?'Ton an':'Ton aus';
  if(ambGain)ambGain.gain.setTargetAtTime(on?0.22:0,ctx.currentTime,0.4);
  if(on)play('rohr',0.4,0);
});
})();
