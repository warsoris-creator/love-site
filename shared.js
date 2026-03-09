(function(){

  /* ═══════════════════════════════════════
     CURSOR + TRAILING HEARTS
  ═══════════════════════════════════════ */
  const cur = document.createElement('div');
  cur.className = 'cursor';
  document.body.appendChild(cur);
  document.addEventListener('mousemove', e => {
    cur.style.left = e.clientX + 'px';
    cur.style.top  = e.clientY + 'px';
  });

  const cH = ['❤️','💕','💗','🩷'];
  let lx=0,ly=0;
  document.addEventListener('mousemove', e => {
    if(Math.hypot(e.clientX-lx,e.clientY-ly)<20) return;
    lx=e.clientX; ly=e.clientY;
    const el=document.createElement('div');
    el.textContent=cH[Math.floor(Math.random()*cH.length)];
    const sz=10+Math.random()*9;
    el.style.cssText=`position:fixed;left:${lx}px;top:${ly}px;font-size:${sz}px;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);user-select:none;`;
    document.body.appendChild(el);
    let px=lx,py=ly,vx=(Math.random()-.5)*44,vy=-(18+Math.random()*34),op=1;
    (function tick(){
      px+=vx*.04; vy+=1.0; py+=vy*.04; op-=.022;
      el.style.cssText=`position:fixed;left:${px}px;top:${py}px;font-size:${sz}px;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);opacity:${op};user-select:none;`;
      op>0?requestAnimationFrame(tick):el.remove();
    })();
  });

  /* ═══════════════════════════════════════
     STARS — smooth breathing, NEVER flicker
     Period 8–40 seconds per star.
     No rapid oscillation possible.
  ═══════════════════════════════════════ */
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

  for(let i=0;i<320;i++){
    const tier = Math.random();
    let baseOp, radius;
    if(tier < 0.55)      { baseOp=0.07+Math.random()*0.15; radius=0.2+Math.random()*0.7; }
    else if(tier < 0.85) { baseOp=0.22+Math.random()*0.28; radius=0.6+Math.random()*0.9; }
    else                  { baseOp=0.50+Math.random()*0.38; radius=1.0+Math.random()*1.1; }

    stars.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: radius,
      baseOp,
      // freq = 1/period, period 8–40s → freq 0.025–0.125 Hz MAX
      freq: 1/(8 + Math.random()*32),
      phase: Math.random()*Math.PI*2,
      bright: tier > 0.90,
      warm: Math.random()
    });
  }

  function spawnShooting(){
    shootingStars.push({
      x: Math.random()*W*0.75,
      y: Math.random()*H*0.45,
      len: 90+Math.random()*110,
      speed: 7+Math.random()*9,
      op: 1,
      angle: Math.PI/5+Math.random()*0.35
    });
  }
  setInterval(()=>{ if(Math.random()>0.45) spawnShooting(); }, 3500);

  function draw(){
    ctx.clearRect(0,0,W,H);
    const now = performance.now() * 0.001;

    stars.forEach(s=>{
      const t = 0.5 + 0.5*Math.sin(now * s.freq * Math.PI * 2 + s.phase);
      const op = s.baseOp * (0.2 + 0.8*t);
      const r = s.warm > 0.6 ? 255 : 215;
      const g = 230;
      const b = s.warm > 0.6 ? 225 : 255;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${r},${g},${b},${op})`;
      ctx.fill();

      if(s.bright && t > 0.82){
        const glowOp = op * 0.12 * ((t-0.82)/0.18);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${r},${g},${b},${glowOp})`;
        ctx.fill();
      }
    });

    shootingStars = shootingStars.filter(s=>{
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      const ex = s.x + Math.cos(s.angle)*s.len;
      const ey = s.y + Math.sin(s.angle)*s.len;
      const grad = ctx.createLinearGradient(s.x,s.y,ex,ey);
      grad.addColorStop(0, `rgba(255,245,255,${s.op})`);
      grad.addColorStop(0.3, `rgba(255,180,200,${s.op*0.5})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      s.x += Math.cos(s.angle)*s.speed;
      s.y += Math.sin(s.angle)*s.speed;
      s.op -= 0.016;
      return s.op > 0;
    });

    requestAnimationFrame(draw);
  }
  draw();

  /* ═══════════════════════════════════════
     GLOBAL AUDIO ENGINE  (Web Audio API)
     — soft ambient drone on every page
     — UI sounds: hover, click, crack, chime, heartbeat
     — iOS unlock on first touch
  ═══════════════════════════════════════ */
  window.SFX = (function(){
    let ac = null;
    let masterGain = null;
    let ambientPlaying = false;
    let unlocked = false;

    function getAC(){
      if(!ac){
        ac = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ac.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(ac.destination);
      }
      return ac;
    }

    function unlock(){
      if(unlocked) return;
      unlocked = true;
      getAC();
      if(ac.state==='suspended') ac.resume().then(()=> setTimeout(startAmbient,200));
      else setTimeout(startAmbient,200);
    }

    function startAmbient(){
      if(ambientPlaying || !ac) return;
      ambientPlaying = true;
      const amb = ac.createGain();
      amb.gain.value = 0;
      amb.connect(masterGain);
      // two detuned sines → gentle beating drone
      [54.5, 54.7].forEach(f=>{
        const o=ac.createOscillator(); o.type='sine'; o.frequency.value=f;
        const g=ac.createGain(); g.gain.value=0.10;
        o.connect(g); g.connect(amb); o.start();
      });
      // soft upper partials
      [109.2, 218.4].forEach(f=>{
        const o=ac.createOscillator(); o.type='triangle'; o.frequency.value=f;
        const g=ac.createGain(); g.gain.value=0.025;
        o.connect(g); g.connect(amb); o.start();
      });
      amb.gain.linearRampToValueAtTime(1, ac.currentTime+4);
    }

    // soft airy hover whisp
    function hover(){
      try{
        const a=getAC(); if(!unlocked||a.state==='suspended') return;
        const o=a.createOscillator(), g=a.createGain();
        o.type='sine'; o.frequency.setValueAtTime(900,a.currentTime);
        o.frequency.exponentialRampToValueAtTime(1300,a.currentTime+0.1);
        g.gain.setValueAtTime(0.05,a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.15);
        o.connect(g); g.connect(masterGain);
        o.start(); o.stop(a.currentTime+0.17);
      }catch(e){}
    }

    // gentle pluck click
    function click(){
      try{
        const a=getAC(); if(!unlocked||a.state==='suspended') return;
        [523.25,659.25].forEach((f,i)=>{
          const o=a.createOscillator(), g=a.createGain();
          o.type='triangle'; o.frequency.value=f;
          const t0=a.currentTime+i*0.05;
          g.gain.setValueAtTime(0,t0);
          g.gain.linearRampToValueAtTime(0.12,t0+0.01);
          g.gain.exponentialRampToValueAtTime(0.001,t0+0.45);
          o.connect(g); g.connect(masterGain);
          o.start(t0); o.stop(t0+0.5);
        });
      }catch(e){}
    }

    // fortune cookie crack: noise crinkle + chime
    function crack(){
      try{
        const a=getAC(); if(!unlocked||a.state==='suspended') return;
        const buf=a.createBuffer(1,Math.floor(a.sampleRate*0.10),a.sampleRate);
        const d=buf.getChannelData(0);
        for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
        const src=a.createBufferSource(); src.buffer=buf;
        const bpf=a.createBiquadFilter(); bpf.type='bandpass';
        bpf.frequency.value=3000; bpf.Q.value=1.8;
        const g=a.createGain();
        g.gain.setValueAtTime(0.22,a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.12);
        src.connect(bpf); bpf.connect(g); g.connect(masterGain);
        src.start(); src.stop(a.currentTime+0.13);
        setTimeout(()=>chime([830,1046,1318],0.08),100);
      }catch(e){}
    }

    // rising chime — used for fortune reveal and page transitions
    function chime(freqs=[523,659,784,1046], vol=0.10){
      try{
        const a=getAC(); if(!unlocked||a.state==='suspended') return;
        freqs.forEach((f,i)=>{
          const o=a.createOscillator(), g=a.createGain();
          o.type='sine'; o.frequency.value=f;
          const t0=a.currentTime+i*0.08;
          g.gain.setValueAtTime(0,t0);
          g.gain.linearRampToValueAtTime(vol,t0+0.025);
          g.gain.exponentialRampToValueAtTime(0.001,t0+1.4);
          o.connect(g); g.connect(masterGain);
          o.start(t0); o.stop(t0+1.5);
        });
      }catch(e){}
    }

    // double thud heartbeat (timeline page)
    function heartbeat(){
      try{
        const a=getAC(); if(!unlocked||a.state==='suspended') return;
        [0,0.21].forEach(delay=>{
          const o=a.createOscillator(), g=a.createGain();
          o.type='sine';
          o.frequency.setValueAtTime(65,a.currentTime+delay);
          o.frequency.exponentialRampToValueAtTime(28,a.currentTime+delay+0.18);
          g.gain.setValueAtTime(0.32,a.currentTime+delay);
          g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+delay+0.22);
          o.connect(g); g.connect(masterGain);
          o.start(a.currentTime+delay); o.stop(a.currentTime+delay+0.25);
        });
      }catch(e){}
    }

    // rising cinematic swell on page open
    function pageOpen(){
      try{
        const a=getAC(); if(!unlocked||a.state==='suspended') return;
        [130.8,164.8,196,246.9].forEach((f,i)=>{
          const o=a.createOscillator(), g=a.createGain();
          o.type='sine'; o.frequency.value=f;
          const t0=a.currentTime+i*0.16;
          g.gain.setValueAtTime(0,t0);
          g.gain.linearRampToValueAtTime(0.08,t0+0.22);
          g.gain.exponentialRampToValueAtTime(0.001,t0+2.2);
          o.connect(g); g.connect(masterGain);
          o.start(t0); o.stop(t0+2.5);
        });
      }catch(e){}
    }

    // map plane whoosh
    function whoosh(){
      try{
        const a=getAC(); if(!unlocked||a.state==='suspended') return;
        const buf=a.createBuffer(1,Math.floor(a.sampleRate*0.5),a.sampleRate);
        const d=buf.getChannelData(0);
        for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);
        const src=a.createBufferSource(); src.buffer=buf;
        const lpf=a.createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value=900;
        const g=a.createGain();
        g.gain.setValueAtTime(0,a.currentTime);
        g.gain.linearRampToValueAtTime(0.14,a.currentTime+0.1);
        g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.5);
        src.connect(lpf); lpf.connect(g); g.connect(masterGain);
        src.start(); src.stop(a.currentTime+0.55);
      }catch(e){}
    }

    // unlock on first gesture
    ['click','touchstart','keydown'].forEach(ev=>
      document.addEventListener(ev, unlock, {once:true, passive:true})
    );

    return { hover, click, crack, chime, heartbeat, pageOpen, whoosh, unlock };
  })();

  // page open swell on first click anywhere
  document.addEventListener('click', ()=> window.SFX && window.SFX.pageOpen(), {once:true});

  // hover sounds on nav links
  document.querySelectorAll('.nav-link, .menu-card:not(.locked)').forEach(el=>{
    el.addEventListener('mouseenter', ()=> window.SFX && window.SFX.hover());
    el.addEventListener('click',      ()=> window.SFX && window.SFX.click());
  });

})();
