'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const autoVideos = [...document.querySelectorAll('video.auto-video')];
const inView = new Set();
const userPaused = new WeakSet();
function loadVideo(video) {
  if (video.dataset.src) { video.preload = 'metadata'; video.src = video.dataset.src; delete video.dataset.src; video.load(); }
}
function playQuietly(video) { loadVideo(video); const p = video.play(); if (p) p.catch(() => {}); }
let internalPause = new WeakSet();
function pauseVideo(video) { if (!video.paused) { internalPause.add(video); video.pause(); } }
autoVideos.forEach(video => {
  video.addEventListener('pause', () => {
    if (internalPause.has(video)) internalPause.delete(video);
    else if (inView.has(video) && !video.ended) userPaused.add(video);
  });
  video.addEventListener('play', () => userPaused.delete(video));
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) { inView.add(video); loadVideo(video); if (video.dataset.autoplay !== 'false' && !reducedMotion.matches && !document.hidden && !userPaused.has(video)) playQuietly(video); }
      else { inView.delete(video); pauseVideo(video); }
    });
  }, { threshold: 0.18 });
  autoVideos.forEach(v => observer.observe(v));
} else autoVideos.forEach(loadVideo);
document.addEventListener('visibilitychange', () => {
  autoVideos.forEach(video => {
    if (document.hidden) pauseVideo(video);
    else if (video.dataset.autoplay !== 'false' && inView.has(video) && !reducedMotion.matches && !userPaused.has(video)) playQuietly(video);
  });
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) autoVideos.forEach(pauseVideo);
});
let framePending = false;
function updateProgress() { const total = document.documentElement.scrollHeight - window.innerHeight; document.querySelector('.reading-progress').style.width = (total > 0 ? Math.min(100, window.scrollY / total * 100) : 0) + '%'; framePending = false; }
window.addEventListener('scroll', () => { if (!framePending) { framePending = true; requestAnimationFrame(updateProgress); } }, {passive:true});
window.addEventListener('resize', updateProgress);
updateProgress();
