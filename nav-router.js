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
              if (window.__lenis) {
                window.__lenis.scrollTo(sec, { offset: -90, duration: 1.15 });
              } else {
                sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          } else {
            e.preventDefault();
            if (window.__lenis) {
              window.__lenis.scrollTo(0, { duration: 1.0 });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
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
      if (sec) {
        if (window.__lenis) {
          window.__lenis.scrollTo(sec, { offset: -90, duration: 1.15 });
        } else {
          sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 300);
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
        el.classList.add('text-on-surface-variant');
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
    }
    .motion-digit-viewport {
      display: inline-block !important;
      height: 1em !important;
      line-height: 1em !important;
      overflow: hidden !important;
      clip-path: inset(0 0 0 0) !important;
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
          if (el._motionAnimate && !el._motionHasAnimated) {
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

      function animate() {
        if (el._motionHasAnimated) return;
        el._motionHasAnimated = true;

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

      // Run once immediately if already visible on page load, otherwise wait for scroll
      const rect = el.getBoundingClientRect();
      const inView = rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0;
      if (inView) {
        animate();
      } else {
        observer.observe(el);
      }
    });
  }

  // ── Motion Scroll Split Text Engine (motion.dev split-text) ───────────────
  const SPLIT_TEXT_STYLES = `
    .motion-split-word {
      display: inline-block !important;
      will-change: transform, opacity;
      transform: translateY(22px);
      opacity: 0;
      transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .motion-split-word.motion-split-in {
      transform: translateY(0) !important;
      opacity: 1 !important;
    }
    @media (prefers-reduced-motion: reduce) {
      .motion-split-word {
        transform: none !important;
        opacity: 1 !important;
        transition: none !important;
      }
    }
  `;

  function injectSplitTextStyles() {
    if (document.getElementById('motion-split-text-styles')) return;
    const style = document.createElement('style');
    style.id = 'motion-split-text-styles';
    style.textContent = SPLIT_TEXT_STYLES;
    document.head.appendChild(style);
  }

  function initSplitText() {
    injectSplitTextStyles();

    const targets = document.querySelectorAll('h1, h2, [data-split-text], .split-text');
    if (!targets.length) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const splitObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (el._motionSplitTrigger && !el._motionSplitHasAnimated) {
            el._motionSplitTrigger();
            splitObserver.unobserve(el);
          }
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    targets.forEach(function (el) {
      if (el._motionSplitDone || el.classList.contains('no-split') || el.classList.contains('font-metric-stat') || el.hasAttribute('data-number-trend')) return;
      el._motionSplitDone = true;

      // Preserve full accessible text for screen readers
      const fullText = el.textContent.replace(/\s+/g, ' ').trim();
      el.setAttribute('aria-label', fullText);

      const words = [];

      function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue;
          if (!text) return;

          const tokens = text.split(/(\s+)/);
          const frag = document.createDocumentFragment();

          tokens.forEach(function (token) {
            if (/^\s+$/.test(token)) {
              frag.appendChild(document.createTextNode(' '));
            } else if (token.length > 0) {
              const wordSpan = document.createElement('span');
              wordSpan.className = 'motion-split-word';
              wordSpan.setAttribute('aria-hidden', 'true');
              wordSpan.textContent = token;
              frag.appendChild(wordSpan);
              words.push(wordSpan);
            }
          });

          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.nodeName === 'BR') return;

          // Check if this element uses gradient text clipping (bg-clip-text)
          const isGradient = node.classList.contains('bg-clip-text') ||
                             node.classList.contains('text-transparent') ||
                             (window.getComputedStyle && (getComputedStyle(node).webkitBackgroundClip === 'text' || getComputedStyle(node).backgroundClip === 'text'));

          if (isGradient) {
            // Treat the gradient element as a single animated unit to preserve seamless background-clip
            node.classList.add('motion-split-word');
            node.setAttribute('aria-hidden', 'true');
            words.push(node);
          } else {
            // For standard styled spans, links or formatting, recurse into children
            Array.from(node.childNodes).forEach(function (child) {
              processNode(child);
            });
          }
        }
      }

      Array.from(el.childNodes).forEach(function (child) {
        processNode(child);
      });

      if (prefersReducedMotion) {
        words.forEach(function (w) {
          w.classList.add('motion-split-in');
        });
        return;
      }

      function triggerAnimation() {
        if (el._motionSplitHasAnimated) return;
        el._motionSplitHasAnimated = true;

        words.forEach(function (w, idx) {
          const delay = idx * 42; // 42ms stagger per word
          setTimeout(function () {
            w.classList.add('motion-split-in');
          }, delay);
        });
      }

      el._motionSplitTrigger = triggerAnimation;

      const rect = el.getBoundingClientRect();
      const inView = rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0;
      if (inView) {
        setTimeout(triggerAnimation, 220);
      } else {
        splitObserver.observe(el);
      }
    });
  }

  // ── Team Showcase Carousel Engine (Dynamic 12 Key Personnel) ──
  function initTeamCarousel() {
    const track = document.getElementById('team-carousel-track');
    const prevBtn = document.getElementById('team-carousel-prev');
    const nextBtn = document.getElementById('team-carousel-next');
    const counterEl = document.getElementById('team-carousel-counter');
    const dots = document.querySelectorAll('.team-dot');

    if (!track) return;

    function getCardWidth() {
      const card = track.querySelector('.team-card');
      if (!card) return 360;
      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap) || 24;
      return card.offsetWidth + gap;
    }

    const cards = track.querySelectorAll('.team-card');
    const totalCards = cards.length || 12;

    function scrollNext() {
      const cardWidth = getCardWidth();
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= maxScroll - 20) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }

    function scrollPrev() {
      const cardWidth = getCardWidth();
      if (track.scrollLeft <= 20) {
        const maxScroll = track.scrollWidth - track.clientWidth;
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      }
    }

    if (nextBtn) nextBtn.onclick = scrollNext;
    if (prevBtn) prevBtn.onclick = scrollPrev;

    let scrollTimeout = null;
    function updateActiveState() {
      const cardWidth = getCardWidth();
      if (!cardWidth) return;
      const activeIndex = Math.min(Math.max(0, Math.round(track.scrollLeft / cardWidth)), totalCards - 1);

      if (counterEl) {
        counterEl.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(totalCards).padStart(2, '0');
      }

      const allDots = document.querySelectorAll('.team-dot');
      allDots.forEach(function (dot, idx) {
        if (idx === activeIndex) {
          dot.className = 'team-dot w-7 h-2 rounded-full bg-primary transition-all duration-300 focus:outline-none';
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.className = 'team-dot w-2 h-2 rounded-full bg-outline-variant/40 hover:bg-outline-variant transition-all duration-300 focus:outline-none';
          dot.removeAttribute('aria-current');
        }
      });
    }

    track.addEventListener('scroll', function () {
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
      scrollTimeout = requestAnimationFrame(updateActiveState);
    }, { passive: true });

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-index'), 10);
        if (!isNaN(idx)) {
          const cardWidth = getCardWidth();
          track.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
        }
      });
    });
  }

  // ── Global Certificate / Document Modal Viewer ───────────────────
  window.openCertModal = function(imgSrc, title) {
    let modal = document.getElementById('certModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'certModal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-300';
      modal.innerHTML = `
        <div class="relative max-w-4xl max-h-[92vh] w-full bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-surface-container">
          <div class="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[22px]">verified</span>
              <h4 id="certModalTitle" class="font-headline-sm text-headline-sm text-on-surface font-bold truncate"></h4>
            </div>
            <button onclick="closeCertModal()" class="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-on-surface transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div class="p-3 overflow-auto flex items-center justify-center bg-black/5 min-h-[300px]">
            <img id="certModalImg" src="" alt="Văn bằng chứng chỉ" class="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-md" />
          </div>
          <div class="p-3 border-t border-surface-container bg-surface-container-low flex items-center justify-between text-[12px] text-secondary">
            <span>Nguồn: Hồ sơ năng lực Công ty Cổ phần Đổi mới Sáng tạo Teknova (2026)</span>
            <button onclick="closeCertModal()" class="px-3 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest font-medium transition-colors">Đóng</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) {
        if (e.target === this) closeCertModal();
      });
    }
    document.getElementById('certModalTitle').textContent = title || 'Văn bằng chứng chỉ nhân sự Teknova';
    document.getElementById('certModalImg').src = imgSrc;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  };

  window.closeCertModal = function() {
    const modal = document.getElementById('certModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };

  // ── Physics Inertia Smooth Scroll Engine (Pure Momentum, Zero Warp) ─────
  function initSmoothScroll() {
    if (!document.getElementById('teknova-lenis-styles')) {
      const style = document.createElement('style');
      style.id = 'teknova-lenis-styles';
      style.textContent = `
        html.lenis, html.lenis body {
          height: auto;
        }
        .lenis.lenis-smooth {
          scroll-behavior: auto !important;
        }
        .lenis.lenis-smooth [data-lenis-prevent] {
          overscroll-behavior: contain;
        }
        .lenis.lenis-stopped {
          overflow: hidden;
        }
        .lenis.lenis-scrolling iframe {
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }

    function setupLenis() {
      if (typeof Lenis === 'undefined') return;
      if (window.__lenis) return;

      const lenis = new Lenis({
        duration: 1.15,
        easing: function (t) {
          return Math.min(1, 1.001 - Math.pow(2, -10 * t));
        },
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        infinite: false
      });

      window.__lenis = lenis;

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    if (typeof Lenis !== 'undefined') {
      setupLenis();
    } else {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/lenis@1.1.18/dist/lenis.min.js';
      s.onload = setupLenis;
      document.head.appendChild(s);
    }
  }

  // ── 100% Synchronized Header Navigation ───────────────────────────────────
  function syncHeaderNav() {
    const desktopNav = document.querySelector('header nav');
    const mobileDrawer = document.getElementById('mobile-menu-drawer');

    const canonicalDesktopHtml = `
      <a class="font-medium whitespace-nowrap text-[13px] text-on-surface-variant hover:text-primary transition-colors" data-path="trang-chu" href="index.html">Trang chủ</a>
      <a class="font-medium whitespace-nowrap text-[13px] text-on-surface-variant hover:text-primary transition-colors" data-path="gioi-thieu" href="gioithieu.html">Giới thiệu</a>
      <a class="font-medium whitespace-nowrap text-[13px] text-on-surface-variant hover:text-primary transition-colors" data-path="linh-vuc-hoat-dong" href="lichvuc.html">Lĩnh vực hoạt động</a>
      <a class="font-medium whitespace-nowrap text-[13px] text-on-surface-variant hover:text-primary transition-colors" data-path="du-an-tieu-bieu" href="duan.html">Dự án tiêu biểu</a>
      <a class="font-medium whitespace-nowrap text-[13px] text-on-surface-variant hover:text-primary transition-colors" data-path="lien-he" href="gioithieu.html#lien-he">Liên hệ</a>
    `;

    const canonicalMobileHtml = `
      <a class="py-2 text-[13px] font-medium text-on-surface-variant hover:text-primary transition-colors border-b border-outline-variant/10" data-path="trang-chu" href="index.html">Trang chủ</a>
      <a class="py-2 text-[13px] font-medium text-on-surface-variant hover:text-primary transition-colors border-b border-outline-variant/10" data-path="gioi-thieu" href="gioithieu.html">Giới thiệu</a>
      <a class="py-2 text-[13px] font-medium text-on-surface-variant hover:text-primary transition-colors border-b border-outline-variant/10" data-path="linh-vuc-hoat-dong" href="lichvuc.html">Lĩnh vực hoạt động</a>
      <a class="py-2 text-[13px] font-medium text-on-surface-variant hover:text-primary transition-colors border-b border-outline-variant/10" data-path="du-an-tieu-bieu" href="duan.html">Dự án tiêu biểu</a>
      <a class="py-2 text-[13px] font-medium text-on-surface-variant hover:text-primary transition-colors border-b border-outline-variant/10" data-path="lien-he" href="gioithieu.html#lien-he">Liên hệ khảo sát</a>
    `;

    if (desktopNav) desktopNav.innerHTML = canonicalDesktopHtml.trim();
    if (mobileDrawer) mobileDrawer.innerHTML = canonicalMobileHtml.trim();
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  function boot() {
    syncHeaderNav();
    applyRoutes();
    highlightActive();
    initMobileMenu();
    handleHashOnLoad();
    prefetchAllPages();
    initNumberTrends();
    initSplitText();
    initTeamCarousel();
    initSmoothScroll();

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
