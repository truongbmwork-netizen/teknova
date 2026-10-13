/**
 * nav-router.js — Teknova Cross-Page Navigation & Preload Engine
 *
 * - Unified cross-page routing & active link highlighting
 * - Preload progress bar & smooth page transition (no jitter/flash)
 * - Browser prefetching for instant page transitions
 * - Mobile navigation drawer toggle
 */
(function () {
  'use strict';

  // ── Page map ──────────────────────────────────────────────────────────────
  const PAGE_MAP = {
    'trang-chu':          'index.html',
    'gioi-thieu':         'gioithieu.html',
    'linh-vuc-hoat-dong': 'lichvuc.html',
    'du-an-tieu-bieu':    'duan.html',
    'doi-ngu-chuyen-gia': 'gioithieu.html#doi-ngu',
    'lien-he':            'gioithieu.html#lien-he',
    'profile-pdf':        'Teknova_Profile_2026.pdf'
  };

  const SECTION_MAP = {
    'doi-ngu': '#doi-ngu, [data-path="doi-ngu-chuyen-gia"]',
    'lien-he': '#lien-he, #contact-form, #solutionConsultForm'
  };

  // ── Preload / Top Progress Bar ────────────────────────────────────────────
  let progressBar = null;
  let progressTimer = null;

  function ensureProgressBar() {
    progressBar = document.getElementById('top-progress-bar');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'top-progress-bar';
      document.body.prepend(progressBar);
    }
  }

  function startLoader() {
    ensureProgressBar();
    if (progressTimer) clearInterval(progressTimer);
    progressBar.style.opacity = '1';
    progressBar.style.width = '15%';

    let width = 15;
    progressTimer = setInterval(function () {
      if (width < 80) {
        width += Math.random() * 15;
        if (width > 80) width = 80;
        progressBar.style.width = width + '%';
      }
    }, 100);
  }

  function finishLoader() {
    ensureProgressBar();
    if (progressTimer) clearInterval(progressTimer);
    progressBar.style.width = '100%';
    setTimeout(function () {
      progressBar.style.opacity = '0';
      setTimeout(function () {
        progressBar.style.width = '0%';
      }, 300);
    }, 150);
  }

  function dismissPreloader() {
    const preloader = document.getElementById('page-preloader');
    if (preloader) {
      preloader.classList.add('loaded');
    }
    finishLoader();
  }

  // ── Prefetch internal pages for instant navigation ───────────────────────
  function prefetchTarget(href) {
    if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
    const url = href.split('#')[0];
    if (!url.endsWith('.html')) return;

    if (!document.querySelector('link[rel="prefetch"][href="' + url + '"]')) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    }
  }

  function prefetchAllPages() {
    const pages = ['index.html', 'gioithieu.html', 'lichvuc.html', 'duan.html'];
    pages.forEach(function (p) {
      prefetchTarget(p);
    });
  }

  // ── Apply routes to all [data-path] elements ──────────────────────────────
  function applyRoutes() {
    const basePath = getBasePath();
    const currentFile = getCurrentPage();

    document.querySelectorAll('[data-path]').forEach(function (el) {
      const path = el.getAttribute('data-path');
      if (!PAGE_MAP[path]) return;

      const target = PAGE_MAP[path];
      const targetFile = target.split('#')[0];
      const hash = target.split('#')[1];

      if (path === 'profile-pdf') {
        el.href = basePath + target;
        el.setAttribute('download', 'Teknova_Profile_2026.pdf');
        return;
      }

      // Prefetch on hover
      el.addEventListener('mouseenter', function () {
        prefetchTarget(basePath + targetFile);
      });

      if (currentFile === targetFile) {
        // Same page — smooth scroll to section
        el.href = hash ? ('#' + hash) : '#';
        el.addEventListener('click', function (e) {
          if (hash) {
            const sec = findSection(hash);
            if (sec) {
              e.preventDefault();
              sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          } else {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          closeMobileMenu();
        });
      } else {
        // Different page — navigate with smooth exit animation
        const destination = basePath + target;
        el.href = destination;

        el.addEventListener('click', function (e) {
          // If clicked with modifier key (new tab), let browser handle normally
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

          e.preventDefault();
          startLoader();
          document.body.classList.add('page-leaving');
          closeMobileMenu();

          setTimeout(function () {
            window.location.href = destination;
          }, 80);
        });
      }
    });
  }

  // ── Find section element by hash ─────────────────────────────────────────
  function findSection(hash) {
    let el = document.getElementById(hash);
    if (el) return el;

    const sel = SECTION_MAP[hash];
    if (sel) {
      el = document.querySelector(sel);
      if (el) return el;
    }

    const headings = document.querySelectorAll('h2, h3, h4, section');
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      if (h.textContent.toLowerCase().includes(hash.replace(/-/g, ' '))) return h;
    }
    return null;
  }

  // ── Helper paths ─────────────────────────────────────────────────────────
  function getCurrentPage() {
    let path = window.location.pathname.split('/').pop() || 'index.html';
    if (!path || path === '') path = 'index.html';
    if (path === 'trangchu.html') path = 'index.html';
    return path;
  }

  function getBasePath() {
    const parts = window.location.pathname.split('/');
    parts.pop();
    const dir = parts.join('/');
    return dir ? dir + '/' : './';
  }

  // ── On load: handle hash scroll ──────────────────────────────────────────
  function handleHashOnLoad() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    setTimeout(function () {
      const sec = findSection(hash);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  }

  // ── Highlight active nav link ─────────────────────────────────────────────
  function highlightActive() {
    const current = getCurrentPage();

    document.querySelectorAll('nav [data-path], #mobile-menu-drawer [data-path]').forEach(function (el) {
      const path = el.getAttribute('data-path');
      const target = (PAGE_MAP[path] || '').split('#')[0];
      const isMatch = (target === current) || (current === 'index.html' && path === 'trang-chu');

      if (isMatch) {
        el.classList.add('text-primary', 'font-bold');
        el.classList.remove('text-on-surface-variant');
        el.setAttribute('aria-current', 'page');
      } else {
        el.classList.remove('text-primary', 'font-bold');
        if (!el.classList.contains('glow-btn') && !el.classList.contains('bg-primary')) {
          el.classList.add('text-on-surface-variant');
        }
        el.removeAttribute('aria-current');
      }
    });
  }

  // ── Mobile Menu Drawer Toggle ─────────────────────────────────────────────
  function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const drawer = document.getElementById('mobile-menu-drawer');
    if (!btn || !drawer) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      drawer.classList.toggle('hidden');
    });

    document.addEventListener('click', function (e) {
      if (!drawer.classList.contains('hidden') && !drawer.contains(e.target) && e.target !== btn) {
        closeMobileMenu();
      }
    });
  }

  function closeMobileMenu() {
    const drawer = document.getElementById('mobile-menu-drawer');
    if (drawer) drawer.classList.add('hidden');
  }

  // ── Motion Number Trend Engine (motion.dev number-trend) ───────────────────
  const NUMBER_TREND_STYLES = `
    .motion-number-trend {
      display: inline-flex !important;
      align-items: baseline !important;
      justify-content: center !important;
      font-variant-numeric: tabular-nums !important;
      font-feature-settings: "tnum" !important;
      line-height: 1 !important;
      position: relative !important;
      letter-spacing: -0.02em;
      vertical-align: baseline !important;
      transition: filter 0.3s ease;
    }
    .motion-number-trend:hover {
      filter: drop-shadow(0 2px 8px rgba(0, 102, 204, 0.25));
    }
    .motion-digit-viewport {
      display: inline-block !important;
      height: 1em !important;
      line-height: 1em !important;
      overflow: hidden !important;
      vertical-align: baseline !important;
      position: relative !important;
      width: 1ch !important;
      text-align: center !important;
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%);
      mask-image: linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%);
    }
    .motion-digit-strip {
      display: flex !important;
      flex-direction: column !important;
      transform: translateY(0);
      will-change: transform;
      transition: transform 1.35s cubic-bezier(0.34, 1.35, 0.64, 1);
    }
    .motion-digit-item {
      height: 1em !important;
      line-height: 1em !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      user-select: none !important;
    }
    .motion-char-static {
      display: inline-block !important;
      height: 1em !important;
      line-height: 1em !important;
      vertical-align: baseline !important;
      transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .motion-trend-pop {
      animation: motionTrendPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes motionTrendPop {
      0% { transform: scale(0.65) translateY(4px); opacity: 0; }
      70% { transform: scale(1.18) translateY(-2px); opacity: 1; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }
  `;

  function injectNumberTrendStyles() {
    if (document.getElementById('motion-number-trend-styles')) return;
    const style = document.createElement('style');
    style.id = 'motion-number-trend-styles';
    style.textContent = NUMBER_TREND_STYLES;
    document.head.appendChild(style);
  }

  function initNumberTrends() {
    injectNumberTrendStyles();
    const elements = document.querySelectorAll('.font-metric-stat, [data-number-trend]');
    if (!elements.length) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (el._motionAnimate) {
            el._motionAnimate();
            observer.unobserve(el);
          }
        }
      });
    }, { threshold: 0.15 });

    elements.forEach(function (el, index) {
      if (el._motionSetup) return;
      el._motionSetup = true;

      const raw = el.getAttribute('data-raw') || el.textContent.trim();
      el.setAttribute('data-raw', raw);
      el.setAttribute('aria-label', raw);

      el.classList.add('motion-number-trend');
      el.innerHTML = '';

      const digitStrips = [];
      const staticChars = [];

      Array.from(raw).forEach(function (ch) {
        if (/[0-9]/.test(ch)) {
          const targetDigit = parseInt(ch, 10);
          const viewport = document.createElement('span');
          viewport.className = 'motion-digit-viewport';
          viewport.setAttribute('aria-hidden', 'true');

          const strip = document.createElement('span');
          strip.className = 'motion-digit-strip';

          const targetIndex = 10 + targetDigit;
          for (let cycle = 0; cycle < 2; cycle++) {
            for (let d = 0; d <= 9; d++) {
              const item = document.createElement('span');
              item.className = 'motion-digit-item';
              item.textContent = d;
              strip.appendChild(item);
            }
          }
          const extra = document.createElement('span');
          extra.className = 'motion-digit-item';
          extra.textContent = (targetDigit + 1) % 10;
          strip.appendChild(extra);

          viewport.appendChild(strip);
          el.appendChild(viewport);
          digitStrips.push({ strip: strip, targetIndex: targetIndex });
        } else {
          const charSpan = document.createElement('span');
          charSpan.className = 'motion-char-static';
          charSpan.innerHTML = ch === ' ' ? '&nbsp;' : ch;
          charSpan.setAttribute('aria-hidden', 'true');
          el.appendChild(charSpan);
          staticChars.push(charSpan);
        }
      });

      if (prefersReducedMotion) {
        digitStrips.forEach(function (item) {
          item.strip.style.transition = 'none';
          item.strip.style.transform = 'translateY(-' + item.targetIndex + 'em)';
        });
        return;
      }

      let lastTrigger = 0;
      function animate() {
        const now = Date.now();
        if (now - lastTrigger < 500) return;
        lastTrigger = now;

        digitStrips.forEach(function (item) {
          item.strip.style.transition = 'none';
          item.strip.style.transform = 'translateY(0)';
        });
        staticChars.forEach(function (ch) {
          ch.classList.remove('motion-trend-pop');
          ch.style.opacity = '0.4';
        });

        void el.offsetHeight; // Reflow

        const baseDelay = (index % 4) * 110;
        digitStrips.forEach(function (item, idx) {
          const staggerDelay = baseDelay + (idx * 65);
          item.strip.style.transition = 'transform 1.35s cubic-bezier(0.34, 1.35, 0.64, 1) ' + staggerDelay + 'ms';
          item.strip.style.transform = 'translateY(-' + item.targetIndex + 'em)';
        });

        setTimeout(function () {
          staticChars.forEach(function (ch) {
            ch.classList.add('motion-trend-pop');
            ch.style.opacity = '1';
          });
        }, baseDelay + (digitStrips.length * 65) + 300);
      }

      el._motionAnimate = animate;

      // Card hover re-trigger
      const card = el.closest('div, section');
      if (card) {
        card.addEventListener('mouseenter', function () {
          animate();
        });
      }

      observer.observe(el);
    });
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  function boot() {
    applyRoutes();
    highlightActive();
    initMobileMenu();
    handleHashOnLoad();
    prefetchAllPages();
    initNumberTrends();

    // Dismiss preloader smoothly
    setTimeout(dismissPreloader, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Window load safety fallback
  window.addEventListener('load', function () {
    setTimeout(dismissPreloader, 100);
  });
})();
