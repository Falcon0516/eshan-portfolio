// Flow engine: bots walk a perspective lane toward the vanishing point.
(function(){var VP={x:.5,y:.45},W=1600,H=900;
function pos(d){var e=Math.pow(d,.55);return{x:W*VP.x,y:H*(1-e*(1-VP.y)),s:Math.max(.08,1-e*.9)}}
var Flow={bots:[],coins:[],flash:[],img:{},ready:false,t:0,
 load:function(){["agent_bots_sheet","gold_coin_stack"].forEach(function(n){var i=new Image();i.onload=function(){Flow.img[n]=i};i.src="assets/"+n+".png"})},
 cuts:[[16,79,357,342],[465,101,239,320],[840,96,296,325],[1254,88,308,333],[1651,109,333,312]],
 cols:["#4aa8ff","#8B5CFF","#FF4D6D","#FFC857","#2CFFB8"],
 send:function(type,stopD,ok,done){Flow.bots.push({type:type,d:0,stop:stopD,ok:ok,done:done,w:0})},
 flashGate:function(d,ok){Flow.flash.push({d:d,ok:ok,a:1})},
 step:function(dt){Flow.t+=dt;Flow.bots.forEach(function(b){if(b.w>0){b.w-=dt;if(b.w<=0&&b.done){b.done()}b.gone=b.w<=0;return}
  b.d+=dt*.00022*(1+b.d);if(b.d>=b.stop){b.d=b.stop;b.w=900;Flow.flashGate(b.stop,b.ok);if(!b.ok)b.bounce=1}});
  Flow.bots=Flow.bots.filter(function(b){return !b.gone});
  Flow.flash.forEach(function(f){f.a-=dt*.0012});Flow.flash=Flow.flash.filter(function(f){return f.a>0});
  Flow.coins.forEach(function(c){c.d+=dt*.00012;if(c.d>1)c.d=0})},
 draw:function(g){g.clearRect(0,0,W,H);
  for(var i=1;i<=11;i++){var p=pos(i/12.5);g.strokeStyle="#2CFFB833";g.lineWidth=2*p.s;g.strokeRect(p.x-260*p.s,p.y-300*p.s,520*p.s,300*p.s)}
  Flow.flash.forEach(function(f){var p=pos(f.d);g.globalAlpha=Math.max(0,f.a);g.strokeStyle=f.ok?"#2CFFB8":"#FF4D6D";g.fillStyle=f.ok?"#2CFFB822":"#FF4D6D44";g.lineWidth=6*p.s;g.fillRect(p.x-260*p.s,p.y-300*p.s,520*p.s,300*p.s);g.strokeRect(p.x-260*p.s,p.y-300*p.s,520*p.s,300*p.s);g.globalAlpha=1});
  var ci=Flow.img.gold_coin_stack;Flow.coins.forEach(function(c){var p=pos(c.d),s=150*p.s,bob=Math.sin(Flow.t/400+c.d*9)*8*p.s;if(ci)g.drawImage(ci,p.x+c.x*p.s-s/2,p.y-s+bob,s,s);else{g.fillStyle="#FFC857";g.beginPath();g.arc(p.x+c.x*p.s,p.y-s/2+bob,s/4,0,7);g.fill()}});
  var sh=Flow.img.agent_bots_sheet;Flow.bots.forEach(function(b){var p=pos(b.d),r=Flow.cuts[b.type],h=380*p.s,w=h*r[2]/r[3],sq=1+Math.sin(Flow.t/120)*.04,off=b.bounce&&b.w>0?(900-b.w)*.4*p.s:0;
   g.save();g.translate(p.x+off,p.y);g.scale(1/sq,sq);if(b.bounce&&b.w>0)g.rotate((900-b.w)/500);
   if(sh)g.drawImage(sh,r[0],r[1],r[2],r[3],-w/2,-h,w,h);else{g.fillStyle=Flow.cols[b.type];g.beginPath();g.arc(0,-h/2,h/2.4,0,7);g.fill()}g.restore()})}};
for(var k=0;k<3;k++)Flow.coins.push({d:k/3,x:150+k*40});
window.Flow=Flow;window.FlowPos=pos})();
