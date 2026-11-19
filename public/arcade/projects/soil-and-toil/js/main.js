(function(){
var F=window.FACTS,S=window.SC,N=window.SCN,$=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var cur=0,mode='present',t0=performance.now(),last=t0,W=innerWidth,H=innerHeight,dpr=Math.min(2,window.devicePixelRatio||1),muted=true,actx=null,idleT=0,P={sw:0,hue:.1,dark:.8,moist:.4,w:.45,ph:6.5,scanAt:-1,touched:false,passAt:-1,lang:'EN',tw:'',twAt:0};
try{muted=localStorage.getItem('arc_snd')!=='1'}catch(e){}
function saveSnd(on){try{localStorage.setItem('arc_snd',on?'1':'0')}catch(e){}}
function ensureAc(){if(!actx){try{actx=new(window.AudioContext||window.webkitAudioContext)()}catch(x){actx=null}}if(actx&&actx.state==='suspended'){try{actx.resume()}catch(x){}}}
if(!muted){['pointerdown','keydown'].forEach(function(ev){document.addEventListener(ev,function(){if(!muted)ensureAc()},{capture:true,once:true,passive:true})})}
window.addEventListener('pageshow',function(){try{muted=localStorage.getItem('arc_snd')!=='1'}catch(e){}});
var strip=$('#strip'),fx=$('#fx'),fc=fx.getContext('2d'),mit=$('#mitti'),mpos=[[56,20,40],[14,22,24],[90,24,18],[50,22,16],[90,24,20],[90,24,20],[88,62,16]];
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
if(/from=hub/.test(location.search))document.body.classList.add('hub');
var st=document.createElement('style');st.textContent='body.explore #cv2{width:24vw!important;left:50vw!important}body.explore .sim{max-width:24vw}';document.head.appendChild(st);
/* build scenes */
S.forEach(function(s,i){var d=document.createElement('section');d.className='sc';d.style.left=i*100+'vw';d.innerHTML=s.html();strip.appendChild(d);s.el=d;s.cv=d.querySelector('canvas.cv');
 var b=document.createElement('button');b.setAttribute('aria-label','Scene '+(i+1));b.onclick=function(){go(i)};$('#dots').appendChild(b)});
function realHTML(){var cls={REAL:'g',PARTIAL:'y','NOT BUILT':'r'};return'<div class="cols">'+Object.keys(F.real).map(function(k){return'<div class="col '+cls[k]+'"><h3>'+k+'</h3><ul>'+F.real[k].map(function(x){return'<li>'+x+'</li>'}).join('')+'</ul></div>'}).join('')+'</div>'}
$('#nbcols').innerHTML=realHTML();$('#ovR').innerHTML='<h2 style="margin-bottom:4vh">Reality check</h2>'+realHTML();
/* tooltips: wrap known terms inside .tt and .mach */
var terms=Object.keys(F.tips).sort(function(a,b){return b.length-a.length});
function tipify(root){$$(root+' .tt, '+root+' .mach, '+root+' .take').forEach(function(el){if(el.dataset.done)return;el.dataset.done=1;var h=el.innerHTML;terms.forEach(function(t){var re=new RegExp('(^|[^\\w>-])('+t.replace(/[+]/g,'\\+')+')(?![\\w<])','g');h=h.replace(re,function(m,a,b){return a+'<span class="tip" tabindex="0" data-tip="'+F.tips[t]+'">'+b+'</span>'})});el.innerHTML=h})}
tipify('#strip');
/* sprites in scene 4 titles etc are static; setup canvases */
function size(){W=innerWidth;H=innerHeight;fx.width=W*dpr;fx.height=H*dpr;fc.setTransform(dpr,0,0,dpr,0,0);$$('canvas.cv,#bench canvas').forEach(function(c){c.width=Math.max(2,c.clientWidth)*dpr;c.height=Math.max(2,c.clientHeight)*dpr;c.getContext('2d').setTransform(dpr,0,0,dpr,0,0)});cam()}
var BS=[1,1.5,1.5,1.6,1.4,1.2,1.9],BY=[0,-.1,-.1,-.12,-.05,0,-.15],BK=[.06,.14,.26];
function cam(){strip.style.transform='translate3d('+(-cur*W)+'px,0,0)';$$('.bg').forEach(function(b,k){b.style.transform='translate('+(-cur*W*BK[k])+'px,'+(BY[cur]*H*(k+1)*.6)+'px) scale('+(BS[cur]*(1+k*.04))+')'});$('#table').style.backgroundPosition=(-cur*W*.5)+'px 0,'+(-cur*W*.5)+'px 0,0 0';
 var m=mpos[cur];mit.style.setProperty('--x',m[0]+'vw');mit.style.setProperty('--y',m[1]+'vh');mit.style.setProperty('--s',m[2]+'vh');$$('#dots button').forEach(function(b,i){b.className=i==cur?'on':''})}
function react(l,say){var el=mit;el.classList.remove('sad','happy','bounce');void el.offsetWidth;el.classList.add('bounce');if(l<.35)el.classList.add('sad');else if(l>.6)el.classList.add('happy');
 var b=$('#mbub');b.textContent=say||(l<.35?'Low nitrogen':l>.6?'Balanced':'Hmm');el.classList.add('say');clearTimeout(react.t);react.t=setTimeout(function(){el.classList.remove('say','bounce')},1600);pluck(l>.6?660:l<.35?220:440)}
function pluck(f){if(muted)return;ensureAc();if(!actx)return;var o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.12,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+.5);o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+.5)}
function go(i){i=Math.max(0,Math.min(S.length-1,i));var changed=i!=cur;cur=i;if(mode=='explore')cur=1;enter(changed);history.replaceState(null,'','#scene-'+(cur+1));cam()}
function enter(){t0=performance.now();if(cur==5)typeIt();if(cur==4){P.touched=false}if(cur==0||cur==6)react(cur==0?.8:.5,cur==0?'Hello!':'Honest!')}
/* typewriter */
function typeIt(){P.tw=F.advice[P.lang];P.twAt=performance.now();var tw=$('#tw');tw.textContent=''}
$$('.tab').forEach(function(b){b.onclick=function(){P.lang=b.dataset.l;$$('.tab').forEach(function(x){x.className='tab obj'+(x==b?' on':'')});typeIt();react(.7,'Same advice')}});
function twStep(now){var tw=$('#tw');if(!tw||!P.tw)return;var ch=Array.from(P.tw),n=Math.min(ch.length,Math.floor((now-P.twAt)/45));var s=ch.slice(0,n).join('');if(tw.textContent!==s)tw.textContent=s}
/* pH scene */
function phUpdate(v){var a=Math.exp(-Math.pow((v-6.5)/1.3,2));$('#phv').textContent='pH '+v.toFixed(1);$$('.p5').forEach(function(el){var i=+el.dataset.i,k=N.clamp(Math.round(a*4+(i-2)*.35),0,4);N.plantSet(el,k,.6);el.style.filter='saturate('+(.4+a*.9)+') hue-rotate('+((1-a)*-25)+'deg)'});
 $('#bN').style.width=(a*100)+'%';$('#bP').style.width=(Math.exp(-Math.pow((v-6.8)/1.1,2))*100)+'%';$('#bK').style.width=(Math.exp(-Math.pow((v-6.8)/1.6,2))*100)+'%';return a}
$('#phk').oninput=function(){P.touched=true;P.ph=+this.value;react(phUpdate(P.ph))};
/* prism hold: disturbs light flow */
var pr=$('#prism');function hold(on){S[1].flows[0].block=on?.38:2;if(on)react(.2,'Light blocked')}
pr.addEventListener('pointerdown',function(){hold(true);pr.classList.remove('pulse')});['pointerup','pointerleave','pointercancel'].forEach(function(e){pr.addEventListener(e,function(){hold(false)})});
/* explore bench */
var B=$('#bench');
B.innerHTML='<h4>Soil scanner</h4><div class="row" id="sws">'+F.swatches.map(function(s,i){return'<button class="sw obj" data-i="'+i+'" aria-label="'+s.n+'" style="background:hsl('+(s.hue*360*.6+8)+',55%,'+(55-s.dark*35)+'%)"></button>'}).join('')+'</div>'+
 ['hue','dark','moist'].map(function(k){return'<label>'+({hue:'Colour',dark:'Darkness',moist:'Moisture'})[k]+'<input type="range" min="0" max="1" step=".01" data-k="'+k+'" value="'+P[k]+'" aria-label="'+k+'"></label>'}).join('')+
 '<div class="row"><button class="go obj" id="scan">SCAN</button></div><div class="out" id="out">'+F.badge+'</div><div id="rp" style="height:70px;position:relative"></div>'+
 '<h4>Ensemble mixer</h4><label>PLSR weight<input type="range" min="0" max="1" step=".01" id="mw" value=".45" aria-label="PLSR weight"></label><div class="out" id="mo">PLSR 0.45 · CNN 0.55</div><div class="row"><button class="go obj" id="run">RUN 50 PASSES</button></div><canvas id="bh"></canvas>'+
 '<h4>pH dial</h4><label>pH<input type="range" min="3.5" max="9" step=".1" id="bp" value="6.5" aria-label="pH"></label><div class="out" id="bo">pH 6.5</div><div class="bar" id="bb" style="width:100%"></div><div class="lab">'+F.simBadge+'</div>';
function setP(k,v){P[k]=v;P.scanAt=-1;react(N.demo(P).nl)}
$$('#bench [data-k]').forEach(function(i){i.oninput=function(){setP(i.dataset.k,+i.value)}});
$$('#sws .sw').forEach(function(b){b.onclick=function(){var s=F.swatches[b.dataset.i];P.hue=s.hue;P.dark=s.dark;P.moist=s.moist;$$('#bench [data-k]').forEach(function(i){i.value=P[i.dataset.k]});$$('#sws .sw').forEach(function(x){x.classList.toggle('on',x==b)});P.scanAt=-1;react(N.demo(P).nl)}});
$('#scan').onclick=function(){P.scanAt=performance.now();t0=P.scanAt;pluck(520)};
$('#mw').oninput=function(){P.w=+this.value;$('#mo').textContent='PLSR '+P.w.toFixed(2)+' · CNN '+(1-P.w).toFixed(2);$('#mixr').textContent=P.w.toFixed(2)+' / '+(1-P.w).toFixed(2);P.passAt=-1;react(.5,'Mix changed')};
$('#run').onclick=function(){P.passAt=performance.now();react(.7,'50 passes')};
$('#bp').oninput=function(){P.ph=+this.value;var a=Math.exp(-Math.pow((P.ph-6.5)/1.3,2));$('#bo').textContent='pH '+P.ph.toFixed(1);$('#bb').style.width=(a*100)+'%';react(a)};
function setMode(m){mode=m;document.body.classList.toggle('explore',m=='explore');$('#modeBtn').textContent=m=='explore'?'PRESENT · P':'EXPLORE · P';if(m=='explore'){cur=1;P.scanAt=-1}cam();size();enter()}
$('#modeBtn').onclick=function(){setMode(mode=='present'?'explore':'present')};
/* overlays */
function ov(id){var e=$(id),on=!e.classList.contains('on');$$('.ov').forEach(function(x){x.classList.remove('on')});if(on)e.classList.add('on')}
function anyOv(){return $$('.ov.on').length>0}
$('#ovT').onclick=$('#ovR').onclick=function(){$$('.ov').forEach(function(x){x.classList.remove('on')})};
document.addEventListener('keydown',function(e){var k=e.key;if(e.target.tagName=='INPUT'&&(k==' '||k=='ArrowLeft'||k=='ArrowRight'))return;
 if(k=='ArrowRight'||k==' '||k=='PageDown'){e.preventDefault();go(cur+1)}else if(k=='ArrowLeft'||k=='PageUp'){e.preventDefault();go(cur-1)}
 else if(k=='Enter'&&e.target.tagName!='BUTTON'){enter()}else if(k=='p'||k=='P')setMode(mode=='present'?'explore':'present');
 else if(k=='r'||k=='R'){$('#ovT').classList.remove('on');ov('#ovR')}else if(k=='t'||k=='T'){$('#ovT').innerHTML='<p>'+F.scenes[cur].note+'</p>';$('#ovR').classList.remove('on');ov('#ovT')}
 else if(k=='m'||k=='M'){muted=!muted;saveSnd(!muted);if(!muted){ensureAc();pluck(523)}window.dispatchEvent(new CustomEvent('arcade:sound-sync',{detail:{on:!muted}}))}
 else if(k=='f'||k=='F'){if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen()}
 else if(k=='Escape'){if(anyOv())$$('.ov').forEach(function(x){x.classList.remove('on')});else location.href=$('#arcade').href}});
$('#stage').addEventListener('click',function(e){if(mode!='present'||anyOv())return;if(e.target.closest('button,input,a,.obj,.tip,.tab'))return;if(e.clientX>W*.7)go(cur+1)});
var tx=0;addEventListener('touchstart',function(e){tx=e.touches[0].clientX},{passive:true});addEventListener('touchend',function(e){var d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>60&&mode=='present')go(cur+(d<0?1:-1))},{passive:true});
mit.onclick=function(){react(.5,'Hi!')};
function wake(){document.body.classList.remove('idle');clearTimeout(idleT);idleT=setTimeout(function(){document.body.classList.add('idle')},3000)}addEventListener('mousemove',wake);wake();
addEventListener('resize',size);addEventListener('hashchange',function(){var m=/scene-(\d)/.exec(location.hash);if(m)go(+m[1]-1)});
/* loop */
function loop(now){var dt=Math.min(.05,(now-last)/1000);last=now;if(!document.hidden){var s=S[cur],p=Math.min(1,(now-t0)/s.dur),tm=now/1000;
 if(mode=='explore'){p=P.scanAt<0?1:Math.min(1,(now-P.scanAt)/5000)}
 if(cur==4&&!P.touched){P.ph=6.5-2.4*Math.sin(p*6.283);$('#phk').value=P.ph;phUpdate(P.ph)}
 if(cur==5)twStep(now);
 if(s.cv&&s.draw){var c=s.cv.getContext('2d');s.draw(c,s.cv.clientWidth,s.cv.clientHeight,p,tm,P)}
 var bh=$('#bh');if(mode=='explore'&&bh){var pp=P.passAt<0?.95:Math.min(1,(now-P.passAt)/3000);N.hist(bh.getContext('2d'),bh.clientWidth,bh.clientHeight,pp,P,pp>=.85)}
 if(mode=='explore'&&P.scanAt>=0){var d=N.demo(P),q=N.clamp((now-P.scanAt-3500)/1200,0,1),sd=(d.sd*100*1.96*q).toFixed(0);
  $('#out').innerHTML=F.badge+'<br>'+(q>0?'N '+(d.N*q).toFixed(0)+' P '+(d.P*q).toFixed(0)+' K '+(d.K*q).toFixed(0)+' pH '+(d.pH).toFixed(1)+'<br>95% band: ± '+sd+'% (demo)':'scanning...');
  if(q>=1&&!P.shown){P.shown=1;var rp=$('#rp');rp.innerHTML=N.plant(N.clamp(Math.round(d.avg*4),0,4),.22,'position:relative;display:inline-block');react(d.nl)}if(q<1)P.shown=0}
 fc.clearRect(0,0,W,H);var fl=s.flows;if(fl){var sp=S[1].flows;if(cur==1&&mode=='present'){}fl.forEach(function(f){f.vis=rm?.4:1;f.draw(fc,W,H,dt,tm)})}}
 requestAnimationFrame(loop)}
var m0=/scene-(\d)/.exec(location.hash);if(m0)cur=Math.max(0,Math.min(S.length-1,+m0[1]-1));
size();phUpdate(6.5);enter();requestAnimationFrame(loop);
})();
