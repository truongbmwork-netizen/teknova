/**
 * Motion.dev Snappy Button Hover Engine
 * High-performance, crisp, decisive hover & press animations
 * Optimized for instant response (<160ms) with zero sluggishness
 */
import { animate, hover } from './assets/js/motion.esm.js';

window.Motion = { animate, hover };

// Inject style to strip transform from CSS transition-all so Motion drives 100% of transforms with zero lag
function injectDecisiveStyles() {
  const styleId = 'motion-decisive-button-styles';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    button,
    .glow-btn,
    .filter-btn,
    .filter-tab,
    a.bg-primary,
    #team-carousel-prev,
    #team-carousel-next,
    [data-motion-btn] {
      transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow !important;
      will-change: transform;
      transform-origin: center center;
    }
  `;
  document.head.appendChild(style);
}

const BUTTON_SELECTOR = [
  'button:not([disabled])',
  '.glow-btn',
  '.filter-btn',
  '.filter-tab',
  'a.bg-primary',
  'a[href*="Profile_2026.pdf"]',
  'a[href*="Teknova_Profile"]',
  'a[href*="#lien-he"]',
  'a[href*="duan.html"].rounded-xl',
  'a[href*="duan.html"].rounded-lg',
  '#team-carousel-prev',
  '#team-carousel-next',
  '[data-motion-btn]'
].join(', ');

const boundElements = new WeakSet();

function getTargetScale(el) {
  // Circular icon buttons (prev/next carousel, close buttons, modal icons)
  if (el.classList.contains('rounded-full') && el.offsetWidth <= 56) {
    return 1.14;
  }
  // Filter tabs & small action pills
  if (el.classList.contains('filter-btn') || el.classList.contains('filter-tab') || el.classList.contains('text-xs')) {
    return 1.06;
  }
  // Primary CTA buttons (Header, Hero, Banner)
  return 1.08;
}

export function attachMotionHover(el) {
  if (!el || boundElements.has(el)) return;
  if (el.getAttribute('aria-hidden') === 'true') return;
  
  // Skip plain text navigation links
  if (el.tagName === 'A' && !el.classList.contains('bg-primary') && !el.classList.contains('glow-btn') && !el.classList.contains('rounded-lg') && !el.classList.contains('rounded-xl') && !el.classList.contains('filter-btn') && !el.classList.contains('filter-tab')) {
    return;
  }

  boundElements.add(el);

  const targetScale = getTargetScale(el);

  // Snappy, decisive hover: fast 160ms with punchy spring bezier
  hover(el, (element) => {
    const origZIndex = element.style.zIndex;
    element.style.zIndex = '35';

    animate(element, { scale: targetScale }, {
      duration: 0.16, // ultra-fast & decisive
      easing: [0.175, 0.885, 0.32, 1.15] // punchy snap
    });

    return () => {
      animate(element, { scale: 1 }, {
        duration: 0.14, // instant return
        easing: [0.25, 1, 0.5, 1]
      }).then(() => {
        element.style.zIndex = origZIndex;
      });
    };
  });

  // Tactile instant press (80ms down, 120ms up)
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    animate(el, { scale: 0.94 }, { duration: 0.08, easing: 'ease-out' });
  }, { passive: true });

  el.addEventListener('pointerup', () => {
    animate(el, { scale: targetScale }, { duration: 0.12, easing: [0.175, 0.885, 0.32, 1.15] });
  }, { passive: true });

  el.addEventListener('pointercancel', () => {
    animate(el, { scale: 1 }, { duration: 0.12, easing: 'ease-out' });
  }, { passive: true });
}

export function initAllButtons() {
  injectDecisiveStyles();
  const elements = document.querySelectorAll(BUTTON_SELECTOR);
  elements.forEach(attachMotionHover);
}

function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        initAllButtons();
        break;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initAllButtons();
    observeDOM();
  });
} else {
  initAllButtons();
  observeDOM();
}
