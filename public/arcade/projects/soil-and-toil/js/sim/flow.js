/* Reusable flow engine: particles along cubic beziers (fractions of the canvas). Disturb with .block (pile-up point 0..2), .vis (0..1 density), .speed. */
(function(){
function bz(p,t,W,H){var u=1-t;return[(u*u*u*p[0]+3*u*u*t*p[2]+3*u*t*t*p[4]+t*t*t*p[6])*W,(u*u*u*p[1]+3*u*u*t*p[3]+3*u*t*t*p[5]+t*t*t*p[7])*H]}
function Flow(o){this.pts=o.pts;this.n=o.n||30;this.speed=o.speed||.15;this.color=o.color||'#FFD9A0';this.size=o.size||3;this.vis=1;this.block=2;this.wob=o.wob==null?6:o.wob;
this.p=new Float32Array(this.n);for(var i=0;i<this.n;i++)this.p[i]=i/this.n}
Flow.prototype.draw=function(c,W,H,dt,tm){var m=Math.floor(this.n*this.vis),i,t,q,j;c.fillStyle=this.color;
for(i=0;i<m;i++){this.p[i]+=dt*this.speed*(.75+.5*((i*7)%5)/5);if(this.p[i]>1)this.p[i]-=1;t=this.p[i];
if(t>this.block){t=this.block-(i%9)*.012}
q=bz(this.pts,t<0?0:t,W,H);j=Math.sin(tm*2+i*1.7)*this.wob;c.globalAlpha=Math.min(1,t*6)*Math.min(1,(1.05-t)*8);
c.beginPath();c.arc(q[0]+j,q[1]+Math.cos(tm*1.6+i)*this.wob*.6,this.size*(.7+(i%3)*.25),0,6.283);c.fill()}
c.globalAlpha=1};
window.Flow=Flow;window.bezier=bz;
})();
