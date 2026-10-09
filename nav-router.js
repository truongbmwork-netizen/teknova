/**
 * nav-router.js — Teknova Cross-Page Navigation
 *
 * Maps data-path values to actual HTML files.
 * Handles both header nav and any other [data-path] anchors on the page.
 */
(function () {
  // ── Page map ──────────────────────────────────────────────────────────────
  const PAGE_MAP = {
    'trang-chu':          'index.html',
    'gioi-thieu':         'gioithieu.html',
    'linh-vuc-hoat-dong': 'lichvuc.html',
    'du-an-tieu-bieu':    'duan.html',
    'doi-ngu-chuyen-gia': 'gioithieu.html#doi-ngu',
    'lien-he':            'gioithieu.html#lien-he',
  };

  // ── Section anchor ids on each page ──────────────────────────────────────
  // After page load, if the URL has a hash we scroll to that section.
  const SECTION_MAP = {
    'doi-ngu': '[data-path="doi-ngu-chuyen-gia"]',   // used to detect section on gioithieu
    'lien-he': '#contact-form, #solutionConsultForm', // contact form selector
  };

  // ── Apply hrefs to all [data-path] elements ───────────────────────────────
  function applyRoutes() {
    const basePath = getBasePath();

    document.querySelectorAll('[data-path]').forEach(function (el) {
      const path = el.getAttribute('data-path');
      if (!PAGE_MAP[path]) return;

      let target = PAGE_MAP[path];

      // If we're already on the target page, keep href="#" so it scrolls locally
      const currentFile = window.location.pathname.split('/').pop() || 'index.html';
      const targetFile  = target.split('#')[0];

      if (currentFile === targetFile) {
        // Same page — scroll to section
        const hash = target.split('#')[1];
        el.href = hash ? ('#' + hash) : '#';

        el.addEventListener('click', function (e) {
          if (hash) {
            const sec = findSection(hash);
            if (sec) {
              e.preventDefault();
              sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        });
      } else {
        // Different page — navigate with optional hash
        el.href = basePath + target;
      }
    });
  }

  // ── Find a section element by hash key ───────────────────────────────────
  function findSection(hash) {
    // Try id first
    let el = document.getElementById(hash);
    if (el) return el;

    // Try selector from SECTION_MAP
    const sel = SECTION_MAP[hash];
    if (sel) {
      el = document.querySelector(sel);
      if (el) return el;
    }

    // Fallback: scan headings for matching text
    const headings = document.querySelectorAll('h2, h3, h4, section');
    for (const h of headings) {
      if (h.textContent.toLowerCase().includes(hash.replace(/-/g, ' '))) return h;
    }
    return null;
  }

  // ── Resolve base path (handles GitHub Pages subdirectory) ────────────────
  function getBasePath() {
    const parts = window.location.pathname.split('/');
    parts.pop(); // remove filename
    const dir = parts.join('/');
    return dir ? dir + '/' : './';
  }

  // ── On load: scroll to hash section if present ───────────────────────────
  function handleHashOnLoad() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    setTimeout(function () {
      const sec = findSection(hash);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }

  // ── Highlight active nav link ─────────────────────────────────────────────
  function highlightActive() {
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav [data-path]').forEach(function (el) {
      const path   = el.getAttribute('data-path');
      const target = (PAGE_MAP[path] || '').split('#')[0];
      if (target === currentFile) {
        el.classList.add('text-primary', 'font-bold');
        el.classList.remove('text-on-surface-variant');
        el.setAttribute('aria-current', 'page');
      } else {
        el.classList.remove('text-primary', 'font-bold');
        if (!el.classList.contains('glow-btn')) {
          el.classList.add('text-on-surface-variant');
        }
        el.removeAttribute('aria-current');
      }
    });
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function boot() {
    applyRoutes();
    highlightActive();
    handleHashOnLoad();
  }
})();
