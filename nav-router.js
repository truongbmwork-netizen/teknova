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

  // ── Boot ─────────────────────────────────────────────────────────────────
  function boot() {
    applyRoutes();
    highlightActive();
    initMobileMenu();
    handleHashOnLoad();
    prefetchAllPages();

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
