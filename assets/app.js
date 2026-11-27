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

  /* ── 移动端目录 ───────────────────────────────────── */
  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
    function closeMobileNav() {
      mobileNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', '打开目录');
    }
    navToggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? '关闭目录' : '打开目录');
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMobileNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 680) closeMobileNav();
    });
  }

  /* ── 页脚年份：随年份自动更新 ───────────────────── */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── 顶栏状态 / 滚动进度 ──────────────────────────── */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a, .mobile-nav a'));
  var tocSections = tocLinks.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  }).filter(Boolean);
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0).toFixed(2) + '%';
    if (header) header.classList.toggle('is-scrolled', y > 20);
    // 目录高亮（右侧固定栏 / 移动端面板）：找到当前视口顶部所在的章节
    if (tocLinks.length) {
      var probe = y + window.innerHeight * 0.3;
      var current = null;
      for (var i = 0; i < tocSections.length; i++) {
        if (tocSections[i].offsetTop <= probe) current = tocSections[i].id;
      }
      tocLinks.forEach(function (a) {
        var on = current && a.getAttribute('href') === '#' + current;
        a.classList.toggle('active', !!on);
        if (on) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }
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
    // 有 data-since 的项按当前年份自动推算，避免逐年手改
    var since = parseInt(el.getAttribute('data-since'), 10);
    if (since) target = Math.max(0, new Date().getFullYear() - since);
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

  /* ── P3 终端：开机自检 + Bad Apple!! 剪影舞蹈 ────── */
  var p3Text = document.getElementById('p3Text');
  if (p3Text) {
    var d = new Date();
    var stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

    // 开机自检日志（打字阶段）
    var lines = [
      '<span class="hi">P3 phosphor test pattern</span>',
      '',
      '<span class="dim">[  OK  ] warm boot ................. 1.42 s</span>',
      '<span class="dim">[  OK  ] tube bias .................. 62 V</span>',
      '<span class="dim">[ WARN ] no such device: /dev/radio0</span>',
      '',
      'colours 31-36: 31 32 33 34 35 36',
      '中文输出: 寿县项目 工程量清单 组价 ' + stamp,
      '',
      'Loading PROFILE.DAT <span class="dim">[████████████] 100%</span>',
      ''
    ];

    // 签名帧：头像磷光像素画 + 「洛橙」点阵大字
    // （由 assets/avatar.png 与 SimHei 点阵离线生成，▀▄ 双行打包）
    var SIG_AVATAR = [
      "  ▄▄▄▄███  ▄▄▄████▄▄▄▄▄ ▄▄",
      "▄███████████████████████████",
      "███  ██████████████████████▀",
      "███ ▄███████████████████████",
      " ███████████████████████████",
      " ▄██████████████████████████",
      "███████████████████████████",
      "▀▀  ████▄█████████▀█████████",
      "    ████████████████████████",
      "   ▄███████████████████████",
      "▄ ▄██▀████████████████▀ ▀███",
      "███▀   ▀▄█████████▄█▀  ▄████",
      "████▄ ▄█████████████  ███▀██",
      "██ ██████████████████ ███▄ ▀"
    ];
    var SIG_NAME = [
      "  ▄▄▄     ███▀                   ███  ▄▄▄▄▄▄███▄██▀",
      "  ▀▀███  ███████████             ███     ███ ███▀ ▄",
      "       ▄█████▄  ███           ██████████▄██  ▀██▄██",
      " ██▄   ▀▀▀ ▀██▄██▀              ▄███  ▄███████████▄",
      " ▀▀███     ▄████▄▄              ████▄███▀       ▀▀█",
      "      ▄▄▄███▀▀ ▀▀███▄          ███████ ███▀▀▀▀▀▀██▀",
      "   ▄▄▄▀▀▀███████████▀         ██████▀▀ ███      ██",
      "  ▄██▀   ███     ███          ▀▀ ███   ▀███▀▀▀▀██▀",
      " ▄██▀    ███     ███             ███    ███▄  ███▀",
      "▄██▀     ███████████             ███ ▄▄▄▄███▄▄███▄▄",
      " ▀▀      ███     ███             ▀▀▀ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀"
    ];
    var SIG_W = 51;
    function sigWidth(s) {
      var w = 0;
      for (var i = 0; i < s.length; i++) w += s.charCodeAt(i) > 0x2e80 ? 2 : 1;
      return w;
    }
    function sigCenter(row, cls) {
      var lead = Math.max(0, Math.floor((SIG_W - sigWidth(row)) / 2));
      return '<span class="' + cls + '">' + ' '.repeat(lead) + row + '</span>';
    }

    function sigLines() {
      var out = [];
      SIG_AVATAR.forEach(function (r) { out.push(sigCenter(r, 'hi')); });
      out.push('');
      SIG_NAME.forEach(function (r) { out.push(sigCenter(r, 'hi')); });
      out.push('');
      out.push(sigCenter('@Kissshot-2003 · AI 应用工程师', 'dim'));
      return out;
    }

    function showWithCaret(html) {
      p3Text.innerHTML = html + '<span class="p3-caret"></span>';
    }

    if (reduce) {
      // 静态兜底：仅开机日志（不动，尊重 reduced-motion）
      p3Text.innerHTML = lines.join('\n') + '<span class="p3-caret"></span>';
    } else {
      var li = 0;
      function typeLine() {
        if (li >= lines.length) {
          // 日志完成：短暂停留后清屏，逐行打印签名
          window.setTimeout(showSignature, 700);
          return;
        }
        var line = lines[li];
        var plain = line.replace(/<[^>]*>/g, '');
        p3Text.innerHTML += (li ? '\n' : '') + line;
        li++;
        var delay = plain.length > 30 ? 150 : (li < 6 ? 110 : 90);
        window.setTimeout(typeLine, delay);
      }

      // 签名逐行打印（打印机效果），停留一段时间后清屏重播整个循环
      function showSignature() {
        var rows = sigLines();
        var i = 0;
        function step() {
          if (i >= rows.length) {
            window.setTimeout(function retry() {
              if (document.hidden) { window.setTimeout(retry, 4000); return; }
              p3Text.innerHTML = '';
              li = 0;
              typeLine();
            }, 7000);
            return;
          }
          var body = rows.slice(0, i + 1).join('\n');
          p3Text.innerHTML = '<span class="p3-art">' + body + '</span><span class="p3-caret"></span>';
          i++;
          window.setTimeout(step, 55);
        }
        step();
      }

      // 等开机动画（约 .9s）结束后开始打字
      window.setTimeout(typeLine, 1000);
    }
  }

  /* ── 外链安全 ─────────────────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll('a[target="_blank"]'), function (a) {
    if (!a.rel) a.rel = 'noopener';
  });
})();
