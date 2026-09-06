(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.lucide) window.lucide.createIcons();

  const topbar = document.querySelector('[data-topbar]');
  const onScroll = () => topbar?.classList.toggle('is-scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion) revealItems.forEach((el) => el.classList.add('is-visible'));
  else {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.14 });
    revealItems.forEach((el) => observer.observe(el));
  }

  // Story album: buttons, keyboard focus, and touch swipe all share one state.
  const album = document.querySelector('[data-album]');
  const albumTrack = album?.querySelector('[data-album-track]');
  const albumSlides = album ? [...album.querySelectorAll('[data-album-slide]')] : [];
  const albumDots = album ? [...album.querySelectorAll('[data-album-dot]')] : [];
  const albumPrev = album?.querySelector('[data-album-prev]');
  const albumNext = album?.querySelector('[data-album-next]');
  let albumIndex = 0;
  let albumTimer;
  let albumStartX = null;
  const setAlbumSlide = (nextIndex, announce = true) => {
    if (!albumTrack || !albumSlides.length) return;
    albumIndex = (nextIndex + albumSlides.length) % albumSlides.length;
    albumTrack.style.transform = `translate3d(${-albumIndex * 100}%, 0, 0)`;
    albumSlides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', index === albumIndex ? 'false' : 'true');
    });
    albumDots.forEach((dot, index) => {
      const active = index === albumIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
    if (announce) album?.setAttribute('aria-label', `我们的故事相册，第 ${albumIndex + 1} 张，共 ${albumSlides.length} 张`);
  };
  const stopAlbumAutoPlay = () => window.clearInterval(albumTimer);
  const startAlbumAutoPlay = () => {
    stopAlbumAutoPlay();
    if (!reduceMotion) albumTimer = window.setInterval(() => setAlbumSlide(albumIndex + 1, false), 6200);
  };
  if (album) {
    setAlbumSlide(0, false);
    albumPrev?.addEventListener('click', () => { setAlbumSlide(albumIndex - 1); startAlbumAutoPlay(); });
    albumNext?.addEventListener('click', () => { setAlbumSlide(albumIndex + 1); startAlbumAutoPlay(); });
    albumDots.forEach((dot, index) => dot.addEventListener('click', () => { setAlbumSlide(index); startAlbumAutoPlay(); }));
    album.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); setAlbumSlide(albumIndex - 1); startAlbumAutoPlay(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); setAlbumSlide(albumIndex + 1); startAlbumAutoPlay(); }
    });
    album.addEventListener('pointerdown', (event) => { albumStartX = event.clientX; });
    album.addEventListener('pointerup', (event) => {
      if (albumStartX === null) return;
      const delta = event.clientX - albumStartX;
      albumStartX = null;
      if (Math.abs(delta) < 45) return;
      setAlbumSlide(albumIndex + (delta < 0 ? 1 : -1));
      startAlbumAutoPlay();
    });
    album.addEventListener('pointercancel', () => { albumStartX = null; });
    album.addEventListener('mouseenter', stopAlbumAutoPlay);
    album.addEventListener('mouseleave', startAlbumAutoPlay);
    album.addEventListener('focusin', stopAlbumAutoPlay);
    album.addEventListener('focusout', (event) => { if (!album.contains(event.relatedTarget)) startAlbumAutoPlay(); });
    startAlbumAutoPlay();
  }

  // Lightweight ambient score built with Web Audio so the invite works without a hosted audio file.
  const soundButton = document.querySelector('[data-sound-toggle]');
  let audioContext;
  let master;
  let timer;
  let playing = false;
  const notes = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23];
  const playNote = (frequency, when) => {
    if (!audioContext || !master) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.045, when + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 3.2);
    osc.connect(gain).connect(master);
    osc.start(when);
    osc.stop(when + 3.3);
  };
  const scheduleScore = () => {
    if (!playing || !audioContext) return;
    const now = audioContext.currentTime + 0.05;
    notes.forEach((note, index) => playNote(note, now + index * 1.7));
    timer = window.setTimeout(scheduleScore, notes.length * 1700 - 120);
  };
  const startScore = () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    master = audioContext.createGain();
    master.gain.value = 0.4;
    master.connect(audioContext.destination);
    playing = true;
    soundButton?.classList.add('is-playing');
    soundButton?.setAttribute('aria-pressed', 'true');
    soundButton?.setAttribute('title', '关闭背景音乐');
    if (soundButton) soundButton.innerHTML = '<i data-lucide="volume-x" aria-hidden="true"></i><span class="sound-label">静音</span>';
    if (window.lucide) window.lucide.createIcons();
    scheduleScore();
  };
  const stopScore = () => {
    playing = false;
    window.clearTimeout(timer);
    if (master) master.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);
    soundButton?.classList.remove('is-playing');
    soundButton?.setAttribute('aria-pressed', 'false');
    soundButton?.setAttribute('title', '播放背景音乐');
    if (soundButton) soundButton.innerHTML = '<i data-lucide="volume-2" aria-hidden="true"></i><span class="sound-label">声音</span>';
    if (window.lucide) window.lucide.createIcons();
  };
  soundButton?.addEventListener('click', () => {
    if (!playing) startScore(); else stopScore();
  });

  const form = document.querySelector('[data-rsvp-form]');
  const status = document.querySelector('[data-form-status]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    if (!name) return;
    status.textContent = `谢谢你，${name}！我们已经收到你的回执。`;
    form.reset();
    window.setTimeout(() => { status.textContent = ''; }, 6000);
  });

  // Three.js particles: warm dust motes drifting through the invitation atmosphere.
  const canvas = document.getElementById('particle-canvas');
  if (!canvas || !window.THREE || reduceMotion) return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 1, 1600);
  camera.position.z = 540;
  const count = window.innerWidth < 700 ? 260 : 460;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 980;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 980;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 750;
    sizes[i] = Math.random() * 2.2 + 0.55;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.PointsMaterial({ color: 0xd9b982, size: 2.2, sizeAttenuation: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  let frame;
  const animate = () => {
    frame = requestAnimationFrame(animate);
    points.rotation.y += 0.00022;
    points.rotation.x = Math.sin(performance.now() * 0.00008) * 0.08;
    renderer.render(scene, camera);
  };
  animate();
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
})();
