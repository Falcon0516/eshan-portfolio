(function(){var F=window.FACTS,Fl=window.Flow,$=function(i){return document.getElementById(i)},cur=0,mode="present",zoom=[1,1.35,1.7,2,2.35,2.7,1.2,1],reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
var cv=$("cv"),g=cv.getContext("2d"),last=0,idleT,tipEl=$("tip"),beatT;
if(/from=hub/.test(location.search))document.body.classList.add("hub");
Fl.load();var im=new Image();im.onerror=function(){};im.src="assets/hologram_ring.png";im.onload=function(){};
// tooltips: wrap known terms
function tipify(s){var out=s.replace(/&/g,"&amp;").replace(/</g,"&lt;"),keys=Object.keys(F.terms).sort(function(a,b){return b.length-a.length}).map(function(k){return k.replace(/[.*+?^${}()|[\]\\']/g,"\\$&")}),re=new RegExp("(^|[^\\w-])("+keys.join("|")+")(?![\\w])","gi"),map={};Object.keys(F.terms).forEach(function(k){map[k.toLowerCase()]=k});return out.replace(re,function(m,a,b){return a+'<span data-tip="'+map[b.toLowerCase()].replace(/"/g,"&quot;")+'" tabindex="0">'+b+"</span>"})}
document.addEventListener("mouseover",show);document.addEventListener("focusin",show);
function show(e){var t=e.target.closest&&e.target.closest("[data-tip]");if(!t){tipEl.style.display="none";return}tipEl.textContent=F.terms[t.dataset.tip];tipEl.style.display="block";var r=t.getBoundingClientRect();tipEl.style.left=Math.min(r.left,innerWidth-320)+"px";tipEl.style.top=(r.top-tipEl.offsetHeight-8<0?r.bottom+8:r.top-tipEl.offsetHeight-8)+"px"}
// scramble readout
function scramble(txt){clearInterval(beatT);var n=0,el=$("rd");beatT=setInterval(function(){n++;var s="";for(var i=0;i<txt.length;i++)s+=(n>i*2+6||txt[i]===" ")?txt[i]:"0123456789ABCDEF"[Math.random()*16|0];el.textContent=s;if(n>txt.length*2+8)clearInterval(beatT)},60)}
function go(i,replay){i=Math.max(0,Math.min(F.scenes.length-1,i));if(i===cur&&!replay&&$("h").textContent)return;cur=i;var s=F.scenes[i];
 $("n").textContent=("0"+(i+1)).slice(-2)+" / 0"+F.scenes.length;$("h").textContent=s.h;$("c").innerHTML=tipify(s.c);$("t").innerHTML=tipify(s.t);$("notes").innerHTML=tipify(s.n);
 $("stage").style.transform="scale("+(reduce?1:zoom[i])+")";
 [].forEach.call($("dots").children,function(d,k){d.classList.toggle("on",k===i)});
 history.replaceState(null,"","#scene-"+(i+1));scramble(s.rd);
 Fl.bots.length=0;setTimeout(function(){var d=s.gate/12.5;Fl.send(s.bot,d,s.ok,function(){if(cur===i&&mode==="present"&&!replay)setTimeout(function(){if(cur===i)go(i,true)},1500)})},700);
 if(i===7)setTimeout(function(){over(true)},1600)}
// dots
F.scenes.forEach(function(s,k){var b=document.createElement("button");b.setAttribute("aria-label","Scene "+(k+1)+": "+s.h);b.innerHTML="<i></i>";b.onclick=function(e){e.stopPropagation();go(k)};$("dots").appendChild(b)});
// ledger ribbon (local simulation)
var L=$("ledger"),hgt=1000;function hx(n){var s="";while(n--)s+="0123456789abcdef"[Math.random()*16|0];return s}
function blk(){var sp=document.createElement("span");sp.innerHTML="<b>#"+(++hgt)+"</b> "+hx(10)+" local simulation";L.appendChild(sp);if(L.children.length>14)L.removeChild(L.children[0])}
for(var i=0;i<8;i++)blk();setInterval(blk,2200);
// reality overlay
function fill(id,a){$(id).innerHTML=a.map(function(x){return"<li>"+tipify(x)+"</li>"}).join("")}
fill("lr",F.real);fill("lp",F.partial);
$("plates").innerHTML=F.ids.map(function(p){return"<span>"+p[0]+" "+p[1]+"</span>"}).join("")+"<span>Algorand Testnet</span>";
function over(on){$("over").classList.toggle("on",on===undefined?!$("over").classList.contains("on"):on)}
// explore: gauntlet
var gb=$("gates");F.gates.forEach(function(n,k){var d=document.createElement("div");d.className="g";d.id="g"+k;d.textContent=(k+1)+" "+n;gb.appendChild(d)});
$("limv").textContent=$("lim").value;$("lim").oninput=function(){$("limv").textContent=this.value};
F.attacks.forEach(function(a,k){var b=document.createElement("button");b.textContent=a.n;b.onclick=function(){run(a)};$("presets").appendChild(b)});
var runT=[];function run(a){runT.forEach(clearTimeout);runT=[];$("res").textContent="";[].forEach.call(gb.children,function(x){x.className="g"});
 var stop=a.burst?($("lim").value<=10?6:-1):a.at-0;var blocked=a.burst?(stop>=0):a.at>0;var at=a.burst?6:a.at;
 for(var k=0;k<11;k++)(function(k){runT.push(setTimeout(function(){var bad=blocked&&k===at;if(blocked&&k>at)return;gb.children[k].className="g "+(bad?"no":"ok");
  if(k===10||bad){var r=a.burst&&blocked?"Burst limit stopped it.":a.r;$("res").innerHTML=(bad?"BLOCKED at gate "+(k+1):"PASSED")+"<small>"+r+"</small>"}},k*320))})(k)}
// mode
function setMode(m){mode=m;$("explore").classList.toggle("on",m==="explore");$("bP").textContent=m==="explore"?"P PRESENT":"P EXPLORE";$("copy").style.display=$("bouncer").style.display=m==="explore"?"none":""}
// audio
var ac,muted=true;function beep(f){if(muted||!ac)return;var o=ac.createOscillator(),v=ac.createGain();o.frequency.value=f;v.gain.value=.05;o.connect(v);v.connect(ac.destination);o.start();o.stop(ac.currentTime+.12)}
function snd(){muted=!muted;if(!muted&&!ac)ac=new(window.AudioContext||window.webkitAudioContext)();$("bM").textContent=muted?"M":"M ON";beep(F.scenes[cur].ok?660:120)}
function full(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()}
function next(){go(cur+1)}function prev(){go(cur-1)}
document.addEventListener("keydown",function(e){var k=e.key;
 if(k==="Escape"){if($("over").classList.contains("on"))over(false);else if($("notes").classList.contains("on"))$("notes").classList.remove("on");else if(mode==="explore")setMode("present");else location.href=$("arcade").href;return}
 if(mode==="present"&&(k==="ArrowRight"||k===" "||k==="PageDown")){e.preventDefault();next()}
 else if(mode==="present"&&(k==="ArrowLeft"||k==="PageUp")){e.preventDefault();prev()}
 else if(k==="Enter"&&mode==="present"&&document.activeElement===document.body)go(cur,true);
 else if(k==="p"||k==="P")setMode(mode==="present"?"explore":"present");
 else if(k==="r"||k==="R")over();else if(k==="t"||k==="T")$("notes").classList.toggle("on");
 else if(k==="m"||k==="M")snd();else if(k==="f"||k==="F")full()});
$("bP").onclick=function(){setMode(mode==="present"?"explore":"present")};$("bR").onclick=function(){over()};$("bT").onclick=function(){$("notes").classList.toggle("on")};$("bM").onclick=snd;$("bF").onclick=full;
$("view").addEventListener("click",function(e){if(mode==="present"&&e.clientX>innerWidth*.7)next()});
var sx;document.addEventListener("touchstart",function(e){sx=e.touches[0].clientX});document.addEventListener("touchend",function(e){var d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>50&&mode==="present")d<0?next():prev()});
// idle chrome
function wake(){document.body.classList.remove("idle");clearTimeout(idleT);idleT=setTimeout(function(){document.body.classList.add("idle")},3000)}
document.addEventListener("mousemove",wake);wake();setTimeout(function(){$("hint").style.opacity=0},6000);
var rg=new Image();rg.onerror=function(){$("ring").classList.add("nofb")};rg.src="assets/hologram_ring.png";
function loop(t){var dt=Math.min(50,t-last);last=t;if(!document.hidden){Fl.step(dt);Fl.draw(g)}requestAnimationFrame(loop)}requestAnimationFrame(loop);
var m=location.hash.match(/^#scene-(\d+)$/);go(m?+m[1]-1:0,false);
})();
