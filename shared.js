// shared.js — stars background + cursor
(function(){
  // CURSOR
  const cur = document.createElement('div');
  cur.className = 'cursor';
  document.body.appendChild(cur);
  document.addEventListener('mousemove', e => {
    cur.style.left = e.clientX + 'px';
    cur.style.top  = e.clientY + 'px';
  });

  // CURSOR HEARTS on mousemove
  const cH = ['❤️','💕','💗','🩷'];
  let lx=0,ly=0;
  document.addEventListener('mousemove', e => {
    if(Math.hypot(e.clientX-lx,e.clientY-ly)<16) return;
    lx=e.clientX; ly=e.clientY;
    const el=document.createElement('div');
    el.textContent=cH[Math.floor(Math.random()*cH.length)];
    const sz=11+Math.random()*12;
    el.style.cssText=`position:fixed;left:${lx}px;top:${ly}px;font-size:${sz}px;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);user-select:none;`;
    document.body.appendChild(el);
    let px=lx,py=ly,vx=(Math.random()-.5)*50,vy=-(20+Math.random()*40),op=1;
    (function t(){
      px+=vx*.04; vy+=1.1; py+=vy*.04; op-=.025;
      el.style.cssText=`position:fixed;left:${px}px;top:${py}px;font-size:${sz}px;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);opacity:${op};user-select:none;`;
      op>0?requestAnimationFrame(t):el.remove();
    })();
  });

  // STARS
  const canvas = document.getElementById('stars-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars=[], shootingStars=[];

  function resize(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Generate stars — each with its own twinkle frequency
  for(let i=0;i<280;i++){
    const baseOp = Math.random()*0.55+0.1;
    stars.push({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.8+0.2,
      baseOp,
      // twinkle: random speed between slow (0.4) and fast (2.5) hz
      freq: 0.4 + Math.random()*2.1,
      phase: Math.random()*Math.PI*2,
      // some stars are "bright" — bigger flare
      bright: Math.random() > 0.82,
      // color tint: most white-pink, some warm, some cool
      hue: Math.random() > 0.7 ? (Math.random()>0.5 ? '255,210,180' : '180,210,255') : '255,240,245'
    });
  }

  function spawnShooting(){
    shootingStars.push({
      x: Math.random()*W*0.7,
      y: Math.random()*H*0.4,
      len: 80+Math.random()*120,
      speed: 8+Math.random()*8,
      op: 1,
      angle: Math.PI/5+Math.random()*0.3
    });
  }
  setInterval(()=>{ if(Math.random()>0.5) spawnShooting(); }, 2800);

  function draw(){
    ctx.clearRect(0,0,W,H);
    const now = performance.now() / 1000; // real seconds

    stars.forEach(s=>{
      // Independent twinkle: each star has own freq+phase → never synced
      const twinkle = 0.5 + 0.5*Math.sin(now * s.freq * Math.PI * 2 + s.phase);
      const opacity = s.baseOp * (0.15 + 0.85*twinkle);

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${s.hue},${opacity})`;
      ctx.fill();

      // bright stars get a soft glow halo when at peak brightness
      if(s.bright && twinkle > 0.85){
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.8, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${s.hue},${opacity * 0.15})`;
        ctx.fill();
      }
    });

    // Shooting stars
    shootingStars = shootingStars.filter(s=>{
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      const ex = s.x + Math.cos(s.angle)*s.len;
      const ey = s.y + Math.sin(s.angle)*s.len;
      const grad = ctx.createLinearGradient(s.x,s.y,ex,ey);
      grad.addColorStop(0, `rgba(255,255,255,${s.op})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      s.x += Math.cos(s.angle)*s.speed;
      s.y += Math.sin(s.angle)*s.speed;
      s.op -= 0.018;
      return s.op > 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();
