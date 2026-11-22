/* Lebender Verkehr in der Startansicht: Autos und Menschen aus der Blender-Szene (Spuren, Startpositionen, Sonne),
   gezeichnet als Draufsicht-Bilder über dem gerenderten Stadtbild. Ampeln an jeder Kreuzung, Abstand halten, Schatten. */
(function(){
'use strict';
var D=null, A=null, cells={}, sil={}, lanes=[], people=[], ready=false, t0=0, last=0;
var CYCLE=26, GREEN_X=[0,11], GREEN_Y=[13,24];
function green(axis,t){var c=t%CYCLE, g=axis==='x'?GREEN_X:GREEN_Y;return c>=g[0]&&c<g[1]}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)/4294967296}
function makeSil(c){ // dunkle, weiche Silhouette für den Schatten
  var w=Math.ceil(c.w),h=Math.ceil(c.h),cv=document.createElement('canvas');cv.width=w+8;cv.height=h+8;var x=cv.getContext('2d');
  for(var k=0;k<5;k++){x.globalAlpha=0.22;x.drawImage(A.img,c.x,c.y,c.w,c.h,4+[0,1,-1,0,0][k],4+[0,0,0,1,-1][k],w,h)}
  x.globalAlpha=1;x.globalCompositeOperation='source-in';x.fillStyle='#000';x.fillRect(0,0,cv.width,cv.height);return cv;
}
function cross(a,b,c,d){ // Schnitt zweier Strecken (normiert), gibt Anteil auf a-b
  var r=[b[0]-a[0],b[1]-a[1]],s=[d[0]-c[0],d[1]-c[1]],den=r[0]*s[1]-r[1]*s[0];if(Math.abs(den)<1e-9)return null;
  var q=[c[0]-a[0],c[1]-a[1]],u=(q[0]*s[1]-q[1]*s[0])/den,v=(q[0]*r[1]-q[1]*r[0])/den;return(u>0&&u<1&&v>0&&v<1)?u:null;
}
function init(data,atlas,aj){
  D=data;A={img:atlas,ppm:aj.ppm};
  aj.cells.forEach(function(c){(cells[c.t]=cells[c.t]||[]).push(c);sil[c.t+c.c]=makeSil(c)});
  var byKey={};
  Object.keys(D.lanes).forEach(function(k){var L=D.lanes[k];var o={key:k,axis:k[0],a:L.a,b:L.b,len:L.len_m,cars:[],stops:[]};byKey[k]=o;lanes.push(o)});
  // Haltelinien: wo eine Spur die Spuren der anderen Richtung kreuzt, gebündelt je Kreuzung
  lanes.forEach(function(L){
    var hits=[];lanes.forEach(function(M){if(M.axis===L.axis)return;var u=cross(L.a,L.b,M.a,M.b);if(u!==null)hits.push(u*L.len)});
    hits.sort(function(p,q){return p-q});var g=[];
    hits.forEach(function(s){if(!g.length||s-g[g.length-1][1]>9)g.push([s,s]);else g[g.length-1][1]=s});
    L.stops=g.map(function(x){return x[0]-(L.axis==='y'&&x[1]-x[0]>8?6.5:4.5)});
  });
  D.cars.forEach(function(c,i){var L=byKey[c.l];if(!L)return;var list=cells[c.t]||cells.kompakt;var cell=list[Math.floor(hash(c.t+i)*list.length)];
    L.cars.push({s:c.s,v:c.v,v0:c.v,cell:cell,len:c.t==='bus'?12.5:5.2})});
  lanes.forEach(function(L){L.cars.sort(function(p,q){return p.s-q.s})});
  var pc=cells.mensch||[];
  D.walk.forEach(function(w,i){if(!pc.length)return;var Lx=w.b[0]-w.a[0],Ly=w.b[1]-w.a[1],l2=Lx*Lx+Ly*Ly;if(l2<1e-9)return;
    var vx=(w.p1[0]-w.p0[0])/D.T,vy=(w.p1[1]-w.p0[1])/D.T,u0=((w.p0[0]-w.a[0])*Lx+(w.p0[1]-w.a[1])*Ly)/l2;
    people.push({a:w.a,L:[Lx,Ly],u:u0,du:(vx*Lx+vy*Ly)/l2,off:[w.p0[0]-(w.a[0]+Lx*u0),w.p0[1]-(w.a[1]+Ly*u0)],cell:pc[i%pc.length],vx:vx,vy:vy})});
  ready=true;t0=performance.now()/1000;last=0;
}
function step(t){
  var dt=Math.min(0.1,Math.max(0,t-last));last=t;if(!dt)return;
  lanes.forEach(function(L){
    var n=L.cars.length;if(!n)return;var isG=green(L.axis,t),soon=green(L.axis,t+2.5);
    for(var i=0;i<n;i++){var c=L.cars[i],ahead=L.cars[(i+1)%n],gap=(ahead.s-c.s+L.len)%L.len-ahead.len*0.5-c.len*0.5;if(n===1)gap=1e9;
      if(!isG||!soon){for(var k=0;k<L.stops.length;k++){var d=L.stops[k]-c.s-c.len*0.5;if(d>-1&&d<40){gap=Math.min(gap,d+1.5);break}}}
      var target=c.v0*Math.max(0,Math.min(1,(gap-2.2)/(c.v0*1.6)));
      c.v+=Math.max(-7*dt,Math.min(2.6*dt,target-c.v));if(c.v<0)c.v=0;}
    for(i=0;i<n;i++){var cc=L.cars[i];cc.s+=cc.v*dt;if(cc.s>=L.len)cc.s-=L.len}
    L.cars.sort(function(p,q){return p.s-q.s});
  });
}
function draw(ctx,T,alpha){
  if(!ready||alpha<=0)return;
  var t=performance.now()/1000-t0;step(t);
  var W=T.w,H=T.h,ox=T.dx,oy=T.dy,cw=ctx.canvas.width,ch=ctx.canvas.height;
  var ppm=Math.hypot(D.ex[0]*W,D.ex[1]*H),k=ppm/A.ppm;
  var sh=[D.shadow_per_m[0]*W,D.shadow_per_m[1]*H];
  ctx.save();ctx.globalAlpha=alpha;
  function put(nx,ny,ang,cell,key,height){
    var x=ox+nx*W,y=oy+ny*H;if(x<-80||y<-80||x>cw+80||y>ch+80)return;
    var w=cell.w*k,h=cell.h*k,s=sil[key];
    if(s){ctx.save();ctx.globalAlpha=alpha*0.5;for(var j=1;j<=4;j++){var f=j/4*height;ctx.setTransform(1,0,0,1,x+sh[0]*f*0.9,y+sh[1]*f*0.9);ctx.rotate(ang);ctx.drawImage(s,-w/2-4*k,-h/2-4*k,w+8*k,h+8*k)}ctx.restore()}
    ctx.setTransform(1,0,0,1,x,y);ctx.rotate(ang);ctx.drawImage(A.img,cell.x,cell.y,cell.w,cell.h,-w/2,-h/2,w,h);
  }
  people.forEach(function(p){var u=((p.u+p.du*t)%1+1)%1;put(p.a[0]+p.L[0]*u+p.off[0],p.a[1]+p.L[1]*u+p.off[1],Math.atan2(p.vy*H,p.vx*W)+Math.PI/2,p.cell,'mensch'+p.cell.c,1.7)});
  lanes.forEach(function(L){var dx=(L.b[0]-L.a[0])*W,dy=(L.b[1]-L.a[1])*H,ang=Math.atan2(dy,dx)+Math.PI/2;
    L.cars.forEach(function(c){var u=c.s/L.len;put(L.a[0]+(L.b[0]-L.a[0])*u,L.a[1]+(L.b[1]-L.a[1])*u,ang,c.cell,c.cell.t+c.cell.c,c.cell.t==='bus'?3:1.5)})});
  ctx.restore();ctx.setTransform(1,0,0,1,0,0);
}
window.NeumannVerkehr={init:init,draw:draw,ready:function(){return ready}};
})();
