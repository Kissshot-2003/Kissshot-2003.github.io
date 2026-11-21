/* ============================================================
   洛橙 · 个人主页 · 交互
   无依赖、无追踪。所有动效尊重 prefers-reduced-motion。
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isCoarse = window.matchMedia('(pointer: coarse)');

  /* ── 主题 ─────────────────────────────────────────── */
  var themeBtn = document.getElementById('themeBtn');
  var sbMode = document.getElementById('sbMode');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function syncTheme() {
    var t = currentTheme();
    if (sbMode) sbMode.textContent = t.toUpperCase();
    if (themeMeta) themeMeta.setAttribute('content', t === 'dark' ? '#0a0a0b' : '#f5f5f1');
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'dark' ? '切换到浅色' : '切换到深色');
  }

  function setTheme(t) {
    if (t === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('lc-theme', t); } catch (e) {}
    syncTheme();
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }
  syncTheme();

  /* ── 状态栏时钟（东八区）──────────────────────────── */
  var sbClock = document.getElementById('sbClock');
  var clockFmt;
  try {
    clockFmt = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
  } catch (e) {
    clockFmt = null;
  }
  function tickClock() {
    if (!sbClock) return;
    var d = new Date();
    if (clockFmt) {
      sbClock.textContent = clockFmt.format(d);
    } else {
      sbClock.textContent = d.toTimeString().slice(0, 8);
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ── 视口尺寸 ─────────────────────────────────────── */
  var sbView = document.getElementById('sbView');
  function tickView() {
    if (sbView) sbView.textContent = window.innerWidth + '×' + window.innerHeight;
  }
  tickView();

  /* ── 滚动进度 / 当前章节 ──────────────────────────── */
  var progress = document.getElementById('progress');
  var sbSection = document.getElementById('sbSection');
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.topnav a[data-nav]'));
  var ticking = false;

  function chapterLabel(sec) {
    if (!sec) return '§00 封面';
    if (sec.id === 'top') return '§00 封面';
    var c = sec.getAttribute('data-chapter');
    return c ? '§' + c : '§--';
  }

  function updateOnScroll() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    if (progress) progress.style.width = pct.toFixed(2) + '%';

    var probe = window.scrollY + window.innerHeight * 0.32;
    var active = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= probe) active = sections[i];
    }
    if (sbSection) sbSection.textContent = chapterLabel(active);
    navLinks.forEach(function (a) {
      var on = active && active.id === a.getAttribute('data-nav');
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function requestScrollUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateOnScroll);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', function () {
    tickView();
    requestScrollUpdate();
  }, { passive: true });
  updateOnScroll();

  /* ── 滚动显现 ─────────────────────────────────────── */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          revealIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { revealIO.observe(el); });
  }

  /* ── 数字计数 ─────────────────────────────────────── */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion.matches) {
      el.textContent = target + suffix;
      return;
    }
    var start = performance.now();
    var dur = 900;
    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(frame);
  }

  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCount);
  } else {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          animateCount(en.target);
          countIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ── 项目手风琴 ───────────────────────────────────── */
  var projects = Array.prototype.slice.call(document.querySelectorAll('.project'));
  projects.forEach(function (item) {
    var head = item.querySelector('.project-head');
    if (!head) return;
    head.addEventListener('click', function () {
      var open = item.classList.contains('is-open');
      item.classList.toggle('is-open', !open);
      head.setAttribute('aria-expanded', String(!open));
    });
  });

  /* ── 项目筛选 ─────────────────────────────────────── */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  var listEmpty = document.getElementById('listEmpty');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        c.classList.toggle('is-active', c === chip);
      });
      var shown = 0;
      projects.forEach(function (p) {
        var cats = (p.getAttribute('data-cat') || '').split(/\s+/);
        var on = filter === 'all' || cats.indexOf(filter) !== -1;
        p.classList.toggle('is-hidden', !on);
        if (on) shown++;
      });
      if (listEmpty) listEmpty.hidden = shown !== 0;
    });
  });

  /* ── 终端打字 ─────────────────────────────────────── */
  var term = document.getElementById('term');
  if (term) {
    var cmds = Array.prototype.slice.call(term.querySelectorAll('[data-type]'));
    var outs = Array.prototype.slice.call(term.querySelectorAll('.out'));

    if (reduceMotion.matches) {
      cmds.forEach(function (c) { c.textContent = c.getAttribute('data-type'); });
      outs.forEach(function (o) { o.classList.add('is-visible'); });
    } else {
      var ci = 0;
      function typeCommand() {
        if (ci >= cmds.length) return;
        var el = cmds[ci];
        var text = el.getAttribute('data-type');
        var out = outs[ci];
        var i = 0;
        var timer = setInterval(function () {
          i++;
          el.textContent = text.slice(0, i);
          if (i >= text.length) {
            clearInterval(timer);
            if (out) setTimeout(function () { out.classList.add('is-visible'); }, 110);
            ci++;
            if (ci < cmds.length) {
              var p = cmds[ci].closest('p');
              if (p) p.style.opacity = '0';
              setTimeout(function () {
                if (p) {
                  p.style.transition = 'opacity .18s';
                  p.style.opacity = '1';
                }
                typeCommand();
              }, 330);
            }
          }
        }, 34);
      }
      typeCommand();
    }
  }

  /* ── 光标辉光 ─────────────────────────────────────── */
  var spotlight = document.getElementById('spotlight');
  if (spotlight && !reduceMotion.matches && !isCoarse.matches) {
    var sx = 0, sy = 0, cx = 0, cy = 0, spotRaf = null, spotOn = false;
    function spotStep() {
      cx += (sx - cx) * 0.12;
      cy += (sy - cy) * 0.12;
      spotlight.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(sx - cx) > 0.5 || Math.abs(sy - cy) > 0.5) {
        spotRaf = requestAnimationFrame(spotStep);
      } else {
        spotRaf = null;
      }
    }
    window.addEventListener('pointermove', function (e) {
      sx = e.clientX; sy = e.clientY;
      if (!spotOn) { spotlight.classList.add('is-on'); spotOn = true; }
      if (!spotRaf) spotRaf = requestAnimationFrame(spotStep);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { spotlight.classList.remove('is-on'); });
  }

  /* ── 打印 ─────────────────────────────────────────── */
  var printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function () { window.print(); });
  }

  /* ── 命令面板 ─────────────────────────────────────── */
  var backdrop = document.getElementById('paletteBackdrop');
  var input = document.getElementById('paletteInput');
  var list = document.getElementById('paletteList');
  var openBtn = document.getElementById('paletteBtn');

  var commands = [
    { id: 'profile', label: '概览', hint: '§01', keywords: 'profile about 概览 关于', run: function () { go('#profile'); } },
    { id: 'experience', label: '履历', hint: '§02', keywords: 'experience work 履历 工作', run: function () { go('#experience'); } },
    { id: 'projects', label: '项目档案', hint: '§03', keywords: 'projects 项目 作品', run: function () { go('#projects'); } },
    { id: 'stack', label: '能力矩阵', hint: '§04', keywords: 'stack skills 能力 技能', run: function () { go('#stack'); } },
    { id: 'education', label: '教育背景', hint: '§05', keywords: 'education 教育 学校', run: function () { go('#education'); } },
    { id: 'contact', label: '联系', hint: '§06', keywords: 'contact github 联系 主页', run: function () { go('#contact'); } },
    { id: 'github', label: '打开 GitHub', hint: 'EXTERNAL', keywords: 'github 开源 code 主页', run: function () { window.open('https://github.com/Kissshot-2003', '_blank', 'noopener'); closePalette(); } },
    { id: 'theme', label: '切换深浅色', hint: 'TOGGLE', keywords: 'theme dark light 主题 深色 浅色', run: function () { setTheme(currentTheme() === 'dark' ? 'light' : 'dark'); closePalette(); } },
    { id: 'print', label: '打印 / 存为 PDF', hint: 'ACTION', keywords: 'print pdf 打印 简历', run: function () { closePalette(); setTimeout(function () { window.print(); }, 120); } },
    { id: 'top', label: '回到顶部', hint: 'TOP', keywords: 'top 顶部 开头', run: function () { go('#top'); } }
  ];

  function go(hash) {
    closePalette();
    var el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', hash);
  }

  var filtered = commands.slice();
  var activeIndex = 0;
  var lastFocus = null;

  function renderPalette() {
    if (!list) return;
    list.innerHTML = '';
    if (!filtered.length) {
      var empty = document.createElement('li');
      empty.className = 'palette-empty';
      empty.textContent = '// 没有匹配的命令';
      list.appendChild(empty);
      return;
    }
    if (activeIndex >= filtered.length) activeIndex = 0;
    filtered.forEach(function (cmd, i) {
      var li = document.createElement('li');
      li.className = 'palette-item' + (i === activeIndex ? ' is-active' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
      li.dataset.index = String(i);
      li.innerHTML =
        '<span class="pi-idx">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="pi-label">' + cmd.label + '<small>' + cmd.id + '</small></span>' +
        '<span class="pi-hint">' + cmd.hint + '</span>';
      li.addEventListener('mouseenter', function () {
        activeIndex = i;
        updatePaletteActive();
      });
      li.addEventListener('click', function () {
        cmd.run();
      });
      list.appendChild(li);
    });
  }

  function updatePaletteActive() {
    if (!list) return;
    var items = list.querySelectorAll('.palette-item');
    for (var i = 0; i < items.length; i++) {
      var on = i === activeIndex;
      items[i].classList.toggle('is-active', on);
      items[i].setAttribute('aria-selected', on ? 'true' : 'false');
    }
    var el = items[activeIndex];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  function filterPalette(q) {
    var s = q.trim().toLowerCase();
    filtered = !s ? commands.slice() : commands.filter(function (c) {
      return (c.label + ' ' + c.id + ' ' + c.keywords).toLowerCase().indexOf(s) !== -1;
    });
    activeIndex = 0;
    renderPalette();
  }

  function openPalette() {
    if (!backdrop) return;
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    if (input) {
      input.value = '';
      setTimeout(function () { input.focus(); }, 20);
    }
    filterPalette('');
  }

  function closePalette() {
    if (!backdrop || backdrop.hidden) return;
    backdrop.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (openBtn) openBtn.addEventListener('click', openPalette);

  if (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closePalette();
    });
  }

  if (input) {
    input.addEventListener('input', function () { filterPalette(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filtered.length) { activeIndex = (activeIndex + 1) % filtered.length; updatePaletteActive(); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filtered.length) { activeIndex = (activeIndex - 1 + filtered.length) % filtered.length; updatePaletteActive(); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var cmd = filtered[activeIndex];
        if (cmd) cmd.run();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (backdrop && backdrop.hidden) openPalette();
      else closePalette();
    } else if (e.key === 'Escape' && backdrop && !backdrop.hidden) {
      closePalette();
    }
  });

  /* ── 外链安全 ─────────────────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll('a[target="_blank"]'), function (a) {
    if (!a.rel) a.rel = 'noopener';
  });
})();
