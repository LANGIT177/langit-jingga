// ============================================================
// LANGIT JINGGA — scenes.js
// Animasi canvas prosedural tanpa gambar eksternal.
// ============================================================

const SceneEngine = (() => {
  const canvas = document.getElementById("sceneCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let width = 0, height = 0, dpr = 1;
  let current = "senja_jingga";
  let target = "senja_jingga";
  let fade = 1;
  let last = 0;
  let raf = null;
  let particles = [];

  const rand = (a,b) => Math.random() * (b-a) + a;
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    resetParticles();
  }

  function resetParticles() {
    const mobile = width < 700;
    const count = mobile ? 70 : 130;
    particles = Array.from({length: count}, () => ({
      x: rand(0,width), y: rand(0,height),
      r: rand(.4,1.8), a: rand(.2,.9),
      speed: rand(.02,.12)
    }));
  }

  function gradient(top, bottom) {
    const g = ctx.createLinearGradient(0,0,0,height);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
  }

  function drawCloud(x,y,s,alpha=.12) {
    ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle="#fff1df";
    ctx.beginPath();
    ctx.ellipse(x,y,s*1.4,s*.32,0,0,Math.PI*2);
    ctx.ellipse(x+s*.65,y-s*.12,s*.65,s*.28,0,0,Math.PI*2);
    ctx.ellipse(x-s*.6,y-s*.08,s*.8,s*.3,0,0,Math.PI*2);
    ctx.fill(); ctx.restore();
  }

  function sunset(t) {
    gradient("#3d315c","#f09a62");
    const horizon = height*.72;
    const sx = width*.78, sy = horizon-50;
    const glow = ctx.createRadialGradient(sx,sy,5,sx,sy,180);
    glow.addColorStop(0,"rgba(255,220,155,.65)");
    glow.addColorStop(1,"rgba(255,160,100,0)");
    ctx.fillStyle=glow; ctx.fillRect(0,0,width,height);
    ctx.fillStyle="#ffd49a"; ctx.beginPath(); ctx.arc(sx,sy,38,0,Math.PI*2); ctx.fill();
    drawCloud((t*.008)% (width+300)-150,height*.32,100,.10);
    drawCloud(width-((t*.006)%(width+300)),height*.48,150,.08);
    ctx.fillStyle="rgba(55,37,57,.65)";
    ctx.fillRect(0,horizon,width,height-horizon);
    ctx.fillStyle="rgba(27,25,36,.6)";
    for(let x=0;x<width;x+=70) {
      const h=rand(20,80);
      ctx.fillRect(x,horizon-h,55,h);
    }
  }

  function rain(t) {
    gradient("#263848","#7b8994");
    ctx.fillStyle="rgba(180,205,215,.08)";
    ctx.fillRect(0,0,width,height);
    ctx.strokeStyle="rgba(225,240,245,.45)";
    ctx.lineWidth=1;
    const count = width < 700 ? 90 : 180;
    for(let i=0;i<count;i++) {
      const x=(i*97 + t*.25)% (width+80)-40;
      const y=(i*53 + t*.9)% (height+40)-40;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-7,y+18); ctx.stroke();
    }
    // Embun/kabut kaca sederhana
    const haze=ctx.createRadialGradient(width*.3,height*.5,10,width*.3,height*.5,260);
    haze.addColorStop(0,"rgba(240,250,255,.08)");
    haze.addColorStop(1,"rgba(240,250,255,0)");
    ctx.fillStyle=haze; ctx.fillRect(0,0,width,height);
  }

  function night(t) {
    gradient("#0e1227","#352a4d");
    ctx.fillStyle="#f6e7ba"; ctx.beginPath(); ctx.arc(width*.76,height*.22,34,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#0e1227"; ctx.beginPath(); ctx.arc(width*.78,height*.20,31,0,Math.PI*2); ctx.fill();
    particles.forEach(p => {
      const twinkle=.45+.55*Math.sin(t*p.speed+p.x);
      ctx.globalAlpha=p.a*twinkle; ctx.fillStyle="#fff3d0";
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
  }

  function city(t) {
    gradient("#30263c","#b96555");
    ctx.fillStyle="rgba(24,24,31,.72)";
    ctx.fillRect(0,height*.67,width,height*.33);
    for(let x=0;x<width;x+=70) {
      const h=60+(x*13%130);
      ctx.fillRect(x,height*.67-h,52,h);
    }
    ctx.strokeStyle="rgba(255,212,120,.6)";
    ctx.lineWidth=3;
    for(let x=40;x<width;x+=120) {
      ctx.beginPath(); ctx.moveTo(x,height*.67-15); ctx.lineTo(x,height*.67+55); ctx.stroke();
      ctx.fillStyle="rgba(255,220,130,.75)";
      ctx.beginPath(); ctx.arc(x,height*.67-15,5,0,Math.PI*2); ctx.fill();
    }
    // jejak lampu kendaraan
    ctx.strokeStyle="rgba(255,180,120,.35)";
    ctx.lineWidth=2;
    const mx=(t*.25)%(width+300)-150;
    ctx.beginPath(); ctx.moveTo(mx,height*.78); ctx.lineTo(mx+130,height*.78); ctx.stroke();
  }

  function interior(t, room) {
    gradient("#735766","#e8b17d");
    ctx.fillStyle="rgba(74,51,57,.7)";
    ctx.fillRect(0,height*.72,width,height*.28);
    const wx=width*.62, wy=height*.25, ww=width*.23, wh=height*.35;
    ctx.fillStyle="rgba(255,221,171,.7)"; ctx.fillRect(wx,wy,ww,wh);
    ctx.strokeStyle="rgba(76,52,61,.8)"; ctx.lineWidth=8;
    ctx.strokeRect(wx,wy,ww,wh);
    ctx.beginPath(); ctx.moveTo(wx+ww/2,wy); ctx.lineTo(wx+ww/2,wy+wh); ctx.stroke();
    ctx.fillStyle="rgba(45,33,42,.75)";
    ctx.fillRect(width*.1,height*.62,width*.28,18);
    ctx.fillRect(width*.14,height*.45,16,height*.17);
    if(room==="kelas") {
      for(let x=width*.1;x<width*.5;x+=85) ctx.fillRect(x,height*.75,65,9);
    } else {
      ctx.beginPath(); ctx.arc(width*.2,height*.62,35,0,Math.PI*2); ctx.fill();
    }
  }

  function drawScene(name,t) {
    if(name==="senja_jingga") sunset(t);
    else if(name==="hujan") rain(t);
    else if(name==="malam_bintang") night(t);
    else if(name==="jalanan_kota") city(t);
    else if(name==="kelas") interior(t,"kelas");
    else if(name==="kamar") interior(t,"kamar");
    else sunset(t);
  }

  function frame(t) {
    if(document.hidden) { raf=requestAnimationFrame(frame); return; }
    const dt = Math.min(50, t-last || 16); last=t;
    if(current!==target) {
      fade += dt/900;
      if(fade>=1) { current=target; fade=0; }
    }
    drawScene(current,t);
    if(current!==target) {
      ctx.save(); ctx.globalAlpha=clamp(fade,0,1); drawScene(target,t); ctx.restore();
    }
    raf=requestAnimationFrame(frame);
  }

  function setScene(name) {
    if(!name || name===target) return;
    target=name; fade=0;
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => { if(document.hidden) last=performance.now(); });
  resize();
  raf=requestAnimationFrame(frame);

  return { setScene };
})();
