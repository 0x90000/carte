(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.lucide) window.lucide.createIcons();
  const theme = [...document.body.classList].find((name) => /^layout-\d+$/.test(name));
  const heroProps = {
    'layout-2': '<div class="theme-prop rococo-props" aria-hidden="true"><span class="rococo-scrollwork"></span><span class="rococo-pearl pearl-a"></span><span class="rococo-pearl pearl-b"></span><span class="rococo-ribbon">INVITATION À L’AMOUR</span></div>',
    'layout-3': '<div class="theme-prop cinema-props" aria-hidden="true"><span class="cinema-hud">ISO 800 · 50MM · F1.4</span><span class="cinema-sidecode">LX / TAKE 018</span><span class="cinema-scan"></span></div>',
    'layout-4': '<div class="theme-prop coastal-props" aria-hidden="true"><span class="coastal-wave wave-one"></span><span class="coastal-wave wave-two"></span><span class="coastal-pearl pearl-one"></span><span class="coastal-pearl pearl-two"></span><span class="coastal-compass">N<br/><b>W</b><br/>S</span></div>',
    'layout-5': '<div class="theme-prop terracotta-props" aria-hidden="true"><span class="terracotta-tile tile-one"></span><span class="terracotta-tile tile-two"></span><span class="terracotta-tile tile-three"></span><span class="terracotta-sun"></span><span class="terracotta-note">AIRE DE FÊTE<br/><small>HANGZHOU · 2026</small></span></div>',
    'layout-6': '<div class="theme-prop mono-props" aria-hidden="true"><span class="mono-rule rule-a"></span><span class="mono-rule rule-b"></span><span class="mono-stamp">LX—018</span><span class="mono-dot"></span></div>',
    'layout-7': '<div class="theme-prop sakura-props" aria-hidden="true"><span class="sakura-lantern lantern-a"></span><span class="sakura-lantern lantern-b"></span><span class="sakura-petal petal-a">✿</span><span class="sakura-petal petal-b">✿</span><span class="sakura-petal petal-c">✿</span></div>',
    'layout-8': '<div class="theme-prop deco-props" aria-hidden="true"><span class="deco-ray ray-a"></span><span class="deco-ray ray-b"></span><span class="deco-ray ray-c"></span><span class="deco-diamond"></span><span class="deco-caption">THE GOLDEN HOUR</span></div>',
    'layout-9': '<div class="theme-prop lavender-props" aria-hidden="true"><span class="lavender-constellation const-a"></span><span class="lavender-const const-b"></span><span class="lavender-const const-c"></span><span class="lavender-star star-a">✦</span><span class="lavender-star star-b">✦</span><span class="lavender-caption">VIOLET HOUR / 18.10.26</span></div>',
    'layout-10': '<div class="theme-prop meadow-props" aria-hidden="true"><span class="meadow-stem stem-one"></span><span class="meadow-stem stem-two"></span><span class="meadow-flower flower-one">✽</span><span class="meadow-flower flower-two">✿</span><span class="meadow-label">FIELD NOTE 018<br/><small>pressed in october</small></span></div>'
  };
  const hero = document.querySelector('.hero');
  if (hero && heroProps[theme]) hero.insertAdjacentHTML('beforeend', heroProps[theme]);
  const topbar = document.querySelector('[data-topbar]');
  const onScroll = () => topbar?.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion) reveals.forEach((item) => item.classList.add('is-visible'));
  else {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    reveals.forEach((item) => observer.observe(item));
  }
  const album = document.querySelector('[data-album]');
  const track = album?.querySelector('[data-album-track]');
  const slides = album ? [...album.querySelectorAll('[data-album-slide]')] : [];
  const dots = album ? [...album.querySelectorAll('[data-album-dot]')] : [];
  const prev = album?.querySelector('[data-album-prev]');
  const next = album?.querySelector('[data-album-next]');
  let index = 0; let timer; let startX = null;
  const setSlide = (nextIndex, announce = true) => {
    if (!track || !slides.length) return;
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translate3d(${-index * 100}%,0,0)`;
    slides.forEach((slide, slideIndex) => slide.setAttribute('aria-hidden', slideIndex === index ? 'false' : 'true'));
    dots.forEach((dot, dotIndex) => { const active = dotIndex === index; dot.classList.toggle('is-active', active); dot.setAttribute('aria-selected', String(active)); });
    if (announce) album?.setAttribute('aria-label', `故事相册，第 ${index + 1} 张，共 ${slides.length} 张`);
  };
  const restart = () => { window.clearInterval(timer); if (!reduceMotion) timer = window.setInterval(() => setSlide(index + 1, false), 6200); };
  if (album) {
    setSlide(0, false);
    prev?.addEventListener('click', () => { setSlide(index - 1); restart(); });
    next?.addEventListener('click', () => { setSlide(index + 1); restart(); });
    dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => { setSlide(dotIndex); restart(); }));
    album.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); setSlide(index - 1); restart(); } if (event.key === 'ArrowRight') { event.preventDefault(); setSlide(index + 1); restart(); } });
    album.addEventListener('pointerdown', (event) => { startX = event.clientX; });
    album.addEventListener('pointerup', (event) => { if (startX === null) return; const delta = event.clientX - startX; startX = null; if (Math.abs(delta) > 44) { setSlide(index + (delta < 0 ? 1 : -1)); restart(); } });
    album.addEventListener('pointercancel', () => { startX = null; });
    album.addEventListener('mouseenter', () => window.clearInterval(timer)); album.addEventListener('mouseleave', restart);
    album.addEventListener('focusin', () => window.clearInterval(timer)); album.addEventListener('focusout', (event) => { if (!album.contains(event.relatedTarget)) restart(); });
    restart();
  }
  const sound = document.querySelector('[data-sound-toggle]');
  let audioContext; let master; let scoreTimer; let playing = false;
  const notes = [261.63,329.63,392,523.25,392,329.63,293.66,349.23];
  const note = (frequency, when) => { const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0, when); gain.gain.linearRampToValueAtTime(.04, when + .65); gain.gain.exponentialRampToValueAtTime(.0001, when + 3); oscillator.connect(gain).connect(master); oscillator.start(when); oscillator.stop(when + 3.1); };
  const schedule = () => { if (!playing) return; const now = audioContext.currentTime + .05; notes.forEach((frequency, noteIndex) => note(frequency, now + noteIndex * 1.6)); scoreTimer = window.setTimeout(schedule, notes.length * 1600 - 100); };
  const renderSound = () => { if (!sound) return; sound.classList.toggle('is-playing', playing); sound.setAttribute('aria-pressed', String(playing)); sound.setAttribute('title', playing ? '关闭背景音乐' : '播放背景音乐'); sound.innerHTML = `<i data-lucide="${playing ? 'volume-x' : 'volume-2'}" aria-hidden="true"></i><span class="sound-label">${playing ? '静音' : '声音'}</span>`; if (window.lucide) window.lucide.createIcons(); };
  sound?.addEventListener('click', () => { if (!playing) { audioContext = new (window.AudioContext || window.webkitAudioContext)(); master = audioContext.createGain(); master.gain.value = .4; master.connect(audioContext.destination); playing = true; renderSound(); schedule(); } else { playing = false; window.clearTimeout(scoreTimer); if (master) master.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .32); renderSound(); } });
  const form = document.querySelector('[data-reply-form]'); const status = document.querySelector('[data-form-status]');
  form?.addEventListener('submit', (event) => { event.preventDefault(); const name = form.elements.name.value.trim(); if (!name) return; status.textContent = `谢谢你，${name}！我们已经收到你的回执。`; form.reset(); window.setTimeout(() => { status.textContent = ''; }, 6000); });
  const canvas = document.getElementById('invite-particles');
  if (!canvas || !window.THREE || reduceMotion) return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7)); renderer.setSize(window.innerWidth, window.innerHeight, false);
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 1, 1600); camera.position.z = 540;
  const count = window.innerWidth < 700 ? 220 : 400; const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) { positions[i * 3] = (Math.random() - .5) * 980; positions[i * 3 + 1] = (Math.random() - .5) * 980; positions[i * 3 + 2] = (Math.random() - .5) * 760; }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xd9b982, size: 2.1, sizeAttenuation: true, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(geometry, material); scene.add(points); let frame;
  const animate = () => { frame = requestAnimationFrame(animate); points.rotation.y += .00023; points.rotation.x = Math.sin(performance.now() * .00008) * .08; renderer.render(scene, camera); }; animate();
  const resize = () => { renderer.setSize(window.innerWidth, window.innerHeight, false); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); }; window.addEventListener('resize', resize, { passive: true }); window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
})();
