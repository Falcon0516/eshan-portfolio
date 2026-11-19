/* Scene definitions: html(), draw() for each scene canvas, flows. Demo maths is [demo] only. */
(function(){
var F=window.FACTS,TAU=6.2832;
function clamp(v,a,b){return v<a?a:v>b?b:v}
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var rnd=mul(7),NORM=[];for(var k=0;k<50;k++){NORM.push(Math.sqrt(-2*Math.log(rnd()+1e-6))*Math.cos(TAU*rnd()))}
var RECT=[[41,236,190,248],[426,193,213,291],[826,120,206,364],[1185,78,240,406],[1539,16,420,468]];
function spec(P){var a=[],i,x,v;for(i=0;i<61;i++){x=i/60;v=(.62-.5*P.dark)*(.55+.45*x)+.05*Math.sin(P.hue*6.28+i/8)-P.moist*.2*x-P.moist*.07*Math.exp(-Math.pow((i-55)/3,2));a.push(clamp(v,.03,.95))}return a}
function demo(P){var s=spec(P),nl=clamp((s[12]-.1)*2.2,0,1),pl=clamp((s[30]-.1)*2,0,1),kl=clamp((s[45]-.1)*1.8,0,1);
var sd=.06+Math.abs(P.w-F.mix.plsr)*.25;return{nl:nl,pl:pl,kl:kl,N:80+nl*240,P:10+pl*50,K:60+kl*240,pH:clamp(4.5+(1-P.moist)*2+P.hue*3,3.5,9),sd:sd,avg:(nl+pl+kl)/3}}
function plant(i,s,css){var r=RECT[i];return'<div class="pl" style="'+(css||'')+';width:'+r[2]*s+'px;height:'+r[3]*s+'px;background-size:'+2000*s+'px '+500*s+'px;background-position:-'+r[0]*s+'px -'+r[1]*s+'px"></div>'}
function plantSet(el,i,s){var r=RECT[i];el.style.width=r[2]*s+'px';el.style.height=r[3]*s+'px';el.style.backgroundSize=2000*s+'px '+500*s+'px';el.style.backgroundPosition='-'+r[0]*s+'px -'+r[1]*s+'px'}
function txt(i,cls){var s=F.scenes[i];return'<div class="txt '+(cls||'')+'"><h2>'+s.h+'</h2><p class="cap tt">'+s.c+'</p><p class="take">'+s.t+'</p></div>'}
function line(c,pts,from,to,dash){c.beginPath();c.setLineDash(dash||[]);for(var i=from;i<=to;i++){c[i==from?'moveTo':'lineTo'](pts[i][0],pts[i][1])}c.stroke();c.setLineDash([])}
function hist(c,w,h,p,P,band){var d=demo(P),m=.5+(P.w-F.mix.plsr)*.3,sd=d.sd,bins=17,cnt=new Array(bins).fill(0),r=Math.max(3,w/70),i,v,b,x,y,tk,fall;
c.clearRect(0,0,w,h);c.fillStyle='rgba(168,224,99,.18)';
if(band||p>.85){c.fillRect(w*clamp(m-1.96*sd*1.6,0,1),0,w*clamp(2*1.96*sd*1.6,0,1),h)}
c.strokeStyle='#FFD9A0';c.lineWidth=1;c.beginPath();c.moveTo(0,h-4);c.lineTo(w,h-4);c.stroke();
for(i=0;i<50;i++){tk=i/50*.8;if(p<tk)break;v=clamp(m+NORM[i]*sd*1.6,.02,.98);b=Math.min(bins-1,Math.floor(v*bins));cnt[b]++;x=(b+.5)/bins*w;y=h-6-cnt[b]*r*2.1;fall=Math.min(1,(p-tk)/.06);c.fillStyle=i%3?'#A8E063':'#5DBB63';c.beginPath();c.arc(x,y-(1-fall)*h*.4,r,0,TAU);c.fill()}
c.fillStyle='#FFF6E5';c.font='14px "Trebuchet MS",sans-serif';if(band||p>.85)c.fillText('95% band',w*clamp(m-1.96*sd*1.6,0,.8)+4,16)}
var S=[];
S[0]={dur:8000,html:function(){return txt(0)+'<div class="notehand" style="position:absolute;left:4vw;top:14vh;width:24vw;padding:2vh 1.4vw;background:#FFF6E5;color:#2B2118;font:clamp(24px,1.8vw,32px)/1.25 var(--hw);transform:rotate(-3deg);box-shadow:5px 5px 0 #7A5230;z-index:5">Lab tests are slow and costly.</div>'},
 flows:[new Flow({pts:[-.05,.5,.3,.4,.6,.62,1.05,.48],n:26,speed:.04,color:'#FFF6E5',size:2.5,wob:14}),new Flow({pts:[1.05,.3,.7,.5,.3,.3,-.05,.55],n:18,speed:.03,color:'#FFD9A0',size:2,wob:16})]};
S[1]={dur:9000,html:function(){return'<div id="dish" style="position:absolute;left:12vw;bottom:19vh;width:30vw;height:20vw;background:url(assets/soil_dish.png) center/contain no-repeat,radial-gradient(ellipse,#3B2A1E 40%,transparent 62%);z-index:2"><div id="tint" style="position:absolute;left:5%;top:22%;width:68%;height:48%;border-radius:50%;mix-blend-mode:multiply;opacity:.55"></div></div>'+
 '<div id="prism" class="obj pulse" tabindex="0" aria-label="Prism. Hold to block the light" style="position:absolute;left:38vw;bottom:23vh;width:22vw;height:16.5vw;background:url(assets/spectrum_prism.png) center/contain no-repeat,linear-gradient(135deg,transparent 35%,rgba(207,239,255,.5) 36% 64%,transparent 65%);z-index:3;cursor:grab"></div>'+
 '<canvas class="cv" id="cv2" style="left:56vw;top:12vh;width:40vw;height:40vh"></canvas><div class="sim" style="left:56vw;top:7vh">'+F.badge+'</div>'+txt(1,'r')},
 flows:[new Flow({pts:[.1,.62,.2,.56,.28,.54,.4,.58],n:22,speed:.25,color:'#FFF6E5',size:3,wob:2}),new Flow({pts:[.44,.58,.5,.5,.55,.5,.6,.4],n:10,speed:.18,color:'#ff6a4a',size:3,wob:5}),new Flow({pts:[.44,.6,.5,.56,.55,.56,.6,.48],n:10,speed:.2,color:'#5DBB63',size:3,wob:5}),new Flow({pts:[.44,.62,.5,.62,.55,.62,.6,.56],n:10,speed:.22,color:'#6ab0ff',size:3,wob:5})],
 draw:function(c,w,h,p,tm,P){var s=spec(P),n,i,pts=[],x0=w*.2,ww=w*.78,idx=[],lo=h*.1,hh=h*.8;c.clearRect(0,0,w,h);
 var tint=document.getElementById('tint');if(tint)tint.style.background='hsl('+(P.hue*360*.6+8)+',55%,'+(55-P.dark*35)+'%)';
 c.fillStyle='rgba(43,33,24,.78)';c.fillRect(0,0,w,h);
 var q=clamp(p/.15,0,1),cols=['#ff6a4a','#5DBB63','#6ab0ff'],vals=[s[22],s[12],s[4]];
 for(i=0;i<3;i++){c.fillStyle=cols[i];var bh=vals[i]*hh*q;c.fillRect(8+i*20,lo+hh-bh,16,bh)}
 n=p<.15?0:p<.5?Math.round(3+28*(p-.15)/.35):Math.round(31+30*clamp((p-.5)/.4,0,1));if(p>=.9)n=61;if(n<3)return;
 if(n<=3)idx=[0,15,30];else for(i=0;i<n;i++)idx.push(i);
 for(i=0;i<idx.length;i++)pts.push([x0+idx[i]/60*ww,lo+hh-s[idx[i]]*hh]);
 c.lineWidth=4;c.lineCap='round';c.strokeStyle='#A8E063';var split=0;for(i=0;i<idx.length;i++)if(idx[i]<=F.mix.estFrom)split=i;
 if(split>0)line(c,pts,0,split);c.strokeStyle='#FFD9A0';if(idx.length-1>split)line(c,pts.slice(split),0,pts.length-1-split,[9,9]);
 var tp=pts[pts.length-1];c.shadowColor='#FFF6E5';c.shadowBlur=18;c.fillStyle='#FFF6E5';c.beginPath();c.arc(tp[0],tp[1],7,0,TAU);c.fill();c.shadowBlur=0;
 c.fillStyle='#FFF6E5';c.font='14px "Trebuchet MS",sans-serif';c.fillText('400 nm',x0,h-4);c.fillText('700',x0+ww*.5-12,h-4);c.fillText('1000 nm',x0+ww-52,h-4);
 if(n>=45){c.fillStyle='#FFD9A0';c.font='20px "Bradley Hand","Segoe Script",cursive';c.fillText('estimated, not measured',x0+ww*.5+8,lo+14)}}};
S[2]={dur:9000,html:function(){return'<canvas class="cv" id="cv3" style="left:6vw;top:10vh;width:62vw;height:50vh"></canvas><div class="sim" style="left:6vw;top:6vh">'+F.simBadge+'</div>'+txt(2)},
 flows:[new Flow({pts:[.05,.3,.3,.7,.5,.7,.75,.62],n:30,speed:.07,color:'#A8E063',size:3,wob:8})],
 draw:function(c,w,h,p,tm,P){var s=spec(P),i,x,q,cx=w*.78,cy=h*.8;c.clearRect(0,0,w,h);c.fillStyle='rgba(43,33,24,.78)';c.fillRect(0,0,w,h);
 var sm=clamp(p/.3,0,1),top=h*.46;c.lineWidth=3;
 c.strokeStyle='rgba(255,217,160,'+(1-sm)+')';c.beginPath();for(i=0;i<61;i++){x=10+i/60*(w*.5);var y=top-s[i]*top*.8+Math.sin(i*2.3)*6*(1-sm)+Math.sin(i*5.1)*4*(1-sm);c[i?'lineTo':'moveTo'](x,y)}c.stroke();
 c.strokeStyle='rgba(168,224,99,'+sm+')';c.beginPath();for(i=0;i<61;i++){x=10+i/60*(w*.5);c[i?'lineTo':'moveTo'](x,top-s[i]*top*.8)}c.stroke();
 if(p>.3){var dq=clamp((p-.3)/.2,0,1);c.strokeStyle='#FFF6E5';c.lineWidth=2;for(i=2;i<59;i+=4){x=10+i/60*(w*.5);var yy=top-s[i]*top*.8,sl=(s[i+1]-s[i-1])*top*3;c.beginPath();c.moveTo(x-8*dq,yy+sl*.5*dq);c.lineTo(x+8*dq,yy-sl*.5*dq);c.stroke()}}
 c.font='700 64px Georgia,serif';c.fillStyle='#FFF6E5';var cnt=p<.5?188:Math.round(188-158*clamp((p-.5)/.45,0,1));c.fillText(String(cnt),w*.58,h*.3);c.font='14px "Trebuchet MS",sans-serif';c.fillText('features',w*.58+4,h*.3+20);
 q=clamp((p-.5)/.45,0,1);var cols=24,r2=mul(3);
 for(i=0;i<188;i++){var gx=10+(i%cols)*13,gy=h*.58+Math.floor(i/cols)*13,keep=i<30,tx=keep?cx-90+(i%15)*14:cx,ty=keep?cy-8+Math.floor(i/15)*14:cy-20;var qq=clamp(q*1.4-(i/188)*.4,0,1),e=qq*qq*(3-2*qq);
 var px=gx+(tx-gx)*e,py=gy+(ty-gy)*e+Math.sin(e*3.14)*-30*r2();c.globalAlpha=keep?1:1-clamp((e-.6)*2.5,0,1);c.fillStyle=keep?'#A8E063':'#FFD9A0';c.fillRect(px,py,keep?11:9,keep?11:9)}c.globalAlpha=1;
 if(q>0){c.strokeStyle='#FFD9A0';c.lineWidth=2;c.beginPath();c.moveTo(w*.5,h*.6);c.lineTo(cx-100,cy-30);c.moveTo(w*.5,h*.98);c.lineTo(cx-100,cy+14);c.stroke()}}};
S[3]={dur:10000,html:function(){return'<div class="mach" style="left:8vw;top:14vh">PLSR</div><div class="mach" style="left:8vw;top:30vh;animation-delay:-.7s">1D-CNN</div>'+
 '<div class="mach" id="mixr" style="left:30vw;top:22vh;background:#3B2A1E;font-size:26px">0.45 / 0.55</div>'+
 '<canvas class="cv" id="cv4" style="left:54vw;top:12vh;width:38vw;height:42vh;background:rgba(43,33,24,.78)"></canvas><div class="sim" style="left:54vw;top:7vh">'+F.simBadge+'</div>'+txt(3)},
 flows:[new Flow({pts:[.02,.18,.1,.2,.14,.2,.2,.22],n:14,speed:.2,color:'#A8E063',size:3,wob:3}),new Flow({pts:[.02,.34,.1,.34,.14,.36,.2,.36],n:14,speed:.2,color:'#FFD9A0',size:3,wob:3}),new Flow({pts:[.24,.24,.3,.26,.34,.27,.42,.27],n:14,speed:.22,color:'#FFF6E5',size:3,wob:3}),new Flow({pts:[.54,.27,.57,.28,.6,.3,.62,.34],n:8,speed:.3,color:'#5DBB63',size:3,wob:2})],
 draw:function(c,w,h,p,tm,P){hist(c,w,h,p,P,false)}};
S[4]={dur:9000,html:function(){var o='';for(var i=0;i<5;i++)o+=plant(i,.6,'left:'+(38+i*10.5)+'vw;bottom:22vh').replace('class="pl"','class="pl p5" data-i="'+i+'"');
 return o+'<div class="knob" style="left:38vw;top:14vh"><input class="obj pulse" id="phk" type="range" min="3.5" max="9" step=".1" value="6.5" aria-label="pH dial" style="width:100%"><div style="font:700 42px Georgia,serif;margin-top:4px" id="phv">pH 6.5</div></div>'+
 '<div style="position:absolute;left:38vw;top:28vh;width:26vw;z-index:5"><div class="lab">N</div><div class="bar" id="bN" style="height:12px;background:#5DBB63"></div><div class="lab">P</div><div class="bar" id="bP" style="height:12px;background:#A8E063"></div><div class="lab">K</div><div class="bar" id="bK" style="height:12px;background:#FFD9A0"></div></div><div class="sim" style="left:38vw;top:8vh">'+F.simBadge+'</div>'+txt(4)},
 flows:[new Flow({pts:[.4,.78,.4,.6,.45,.5,.45,.42],n:24,speed:.12,color:'#A8E063',size:3,wob:8})]};
S[5]={dur:7000,html:function(){return'<div style="position:absolute;left:38vw;top:12vh;z-index:6">'+['EN','HI','KN'].map(function(l,i){return'<button class="tab obj'+(i?'':' on')+'" data-l="'+l+'" aria-label="Language '+l+'">'+l+'</button>'}).join('')+'</div><div class="tw" id="tw" style="left:38vw;top:22vh"></div><div class="sim" style="left:38vw;top:8vh;display:none"></div>'+txt(5)}};
S[6]={dur:6000,html:function(){return'<div class="nb"><h2>REALITY</h2>'+'<div id="nbcols"></div><p class="hand">'+F.noteHand+'</p></div>'}};
window.SC=S;window.SCN={spec:spec,demo:demo,plant:plant,plantSet:plantSet,hist:hist,clamp:clamp,RECT:RECT};
})();
