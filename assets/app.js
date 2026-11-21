/* ============================================================
   洛橙 · 个人主页 — 交互
   无依赖、无追踪，尊重 prefers-reduced-motion
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 主题 ─────────────────────────────────────────── */
  var themeBtn = document.getElementById('themeBtn');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function isDark() { return root.getAttribute('data-theme') === 'dark'; }

  function syncTheme() {
    if (themeMeta) themeMeta.setAttribute('content', isDark() ? '#111113' : '#fbfbfb');
    if (themeBtn) themeBtn.setAttribute('aria-label', isDark() ? '切换到浅色' : '切换到深色');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      if (next === 'dark') root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      try { localStorage.setItem('lc-theme', next); } catch (e) {}
      syncTheme();
    });
  }
  syncTheme();

  /* ── 顶栏状态 / 滚动进度 ──────────────────────────── */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0).toFixed(2) + '%';
    if (header) header.classList.toggle('is-scrolled', y > 20);
  }
  function requestScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll, { passive: true });
  onScroll();

  /* ── 滚动显现（同组错峰）─────────────────────────── */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  reveals.forEach(function (el) {
    var parent = el.parentElement;
    if (!parent) return;
    var sibs = Array.prototype.slice.call(parent.children).filter(function (c) {
      return c.classList && c.classList.contains('reveal');
    });
    var idx = sibs.indexOf(el);
    if (idx > 0) el.style.transitionDelay = Math.min(idx, 5) * 75 + 'ms';
  });

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* 兜底：快速滚动或跳转时，已进入/越过视口的内容强制显现 */
  function revealPassed() {
    var h = window.innerHeight;
    reveals.forEach(function (el) {
      if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < h) {
        el.classList.add('is-in');
      }
    });
  }
  window.addEventListener('scroll', revealPassed, { passive: true });
  window.addEventListener('resize', revealPassed, { passive: true });
  revealPassed();

  /* ── 数字计数 ─────────────────────────────────────── */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduce) { el.textContent = target; return; }
    var start = performance.now();
    var dur = 1100;
    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = target;
    }
    requestAnimationFrame(frame);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCount);
  } else {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ── 外链安全 ─────────────────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll('a[target="_blank"]'), function (a) {
    if (!a.rel) a.rel = 'noopener';
  });
})();
