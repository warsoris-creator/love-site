/* ═══════════════════════════════════════════════════════
   SHARED.JS — varya-site
   1. PAGE TRANSITIONS (veil + View Transitions API)
   2. UNIFIED NAV (rebuilds itself on every page)
   3. STARS + CURSOR
   4. SFX — Web Audio ambient + UI sounds
═══════════════════════════════════════════════════════ */

/* ── 1. PAGE TRANSITION VEIL ── */
(function(){
  let veil = document.getElementById('page-veil');
  if(!veil){
    veil = document.createElement('div');
    veil.id = 'page-veil';
    veil.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:all;background:radial-gradient(ellipse at center,#160810 0%,#04010e 100%);opacity:1;transition:opacity 0.55s cubic-bezier(0.4,0,0.2,1);';
    document.body.prepend(veil);
  }

  function revealPage(){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      veil.style.opacity = '0';
      veil.style.pointerEvents = 'none';
    }));
  }
  if(document.readyState==='complete') revealPage();
  else window.addEventListener('load', revealPage);

  function goTo(href){
    if(window.SFX) window.SFX.click();
    if(document.startViewTransition){
      document.startViewTransition(()=>{ window.location.href = href; });
    } else {
      veil.style.opacity = '1'; veil.style.pointerEvents = 'all';
      setTimeout(()=>{ window.location.href = href; }, 570);
    }
  }
  window._goTo = goTo;

  document.addEventListener('click', e=>{
    const a = e.target.closest('a[href]');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('javascript') || a.dataset.external) return;
    e.preventDefault(); e.stopPropagation();
    goTo(href);
  }, true);
})();


/* ── 2. UNIFIED NAV ── */
(function(){
  const PAGE = location.pathname.split('/').pop() || 'index.html';
  const PAGES = [
    { href:'index.html',    label:'Главная',    lock:false },
    { href:'valentine.html',label:'Валентинка', lock:false },
    { href:'map.html',      label:'Карта',      lock:false },
    { href:'timeline.html', label:'История',    lock:false },
    { href:'gallery.html',  label:'Галерея',    lock:true  },
    { href:'letter.html',   label:'Музыка',     lock:false },
  ];

  /* -- rebuild the existing .site-nav (add burger, replace nav-links if stale) -- */
  const nav = document.querySelector('.site-nav');
  if(!nav) return;

  // standardise the nav-links block
  let links = nav.querySelector('.nav-links');
  if(!links){
    links = document.createElement('div');
    links.className = 'nav-links';
    nav.appendChild(links);
  }
  links.innerHTML = PAGES.map(p=>`
    <a href="${p.href}" class="nav-link${PAGE===p.href?' active':''}${p.lock?' nav-locked':''}">${p.label}</a>
  `).join('');

  // nav link sounds (desktop)
  links.querySelectorAll('.nav-link:not(.nav-locked)').forEach(a=>{
    a.addEventListener('mouseenter', ()=> window.SFX && window.SFX.hover());
  });

  /* -- burger button (injected once) -- */
  if(!nav.querySelector('.nav-burger')){
    const burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.setAttribute('aria-label','Меню');
    burger.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(burger);

    /* fullscreen drawer */
    const drawer = document.createElement('div');
    drawer.className = 'nav-drawer';
    drawer.innerHTML = PAGES.map(p=>`
      <a href="${p.href}" class="${PAGE===p.href?'active':''} ${p.lock?'locked':''}">${p.label}</a>
    `).join('') + `<div class="nav-drawer-sig">for varya ✦</div>`;
    document.body.appendChild(drawer);

    let open = false;
    function setMenu(state){
      open = state;
      burger.classList.toggle('open', open);
      drawer.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if(open && window.SFX) window.SFX.chime([523,659],0.05);
    }

    burger.addEventListener('click', ()=> setMenu(!open));
    drawer.addEventListener('click', e=>{ if(e.target===drawer) setMenu(false); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') setMenu(false); });

    drawer.querySelectorAll('a:not(.locked)').forEach(a=>{
      a.addEventListener('mouseenter', ()=> window.SFX && window.SFX.hover());
      a.addEventListener('click', e=>{
        e.preventDefault(); e.stopPropagation();
        setMenu(false);
        const href = a.getAttribute('href');
        setTimeout(()=> window._goTo(href), 300);
      });
    });
  }
})();


/* ── 3. STARS + CURSOR ── */
(function(){
  /* cursor dot — только на десктопе */
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if(!isTouchDevice && !document.querySelector('.cursor')){
    const cur = document.createElement('div');
    cur.className = 'cursor';
    document.body.appendChild(cur);
    document.addEventListener('mousemove', e=>{
      cur.style.left = e.clientX+'px'; cur.style.top = e.clientY+'px';
    });
  }

  /* trailing hearts */
  const cH = ['❤️','💕','💗','🩷'];
  let lx=0,ly=0;
  document.addEventListener('mousemove', e=>{
    if(Math.hypot(e.clientX-lx,e.clientY-ly)<22) return;
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

  /* stars canvas */
  const canvas = document.getElementById('stars-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars=[], shooters=[];

  function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  for(let i=0;i<320;i++){
    const t=Math.random();
    let op,r;
    if(t<0.55){op=0.06+Math.random()*0.14;r=0.2+Math.random()*0.7;}
    else if(t<0.85){op=0.2+Math.random()*0.28;r=0.6+Math.random()*0.9;}
    else{op=0.48+Math.random()*0.4;r=1.0+Math.random()*1.1;}
    stars.push({x:Math.random()*W,y:Math.random()*H,r,op,
      freq:1/(9+Math.random()*35), phase:Math.random()*Math.PI*2,
      bright:t>0.90, warm:Math.random()});
  }

  setInterval(()=>{
    if(Math.random()>.5) shooters.push({
      x:Math.random()*W*.75,y:Math.random()*H*.4,
      len:90+Math.random()*110,speed:7+Math.random()*9,op:1,
      angle:Math.PI/5+Math.random()*.35
    });
  },3500);

  function draw(){
    ctx.clearRect(0,0,W,H);
    const now=performance.now()*.001;
    stars.forEach(s=>{
      const t=0.5+0.5*Math.sin(now*s.freq*Math.PI*2+s.phase);
      const op=s.op*(0.2+0.8*t);
      const rv=s.warm>.6?255:215, bv=s.warm>.6?225:255;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${rv},230,${bv},${op})`; ctx.fill();
      if(s.bright&&t>.82){
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r*3.2,0,Math.PI*2);
        ctx.fillStyle=`rgba(${rv},230,${bv},${op*0.12*((t-.82)/.18)})`; ctx.fill();
      }
    });
    shooters=shooters.filter(s=>{
      ctx.beginPath(); ctx.moveTo(s.x,s.y);
      const ex=s.x+Math.cos(s.angle)*s.len, ey=s.y+Math.sin(s.angle)*s.len;
      const g=ctx.createLinearGradient(s.x,s.y,ex,ey);
      g.addColorStop(0,`rgba(255,245,255,${s.op})`);
      g.addColorStop(.3,`rgba(255,180,200,${s.op*.5})`);
      g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.strokeStyle=g; ctx.lineWidth=1.5; ctx.stroke();
      s.x+=Math.cos(s.angle)*s.speed; s.y+=Math.sin(s.angle)*s.speed; s.op-=.016;
      return s.op>0;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();


/* ── 4. SFX — звуки UI без ambient ── */
(function(){
  let ac=null, master=null, unlocked=false;

  function getAC(){
    if(!ac){
      ac=new(window.AudioContext||window.webkitAudioContext)();
      master=ac.createGain(); master.gain.value=0.4;
      master.connect(ac.destination);
    }
    return ac;
  }

  function unlock(){
    if(unlocked) return; unlocked=true;
    getAC();
    if(ac.state==='suspended') ac.resume();
  }

  function safe(fn){ try{ if(!ac) return; fn(); }catch(e){} }

  function hover(){ safe(()=>{
    if(ac.state==='suspended') return;
    const o=ac.createOscillator(),g=ac.createGain();
    o.type='sine'; o.frequency.setValueAtTime(860,ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200,ac.currentTime+0.1);
    g.gain.setValueAtTime(0.04,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+0.16);
    o.connect(g);g.connect(master);o.start();o.stop(ac.currentTime+0.18);
  });}

  function click(){ safe(()=>{
    if(ac.state==='suspended') return;
    [523.25,659.25].forEach((f,i)=>{
      const o=ac.createOscillator(),g=ac.createGain();
      o.type='triangle'; o.frequency.value=f;
      const t=ac.currentTime+i*.05;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.08,t+.01);
      g.gain.exponentialRampToValueAtTime(.001,t+.42);
      o.connect(g);g.connect(master);o.start(t);o.stop(t+.45);
    });
  });}

  function chime(freqs=[523,659],vol=.07){ safe(()=>{
    if(ac.state==='suspended') return;
    freqs.forEach((f,i)=>{
      const o=ac.createOscillator(),g=ac.createGain();
      o.type='sine'; o.frequency.value=f;
      const t=ac.currentTime+i*.08;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.025);
      g.gain.exponentialRampToValueAtTime(.001,t+1.2);
      o.connect(g);g.connect(master);o.start(t);o.stop(t+1.3);
    });
  });}

  function crack(){} function heartbeat(){} function whoosh(){} 
  function pageOpen(){} function startAmbient(){}

  ['click','touchstart','keydown'].forEach(ev=>
    document.addEventListener(ev, unlock, {once:true, passive:true})
  );

  window.SFX = { hover, click, crack, chime, heartbeat, whoosh, pageOpen, unlock, startAmbient };
})();